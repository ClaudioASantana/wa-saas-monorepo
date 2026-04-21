import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import pino from 'pino';
import { Boom } from '@hapi/boom';

export class WhatsAppService {
  private sock: ReturnType<typeof makeWASocket> | null = null;
  private isConnecting: boolean = false;

  public async init() {
    if (this.isConnecting || this.sock) return;
    this.isConnecting = true;

    console.log('Initializing WhatsApp Session...');

    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

    this.sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      version: [2, 3000, 1033846690],
      logger: pino({ level: 'silent' }) as any
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('📬 Scan this QR Code to authenticate:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed due to', lastDisconnect?.error, 'reconnecting:', shouldReconnect);
        
        this.sock = null;
        this.isConnecting = false;
        
        if (shouldReconnect) {
          this.init();
        } else {
          console.log('Logged out from WhatsApp. Delete baileys_auth_info to scan a new code.');
        }
      } else if (connection === 'open') {
        console.log('✅ WhatsApp connection opened successfully!');
        this.isConnecting = false;
      }
    });
  }
}
