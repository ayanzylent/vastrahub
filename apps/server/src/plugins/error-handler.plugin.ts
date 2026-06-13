/**
 * Global error handler plugin.
 * Maps AppError instances to proper HTTP responses.
 * Hides stack traces in production.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../lib/errors.js';
import { getConfig } from '../config/env.js';

export default fp(
  async function errorHandlerPlugin(fastify: FastifyInstance) {
    fastify.setErrorHandler(
      (error: FastifyError | AppError | Error, request: FastifyRequest, reply: FastifyReply) => {
        const config = getConfig();
        const isDev = config.NODE_ENV === 'development';

        // Handle AppError instances
        if (error instanceof AppError) {
          if (error.statusCode >= 500) {
            request.log.error({ err: error }, error.message);
          } else {
            request.log.warn({ err: error }, error.message);
          }

          return reply.status(error.statusCode).send({
            success: false,
            statusCode: error.statusCode,
            error: error.code ?? error.name,
            message: error.message,
            ...(isDev && error.details ? { details: error.details } : {}),
            ...(isDev ? { stack: error.stack } : {}),
          });
        }

        // Handle Fastify validation errors (from TypeBox / Ajv)
        if ('validation' in error && error.validation) {
          // Build a user-friendly message from validation details without leaking internals
          const fields = error.validation.map((v) => {
            const field = v.instancePath?.replace(/^\//, '').replace(/\//g, '.') || v.params?.missingProperty || 'input';
            return `${field}: ${v.message ?? 'invalid'}`;
          });

          return reply.status(400).send({
            success: false,
            statusCode: 400,
            error: 'VALIDATION_ERROR',
            message: fields.length > 0 ? fields.join('; ') : error.message,
          });
        }

        // Handle generic Fastify errors with statusCode
        if ('statusCode' in error && typeof error.statusCode === 'number') {
          const statusCode = error.statusCode;
          if (statusCode >= 500) {
            request.log.error({ err: error }, error.message);
          }

          return reply.status(statusCode).send({
            success: false,
            statusCode,
            error: error.code ?? 'ERROR',
            message: error.message,
            ...(isDev ? { stack: error.stack } : {}),
          });
        }

        // Unknown errors — treat as 500
        request.log.error({ err: error }, 'Unhandled error');

        return reply.status(500).send({
          success: false,
          statusCode: 500,
          error: 'INTERNAL_SERVER_ERROR',
          message: isDev ? error.message : 'An unexpected error occurred',
          ...(isDev ? { stack: error.stack } : {}),
        });
      },
    );

    // 404 handler
    fastify.setNotFoundHandler((_request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(404).send({
        success: false,
        statusCode: 404,
        error: 'NOT_FOUND',
        message: 'Route not found',
      });
    });
  },
  { name: 'error-handler-plugin' },
);
