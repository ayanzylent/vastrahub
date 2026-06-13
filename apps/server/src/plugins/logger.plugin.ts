/**
 * Pino logger configuration for Fastify.
 * Pretty prints in development, JSON in production.
 */

import type { FastifyServerOptions } from 'fastify';

export function getLoggerConfig(nodeEnv: string): FastifyServerOptions['logger'] {
  if (nodeEnv === 'development') {
    return {
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true,
        },
      },
    };
  }

  // Production: JSON logging
  return {
    level: 'info',
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          remoteAddress: request.ip,
        };
      },
    },
  };
}
