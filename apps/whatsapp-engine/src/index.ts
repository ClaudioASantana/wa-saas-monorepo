import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { InstanceManager } from './services/InstanceManager';
import { QueueService } from './services/QueueService';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const port = parseInt(process.env.PORT || '3001', 10);

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const queueService = new QueueService();
const instanceManager = new InstanceManager(supabase, queueService);

const server = Fastify({ logger: true });

// Register plugins
server.register(cors, { origin: true });

// Start queue workers to listen to commands from frontend
queueService.startCommandWorker(instanceManager);

// API Routes
server.post('/instances/:id/start', async (request) => {
  const { id } = request.params as { id: string };
  await instanceManager.startInstance(id);
  return { success: true, message: `Instance ${id} started or starting.` };
});

server.get('/instances/:id/status', async (request, reply) => {
  const { id } = request.params as { id: string };
  const instance = instanceManager.getInstance(id);
  
  if (!instance) {
    return reply.code(404).send({ error: 'Instance not found or not started' });
  }

  return {
    id,
    status: instance.connectionStatus,
    qr: instance.currentQr
  };
});

server.delete('/instances/:id/logout', async (request, reply) => {
  const { id } = request.params as { id: string };
  const success = await instanceManager.stopInstance(id);
  if (success) {
    return { success: true, message: `Instance ${id} logged out and stopped.` };
  }
  return reply.code(404).send({ error: 'Instance not found' });
});

const start = async () => {
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 WhatsApp Engine API listening on port ${port}`);
    
    // Auto-start default instance if set
    if (process.env.INSTANCE_NAME) {
      await instanceManager.startInstance(process.env.INSTANCE_NAME);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
