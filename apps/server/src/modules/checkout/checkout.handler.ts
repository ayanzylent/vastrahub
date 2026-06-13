import type { FastifyRequest, FastifyReply } from 'fastify';
import { validateCart, createOrder } from './checkout.service.js';

export async function validate(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const result = await validateCart(userId);
  return reply.status(200).send(result);
}

export async function createOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const body = request.body as {
    addressId: string;
    paymentMethod: 'razorpay' | 'cod';
    couponCode?: string;
    customerNotes?: string;
  };

  const result = await createOrder(userId, {
    addressId: body.addressId,
    couponCode: body.couponCode,
    paymentMethod: body.paymentMethod,
    customerNotes: body.customerNotes,
  });

  return reply.status(201).send(result);
}
