import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { plan, workspaceId } = body
  
  if (!plan || !workspaceId) {
    throw createError({ statusCode: 400, statusMessage: 'Plan and Workspace ID are required' })
  }

  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-10-16' as any, // using any to bypass strict type for this demo, or latest
  })

  const priceId = plan === 'pro' ? config.stripePricePro : config.stripePriceStarter

  if (!priceId) {
    throw createError({ statusCode: 500, statusMessage: 'Stripe prices not configured' })
  }

  // Get workspace to check if already has customer ID
  const supabase = await serverSupabaseClient<Database>(event)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('id', workspaceId)
    .single()

  let customerId = workspace?.stripe_customer_id

  if (!customerId) {
    // Create new customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        workspaceId,
      }
    })
    customerId = customer.id
    // Update workspace with customer id
    await supabase.from('workspaces').update({ stripe_customer_id: customerId } as any).eq('id', workspaceId)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${config.public.appUrl}/workspace/${workspaceId}/assinatura?success=true`,
    cancel_url: `${config.public.appUrl}/workspace/${workspaceId}/assinatura?canceled=true`,
    metadata: {
      workspaceId,
      plan,
    }
  })

  return { url: session.url }
})
