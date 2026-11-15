/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  // GitHub Pages serves this project at /<repo-name>/; the deploy workflow sets it.
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
};
export default nextConfig;
