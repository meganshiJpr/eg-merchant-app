/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The app calls the PHP backend directly from the browser (locked decision:
  // no Next server proxy). CORS must allow the app origin on the PHP side.
};
export default nextConfig;
