import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma, redis } from '../server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16'
})

const TAX_RATE = 0.18  // 18% GST
const SHIPPING_FEE = 99 // ₹99 flat shipping

export default async function orderRoutes(app: FastifyInstance) {

  // POST /api/orders/checkout — create order + Stripe payment intent
  app.post('/checkout', {
    preHandler: [(app as any).authenticate]
  }, async (request: any, reply) => {
    const { addressId } = z.object({
      addressId: z.string()
    }).parse(request.body)

    // Get cart
    const cartData = await redis.get(`cart:${request.user.id}`)
    const cartItems = cartData ? JSON.parse(cartData) : []
    if (cartItems.length === 0) {
      return reply.status(400).send({ error: 'Cart is empty' })
    }

    // Validate address
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: request.user.id }
    })
    if (!address) return reply.status(404).send({ error: 'Address not found' })

    // Fetch products + validate stock
    const products = await prisma.product.findMany({
      where: { id: { in: cartItems.map((i: any) => i.productId) }, isActive: true }
    })

    for (const item of cartItems) {
      const product = products.find(p => p.id === item.productId)
      if (!product) return reply.status(400).send({ error: `Product not found` })
      if (product.stock < item.quantity) {
        return reply.status(400).send({ error: `Insufficient stock for ${product.name}` })
      }
    }

    // Calculate totals
    const subtotal = cartItems.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId)!
      return sum + product.price * item.quantity
    }, 0)

    const tax = subtotal * TAX_RATE
    const shipping = SHIPPING_FEE
    const total = subtotal + tax + shipping

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // paise
      currency: 'inr',
      metadata: { orderNumber, userId: request.user.id }
    })

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: request.user.id,
        addressId,
        subtotal,
        tax,
        shipping,
        total,
        paymentIntentId: paymentIntent.id,
        items: {
          create: cartItems.map((item: any) => {
            const product = products.find(p => p.id === item.productId)!
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
              total: product.price * item.quantity
            }
          })
        }
      },
      include: { items: { include: { product: true } }, address: true }
    })

    // Decrement stock
    await Promise.all(cartItems.map((item: any) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      })
    ))

    // Clear cart
    await redis.del(`cart:${request.user.id}`)

    return {
      order,
      clientSecret: paymentIntent.client_secret
    }
  })

  // GET /api/orders — user's orders
  app.get('/', {
    preHandler: [(app as any).authenticate]
  }, async (request: any) => {
    const orders = await prisma.order.findMany({
      where: { userId: request.user.id },
      include: {
        items: { include: { product: { select: { name: true, imageUrl: true } } } },
        address: true
      },
      orderBy: { createdAt: 'desc' }
    })
    return orders
  })

  // GET /api/orders/:id
  app.get('/:id', {
    preHandler: [(app as any).authenticate]
  }, async (request: any, reply) => {
    const order = await prisma.order.findFirst({
      where: { id: request.params.id, userId: request.user.id },
      include: {
        items: { include: { product: true } },
        address: true
      }
    })
    if (!order) return reply.status(404).send({ error: 'Order not found' })
    return order
  })

  // GET /api/orders/admin/all — admin only
  app.get('/admin/all', {
    preHandler: [(app as any).adminOnly]
  }, async (request: any) => {
    const { page = 1, status } = request.query as any
    const where: any = {}
    if (status) where.status = status

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: { select: { name: true, email: true } }, items: true },
        orderBy: { createdAt: 'desc' },
        skip: (Number(page) - 1) * 20,
        take: 20
      }),
      prisma.order.count({ where })
    ])
    return { orders, total }
  })

  // PATCH /api/orders/:id/status — admin only
  app.patch('/:id/status', {
    preHandler: [(app as any).adminOnly]
  }, async (request: any) => {
    const { status } = request.body as any
    const order = await prisma.order.update({
      where: { id: request.params.id },
      data: { status }
    })
    return order
  })
}
