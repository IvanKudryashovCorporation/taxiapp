/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Backend по дефолту на http://127.0.0.1:8000 — proxy через rewrites,
  // чтобы CORS не мешал в dev.
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
    return [
      { source: "/api/backend/:path*", destination: `${backend}/api/:path*` },
    ];
  },
};

export default nextConfig;
