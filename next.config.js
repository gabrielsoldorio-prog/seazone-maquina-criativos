/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    GROQ_API_KEY:       process.env.GROQ_API_KEY,
    FAL_KEY:            process.env.FAL_KEY,
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  },
}

module.exports = nextConfig
