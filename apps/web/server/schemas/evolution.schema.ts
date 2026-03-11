import { z } from 'zod'

export const EvolutionMessageKeySchema = z.object({
  remoteJid: z.string(),
  fromMe: z.boolean(),
  id: z.string()
})

export const EvolutionMessageContentSchema = z.object({
  conversation: z.string().optional(),
  extendedTextMessage: z.object({
    text: z.string().optional()
  }).optional(),
  imageMessage: z.object({
    url: z.string().optional(),
    caption: z.string().optional(),
    mimetype: z.string().optional()
  }).optional(),
  audioMessage: z.object({
    url: z.string().optional(),
    mimetype: z.string().optional()
  }).optional(),
  documentMessage: z.object({
    url: z.string().optional(),
    mimetype: z.string().optional(),
    fileName: z.string().optional()
  }).optional()
})

export const EvolutionWebhookPayloadSchema = z.object({
  event: z.string(),
  instance: z.string(),
  data: z.any() // Event specific
})

export const EvolutionMessageUpsertDataSchema = z.object({
  key: EvolutionMessageKeySchema,
  message: EvolutionMessageContentSchema,
  pushName: z.string().optional(),
  messageTimestamp: z.number().optional()
})
