import 'dotenv/config';
import { Pool } from 'pg';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { InstanceManager } from './services/InstanceManager';
import { QueueService } from './services/QueueService';

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5449/flux-crm';

const pool = new Pool({
  connectionString: dbUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const port = parseInt(process.env.PORT || '3001', 10);
const queueService = new QueueService();
const instanceManager = new InstanceManager(pool, queueService);

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
