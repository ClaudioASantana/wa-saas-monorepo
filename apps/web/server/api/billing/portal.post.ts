import Stripe from 'stripe'
import { serverSupabaseUser, serverSupabaseClient } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const { workspaceId } = body

  if (!workspaceId) {
    throw createError({ statusCode: 400, statusMessage: 'Workspace ID is required' })
  }

  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripeSecretKey, {
    apiVersion: '2023-10-16' as any,
  })

  const supabase = await serverSupabaseClient<Database>(event)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('stripe_customer_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace?.stripe_customer_id) {
    throw createError({ statusCode: 400, statusMessage: 'Customer not found' })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${config.public.appUrl}/workspace/${workspaceId}/assinatura`,
  })

  return { url: session.url }
})
