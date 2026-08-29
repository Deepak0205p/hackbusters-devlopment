/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
  // Static export only for production build (not during npm run dev)
  ...(isDev ? {} : {
    output: 'export',
    trailingSlash: true,
  }),
  images: {
    unoptimized: true
  },
  // In dev mode, proxy /api/* calls to FastAPI backend on port 8000
  ...(isDev ? {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    },
  } : {}),
};

export default nextConfig;

