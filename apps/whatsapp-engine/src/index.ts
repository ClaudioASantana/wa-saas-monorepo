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
