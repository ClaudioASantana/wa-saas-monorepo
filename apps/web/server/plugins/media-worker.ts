import { mediaWorker } from '../utils/media-worker'
import { logger } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  logger.info('[Nitro] Initializing Media Worker...')
  
  // The worker starts automatically when imported if we want, 
  // but here we ensure it's loaded in the server context.
  
  nitroApp.hooks.hook('close', async () => {
    logger.info('[Nitro] Closing Media Worker...')
    await mediaWorker.close()
  })
})
