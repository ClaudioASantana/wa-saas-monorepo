import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { usePostgresAuthState } from '../auth/usePostgresAuthState';
import { QueueService } from './QueueService';
import { Pool } from 'pg';

export class WhatsAppService {
  private sock: ReturnType<typeof makeWASocket> | null = null;
  private isConnecting: boolean = false;
  private pool: Pool;
  private queueService: QueueService;
  private instanceName: string;
  private qrTimeout: NodeJS.Timeout | null = null;

  public currentQr: string | null = null;
  public connectionStatus: string = 'disconnected';

  constructor(pool: Pool, queueService: QueueService, instanceName: string) {
    this.pool = pool;
    this.queueService = queueService;
    this.instanceName = instanceName;
  }

  public async init() {
    if (this.isConnecting || this.sock) return;
    this.isConnecting = true;
    this.connectionStatus = 'connecting';

    console.log(`Initializing WhatsApp Session for: ${this.instanceName}`);

    const { state, saveCreds } = await usePostgresAuthState(this.pool, this.instanceName);

    const { fetchLatestWaWebVersion } = await import('@whiskeysockets/baileys');
    const { version } = await fetchLatestWaWebVersion({});
    console.log('fetchLatestWaWebVersion:', version);

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      version: version,
      browser: ['FluxCRM', 'Chrome', '10.0.0'],
      markOnlineOnConnect: false,
      syncFullHistory: false,
      qrTimeout: 90_000,
      connectTimeoutMs: 120_000,
      keepAliveIntervalMs: 30_000,
      emitOwnEvents: false,
      shouldIgnoreJid: (jid) => jid.endsWith('@broadcast'),
      logger: pino({ level: 'debug' }) as any
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('messages.upsert', async (upsert) => {
      // Only process new messages, ignore history sync or appends
      if (upsert.type === 'notify') {
        for (const msg of upsert.messages) {
          await this.queueService.publishWebhookEvent('messages.upsert', this.instanceName, msg);
        }
      }
    });

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr, isNewLogin, isOnline } = update;

      console.log(`[${this.instanceName}] Connection update:`, {
        connection,
        isNewLogin,
        isOnline,
        hasQr: !!qr,
        errorCode: (lastDisconnect?.error as Boom)?.output?.statusCode,
        errorMsg: lastDisconnect?.error?.message
      });

      if (qr) {
        this.currentQr = qr;
        this.connectionStatus = 'qr';
        console.log(`[${this.instanceName}] 📬 New QR Code generated. Scan within 90s.`);
        qrcode.generate(qr, { small: true });
        
        this.queueService.publishWebhookEvent('qrcode.updated', this.instanceName, { qr });
      }

      if (connection === 'close') {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isConnectionLost = statusCode === 408 || lastDisconnect?.error?.message === 'Connection was lost';
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(`[${this.instanceName}] ❌ Connection closed:`, {
          reason: lastDisconnect?.error?.message,
          statusCode,
          DisconnectReason: Object.entries(DisconnectReason).find(([_, v]) => v === statusCode)?.[0],
          isConnectionLost,
          willReconnect: shouldReconnect
        });
        
        this.sock = null;
        this.isConnecting = false;
        this.currentQr = null;
        this.connectionStatus = 'disconnected';
        
        if (shouldReconnect) {
          const retryDelay = isConnectionLost ? 5000 : 2000;
          console.log(`[${this.instanceName}] 🔄 Reconnecting in ${retryDelay}ms...`);
          setTimeout(() => this.init(), retryDelay);
        } else {
          console.log(`[${this.instanceName}] 🚫 Logged out from WhatsApp. Manual reconnection required.`);
        }
      } else if (connection === 'open') {
        console.log(`[${this.instanceName}] ✅ WhatsApp connection opened successfully!`);
        this.isConnecting = false;
        this.currentQr = null;
        this.connectionStatus = 'connected';
      } else if (connection === 'connecting') {
        console.log(`[${this.instanceName}] 🔄 Connecting to WhatsApp...`);
        this.connectionStatus = 'connecting';
      }
      
      if (connection) {
        this.queueService.publishWebhookEvent('connection.update', this.instanceName, { state: connection });
      }
    });
  }

  public async sendMessage(to: string, text: string) {
    if (!this.sock || this.connectionStatus !== 'connected') {
      throw new Error('WhatsApp instance is not connected');
    }
    // Baileys requires the format phone@s.whatsapp.net
    const jid = to.includes('@') ? to : `${to}@s.whatsapp.net`;
    return await this.sock.sendMessage(jid, { text });
  }
  
  public async logout() {
    if (this.sock) {
      await this.sock.logout();
      this.sock = null;
    }
    this.connectionStatus = 'disconnected';
    this.currentQr = null;
  }
}
