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
      browser: Browsers.macOS('Desktop'),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      logger: pino({ level: 'silent' }) as any
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
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.currentQr = qr;
        this.connectionStatus = 'qr';
        console.log(`[${this.instanceName}] 📬 New QR Code generated.`);
        // For development convenience in terminal:
        qrcode.generate(qr, { small: true });
        
        this.queueService.publishWebhookEvent('qrcode.updated', this.instanceName, { qr });
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log(`[${this.instanceName}] Connection closed due to`, lastDisconnect?.error, 'reconnecting:', shouldReconnect);
        
        this.sock = null;
        this.isConnecting = false;
        this.currentQr = null;
        this.connectionStatus = 'disconnected';
        
        if (shouldReconnect) {
          this.init();
        } else {
          console.log(`[${this.instanceName}] Logged out from WhatsApp.`);
        }
      } else if (connection === 'open') {
        console.log(`[${this.instanceName}] ✅ WhatsApp connection opened successfully!`);
        this.isConnecting = false;
        this.currentQr = null;
        this.connectionStatus = 'connected';
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
