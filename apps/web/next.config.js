/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      `${process.env.S3_BUCKET}.s3.ap-south-1.amazonaws.com`,
      'ecommerce-dev-assets-efcb3b7c.s3.ap-south-1.amazonaws.com'
    ]
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY
  }
}

module.exports = nextConfig
