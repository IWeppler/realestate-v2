"use server";

import { z } from "zod";
import { supabaseAdmin, nextAgentForLead } from "@/lib/supabase-admin";

// Server Action pública (visitante anónimo, sin sesión) -- usa
// service_role porque "leads" ya no acepta escrituras con la anon key
// (ver 20260915161219_fix_leads_pii_exposure.sql). La validación Zod de
// abajo es la única puerta de entrada, así que tiene que ser estricta.

// Schema de validación
const contactSchema = z.object({
  name: z.string().min(3),
  phone: z.string().min(8),
  email: z.string().email(),
  message: z.string().min(10),
  // Motivo elegido en el formulario; va al principio de la nota del lead.
  topic: z.enum(["Comprar", "Alquilar", "Vender", "Otra consulta"] as const).optional(),
});

type FormState = {
  success: boolean;
  message: string;
};

const FAILED = "No pudimos enviar tu mensaje. Probá de nuevo en unos minutos o escribinos por WhatsApp.";

export async function createContactLeadAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  // 1. Obtener datos del formulario
  const rawData = {
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    message: formData.get("message"),
    topic: formData.get("topic") || undefined,
  };

  // 2. Validar los datos
  const validation = contactSchema.safeParse(rawData);

  if (!validation.success) {
    return {
      success: false,
      message: "Datos inválidos. Revisa el formulario.",
    };
  }

  const { name, phone, email, message, topic } = validation.data;

  // 3. Asignar agente por round-robin (E0.4, ver lib/supabase-admin.ts).
  const agentId = await nextAgentForLead();

  if (!agentId) {
    console.error("Contacto: no se pudo asignar un agente.");
    return { success: false, message: FAILED };
  }

  // 4. Insertar el nuevo Lead de Contacto (el mensaje va a las notas)
  const { error: insertError } = await supabaseAdmin.from("leads").insert({
    name: name,
    phone: phone,
    email: email,
    notes: topic ? `MOTIVO: ${topic}\n\n${message}` : message,
    property_id: null,
    agent_id: agentId,
    status: "NUEVO",
    source: "CONTACTO", // Fuente: Formulario de Contacto
  });

  if (insertError) {
    // El detalle de la base queda en el log; al visitante, un mensaje claro.
    console.error("Error al guardar el contacto:", insertError.message);
    return { success: false, message: FAILED };
  }

  // 5. Éxito
  return {
    success: true,
    message: "¡Mensaje enviado! Te contactaremos a la brevedad.",
  };
}
