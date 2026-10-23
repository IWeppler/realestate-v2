import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel cobra cada combinación única de src + ancho + calidad + formato
    // que no esté en caché. Pocos anchos, una calidad y un formato = menos
    // variantes por foto.
    deviceSizes: [640, 1080, 1920, 2560],
    imageSizes: [96, 256],
    qualities: [75],
    formats: ["image/webp"],
    // Las fotos se suben con nombre único (uuid), nunca se sobrescriben:
    // cachear 31 días es seguro y evita re-transformar cada 4 h.
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nbiapbhfzfglrbhmproc.supabase.co",
        port: "",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
      },
    ],
  },
};

export default nextConfig;
