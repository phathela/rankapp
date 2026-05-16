import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createCheckoutSession, constructWebhookEvent, handleWebhook } from '../services/stripe';

const prisma = new PrismaClient();

export async function createCheckout(req: Request, res: Response): Promise<void> {
  try {
    const { amountUsd } = req.body;
    const userId = req.user!.id;

    const result = await createCheckoutSession(amountUsd, userId);

    res.status(200).json({
      url: result.url,
      sessionId: result.sessionId,
    });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    if (error.message && error.message.includes('Minimum purchase')) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}

export async function webhook(req: Request, res: Response): Promise<void> {
  try {
    const sig = req.headers['stripe-signature'] as string;
    if (!sig) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    const event = constructWebhookEvent(req.body, sig);
    await handleWebhook(event);

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: `Webhook error: ${error.message}` });
  }
}

export async function transactionHistory(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { page: pageStr, limit: limitStr } = req.query;

    const page = Math.max(1, parseInt(pageStr as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr as string, 10) || 20));
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      transactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
}
