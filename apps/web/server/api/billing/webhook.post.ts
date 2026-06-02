import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-10-16' as any,
  })

  // To verify signature, we need raw body
  const payload = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')

  if (!payload || !signature) {
    throw createError({ statusCode: 400, statusMessage: 'Missing payload or signature' })
  }

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripeWebhookSecret
    )
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    throw createError({ statusCode: 400, statusMessage: `Webhook Error: ${err.message}` })
  }

  // Use service key since this is a background webhook
  const supabase = createClient<Database>(
    config.supabaseUrl,
    config.supabaseServiceKey
  )

  switch (stripeEvent.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
    case 'customer.subscription.created': {
      const subscription = stripeEvent.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      
      const plan = subscription.items.data[0]?.price.id === config.stripePricePro ? 'pro' : 'starter'
      const status = subscription.status

      await supabase
        .from('workspaces')
        .update({
          stripe_subscription_id: subscription.id,
          plan: plan,
          subscription_status: status,
        } as any)
        .eq('stripe_customer_id', customerId)
      break
    }
    case 'checkout.session.completed': {
      const checkoutSession = stripeEvent.data.object as Stripe.Checkout.Session
      if (checkoutSession.mode === 'subscription') {
        const customerId = checkoutSession.customer as string
        const workspaceId = checkoutSession.metadata?.workspaceId
        
        if (workspaceId) {
          // just to make sure we update the correct workspace if it wasn't set earlier
          await supabase
            .from('workspaces')
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: checkoutSession.subscription as string,
            } as any)
            .eq('id', workspaceId)
        }
      }
      break
    }
    default:
      console.log(`Unhandled event type ${stripeEvent.type}`)
  }

  return { received: true }
})
