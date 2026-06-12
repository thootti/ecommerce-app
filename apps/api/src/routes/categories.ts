import { FastifyInstance } from 'fastify'
import { prisma, redis } from '../server'

export default async function categoryRoutes(app: FastifyInstance) {

  app.get('/', async () => {
    const cached = await redis.get('categories')
    if (cached) return JSON.parse(cached)

    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' }
    })

    await redis.setex('categories', 600, JSON.stringify(categories))
    return categories
  })

  app.get('/:slug', async (request: any, reply) => {
    const category = await prisma.category.findUnique({
      where: { slug: request.params.slug }
    })
    if (!category) return reply.status(404).send({ error: 'Category not found' })
    return category
  })

  app.post('/', {
    preHandler: [(app as any).adminOnly]
  }, async (request: any, reply) => {
    const category = await prisma.category.create({ data: request.body as any })
    await redis.del('categories')
    return reply.status(201).send(category)
  })
}
