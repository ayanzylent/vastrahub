import type { FastifyRequest, FastifyReply } from 'fastify';
import { validateCart, createOrder, createBuyNowOrder } from './checkout.service.js';

export async function validate(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const result = await validateCart(userId);
  return reply.status(200).send({ success: true, data: result, statusCode: 200 });
}

export async function createOrderHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const body = request.body as {
    addressId: string;
    paymentMethod: 'razorpay' | 'icici' | 'cod';
    couponCode?: string;
    customerNotes?: string;
  };

  const result = await createOrder(userId, {
    addressId: body.addressId,
    couponCode: body.couponCode,
    paymentMethod: body.paymentMethod,
    customerNotes: body.customerNotes,
  });

  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}

export async function buyNowHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user!.id;
  const body = request.body as {
    skuId: string;
    quantity: number;
    addressId: string;
    paymentMethod: 'razorpay' | 'icici' | 'cod';
    couponCode?: string;
    customerNotes?: string;
  };

  const result = await createBuyNowOrder(userId, {
    skuId: body.skuId,
    quantity: body.quantity,
    addressId: body.addressId,
    paymentMethod: body.paymentMethod,
    couponCode: body.couponCode,
    customerNotes: body.customerNotes,
  });

  return reply.status(201).send({ success: true, data: result, statusCode: 201 });
}
