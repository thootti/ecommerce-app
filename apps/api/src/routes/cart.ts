import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma, redis } from '../server'

const getCartKey = (userId: string) => `cart:${userId}`

export default async function cartRoutes(app: FastifyInstance) {

  // GET /api/cart
  app.get('/', {
    preHandler: [(app as any).authenticate]
  }, async (request: any) => {
    const cartKey = getCartKey(request.user.id)
    const cartData = await redis.get(cartKey)
    const items = cartData ? JSON.parse(cartData) : []

    if (items.length === 0) return { items: [], subtotal: 0 }

    // Fetch current product details
    const products = await prisma.product.findMany({
      where: { id: { in: items.map((i: any) => i.productId) }, isActive: true }
    })

    const enriched = items
      .map((item: any) => {
        const product = products.find((p: any) => p.id === item.productId)
        if (!product) return null
        return {
          productId: item.productId,
          quantity: item.quantity,
          product: {
            name: product.name,
            slug: product.slug,
            price: product.price,
            imageUrl: product.imageUrl,
            stock: product.stock
          },
          total: product.price * item.quantity
        }
      })
      .filter(Boolean)

    const subtotal = enriched.reduce((sum: number, i: any) => sum + i.total, 0)
    return { items: enriched, subtotal }
  })

  // POST /api/cart/add
  app.post('/add', {
    preHandler: [(app as any).authenticate]
  }, async (request: any, reply) => {
    const { productId, quantity = 1 } = z.object({
      productId: z.string(),
      quantity: z.number().int().positive().default(1)
    }).parse(request.body)

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product || !product.isActive) {
      return reply.status(404).send({ error: 'Product not found' })
    }
    if (product.stock < quantity) {
      return reply.status(400).send({ error: 'Insufficient stock' })
    }

    const cartKey = getCartKey(request.user.id)
    const cartData = await redis.get(cartKey)
    const items = cartData ? JSON.parse(cartData) : []

    const existing = items.find((i: any) => i.productId === productId)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.push({ productId, quantity })
    }

    await redis.setex(cartKey, 86400 * 7, JSON.stringify(items)) // 7 days
    return { message: 'Added to cart', items }
  })

  // PATCH /api/cart/update
  app.patch('/update', {
    preHandler: [(app as any).authenticate]
  }, async (request: any) => {
    const { productId, quantity } = z.object({
      productId: z.string(),
      quantity: z.number().int().min(0)
    }).parse(request.body)

    const cartKey = getCartKey(request.user.id)
    const cartData = await redis.get(cartKey)
    let items = cartData ? JSON.parse(cartData) : []

    if (quantity === 0) {
      items = items.filter((i: any) => i.productId !== productId)
    } else {
      const item = items.find((i: any) => i.productId === productId)
      if (item) item.quantity = quantity
    }

    await redis.setex(cartKey, 86400 * 7, JSON.stringify(items))
    return { message: 'Cart updated', items }
  })

  // DELETE /api/cart/clear
  app.delete('/clear', {
    preHandler: [(app as any).authenticate]
  }, async (request: any) => {
    await redis.del(getCartKey(request.user.id))
    return { message: 'Cart cleared' }
  })
}
