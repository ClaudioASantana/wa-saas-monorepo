# WhatsApp Engine Base Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Create a standalone Node.js application (`whatsapp-engine`) dedicated to managing the Baileys WebSocket connection and generating the authentication QR Code in the terminal.

**Architecture:** We are creating a new microservice under `apps/whatsapp-engine`. This ensures the Baileys memory usage and socket connection are isolated from the main `api` workflow, following our Evolution API benchmark. We will use a standard Singleton or Service approach to instantiate Baileys and hook into its connection update events.

**Tech Stack:** Node.js, TypeScript, `@whiskeysockets/baileys`, `qrcode-terminal`, `pino`.

---

## Task 1: Scaffolding the App and Dependencies

**Files:**
- Create: `apps/whatsapp-engine/package.json`
- Create: `apps/whatsapp-engine/tsconfig.json`

**Step 1.1: Create application directory**
Run: `mkdir -p apps/whatsapp-engine/src && cd apps/whatsapp-engine`
Expected: Directory created without errors.

**Step 1.2: Create package.json**
```json
{
  "name": "@wa-saas/whatsapp-engine",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.0",
    "pino": "^8.20.0",
    "qrcode-terminal": "^0.12.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/qrcode-terminal": "^0.12.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.0"
  }
}
```

**Step 1.3: Run NPM Install**
Run: `cd apps/whatsapp-engine && npm install`
Expected: Dependencies installed and `node_modules` folder created inside the app.

**Step 1.4: Create tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}
```

---

## Task 2: Implementing the WhatsApp Session Manager Service

**Files:**
- Create: `apps/whatsapp-engine/src/services/WhatsAppService.ts`

**Step 2.1: Write the minimal Baileys session implementation**
```typescript
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
```

---

## Task 3: App Entry Point and Verification

**Files:**
- Create: `apps/whatsapp-engine/src/index.ts`

**Step 3.1: Write the application entry point**
```typescript
import { WhatsAppService } from './services/WhatsAppService';

const start = async () => {
  console.log('Starting WhatsApp Engine Base...');
  const waService = new WhatsAppService();
  
  try {
    await waService.init();
  } catch (error) {
    console.error('Failed to initialize WhatsApp Service:', error);
    process.exit(1);
  }
};

start();
```

**Step 3.2: Verify Execution**
Run: `cd apps/whatsapp-engine && npm run dev`
Expected: The process starts, installs multi-device files (in `baileys_auth_info`), and prints a QR Code in the terminal. Wait for QR Code to print, then stop the process with `CTRL+C` or similar.

**Step 3.3: Commit changes**
Run: `git add apps/whatsapp-engine/` and `git commit -m "feat(whatsapp-engine): scaffold initial Baileys whatsapp socket service"`
Expected: Code changes committed completely.
