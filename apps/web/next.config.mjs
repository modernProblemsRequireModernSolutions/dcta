/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile the workspace shared package so its TS source is usable in the app.
  transpilePackages: ["@dcta/shared"],
};

export default nextConfig;
