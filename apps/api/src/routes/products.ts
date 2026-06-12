import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, redis } from '../server'

const CACHE_TTL = 300 // 5 minutes

export default async function productRoutes(app: FastifyInstance) {

  // GET /api/products — list with filters
  app.get('/', async (request: any) => {
    const { category, search, page = 1, limit = 12, sort = 'createdAt' } = request.query
    const cacheKey = `products:${JSON.stringify(request.query)}`

    // Check cache
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const where: any = { isActive: true }
    if (category) where.category = { slug: category }
    if (search) where.name = { contains: search, mode: 'insensitive' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy: { [sort]: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.product.count({ where })
    ])

    const result = {
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    }

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result))
    return result
  })

  // GET /api/products/:slug
  app.get('/:slug', async (request: any, reply) => {
    const cacheKey = `product:${request.params.slug}`
    const cached = await redis.get(cacheKey)
    if (cached) return JSON.parse(cached)

    const product = await prisma.product.findUnique({
      where: { slug: request.params.slug },
      include: { category: true }
    })

    if (!product) return reply.status(404).send({ error: 'Product not found' })

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(product))
    return product
  })

  // POST /api/products — admin only
  app.post('/', {
    preHandler: [(app as any).adminOnly]
  }, async (request: any, reply) => {
    const schema = z.object({
      name: z.string(),
      slug: z.string(),
      description: z.string(),
      price: z.number().positive(),
      comparePrice: z.number().optional(),
      imageUrl: z.string().url(),
      images: z.array(z.string()).default([]),
      stock: z.number().int().min(0),
      sku: z.string(),
      categoryId: z.string()
    })

    const data = schema.parse(request.body)
    const product = await prisma.product.create({ data })

    // Invalidate cache
    await redis.del('products:*')
    return reply.status(201).send(product)
  })

  // PATCH /api/products/:id — admin only
  app.patch('/:id', {
    preHandler: [(app as any).adminOnly]
  }, async (request: any) => {
    const product = await prisma.product.update({
      where: { id: request.params.id },
      data: request.body as any
    })
    await redis.del(`product:${product.slug}`)
    return product
  })

  // DELETE /api/products/:id — admin only
  app.delete('/:id', {
    preHandler: [(app as any).adminOnly]
  }, async (request: any, reply) => {
    await prisma.product.update({
      where: { id: request.params.id },
      data: { isActive: false }
    })
    return reply.status(204).send()
  })
}
