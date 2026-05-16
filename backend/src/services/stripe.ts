import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const RANK_PRICE_USD = 0.10; // 1 Rank = $0.10
const MINIMUM_PURCHASE_USD = 5;

let stripe: Stripe;

function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripe;
}

export async function createCheckoutSession(
  amountUsd: number,
  userId: string
): Promise<{ url: string | null; sessionId: string }> {
  if (amountUsd < MINIMUM_PURCHASE_USD) {
    throw new Error(`Minimum purchase is $${MINIMUM_PURCHASE_USD}.00 (${MINIMUM_PURCHASE_USD / RANK_PRICE_USD} Ranks)`);
  }

  const ranksAmount = Math.floor(amountUsd / RANK_PRICE_USD);
  const amountCents = Math.round(amountUsd * 100);

  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${ranksAmount} Ranks`,
            description: `Purchase ${ranksAmount} Ranks for voting on rankings`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/cancel`,
    metadata: {
      userId,
      ranksAmount: ranksAmount.toString(),
      amountUsd: amountUsd.toString(),
    },
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
}

export async function handleWebhook(event: Stripe.Event): Promise<void> {
  if (event.type !== 'checkout.session.completed') {
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata;

  if (!metadata || !metadata.userId || !metadata.ranksAmount) {
    console.error('Missing metadata in checkout session:', session.id);
    return;
  }

  const userId = metadata.userId;
  const ranksAmount = parseInt(metadata.ranksAmount, 10);
  const amountUsd = parseInt(metadata.amountUsd || '0', 10);
  const paymentIntentId = session.payment_intent as string;

  // Check if this transaction was already processed
  if (paymentIntentId) {
    const existing = await prisma.transaction.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    });
    if (existing) {
      console.log(`Transaction already processed for payment intent: ${paymentIntentId}`);
      return;
    }
  }

  // Create transaction and update user balance in a transaction
  await prisma.$transaction(async (tx) => {
    // Create transaction record
    await tx.transaction.create({
      data: {
        userId,
        amountRanks: ranksAmount,
        amountUsd,
        stripePaymentIntentId: paymentIntentId || null,
        status: 'Completed',
      },
    });

    // Update user ranks balance
    await tx.user.update({
      where: { id: userId },
      data: {
        ranksBalance: {
          increment: ranksAmount,
        },
      },
    });
  });

  console.log(`Successfully processed payment: ${ranksAmount} Ranks for user ${userId}`);
}

export function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
  }
  return getStripe().webhooks.constructEvent(body, signature, webhookSecret);
}
