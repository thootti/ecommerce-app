import { FastifyInstance } from 'fastify'
import Stripe from 'stripe'
import { prisma } from '../server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16'
})

export default async function webhookRoutes(app: FastifyInstance) {

  // POST /api/webhooks/stripe
  app.post('/stripe', {
    config: { rawBody: true }
  }, async (request: any, reply) => {
    const sig = request.headers['stripe-signature']

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      )
    } catch (err: any) {
      return reply.status(400).send({ error: `Webhook Error: ${err.message}` })
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        await prisma.order.updateMany({
          where: { paymentIntentId: pi.id },
          data: {
            paymentStatus: 'PAID',
            status: 'CONFIRMED'
          }
        })
        app.log.info(`Payment succeeded for order: ${pi.metadata.orderNumber}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        await prisma.order.updateMany({
          where: { paymentIntentId: pi.id },
          data: { paymentStatus: 'FAILED' }
        })
        break
      }
    }

    return { received: true }
  })
}
