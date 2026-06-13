// Server entry point

import { buildApp } from './app.js';

async function main(): Promise<void> {
  let app;

  try {
    app = await buildApp();

    const port = app.config.PORT;
    const host = '0.0.0.0';

    await app.listen({ port, host });
    app.log.info(`🚀server running at http://localhost:${port}`);
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }

}

main();
