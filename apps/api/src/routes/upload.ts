import { FastifyInstance } from 'fastify'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' })

export default async function uploadRoutes(app: FastifyInstance) {

  // GET /api/upload/presigned — get presigned URL to upload directly to S3
  app.get('/presigned', {
    preHandler: [(app as any).adminOnly]
  }, async (request: any) => {
    const { filename, contentType } = z.object({
      filename: z.string(),
      contentType: z.string()
    }).parse(request.query)

    const key = `products/${Date.now()}-${filename}`

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      ContentType: contentType
    })

    const url = await getSignedUrl(s3, command, { expiresIn: 300 })

    return {
      uploadUrl: url,
      imageUrl: `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    }
  })
}
