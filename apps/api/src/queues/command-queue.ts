import { Queue } from 'bullmq'
import { redis } from '../config/redis'

// Fila usada para despachar comandos para o WhatsApp Engine
export const commandQueue = new Queue('whatsapp-commands', { connection: redis })
