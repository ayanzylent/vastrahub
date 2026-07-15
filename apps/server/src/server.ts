// Server entry point

import { buildApp } from './app.js';
import {
  startExpireInventoryHoldsJob,
  stopExpireInventoryHoldsJob,
} from './jobs/expire-inventory-holds.js';

async function main(): Promise<void> {
  let app;

  try {
    app = await buildApp();

    const port = app.config.PORT;
    const host = '0.0.0.0';

    const stopExpiryJob = startExpireInventoryHoldsJob(app.log);

    app.addHook('onClose', async () => {
      stopExpiryJob();
      stopExpireInventoryHoldsJob();
    });

    await app.listen({ port, host });
    app.log.info(`🚀server running at http://localhost:${port}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }

}

main();
