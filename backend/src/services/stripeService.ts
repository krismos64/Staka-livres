import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-05-28.basil",
});

export const stripeService = {
  // Créer une session de paiement
  async createCheckoutSession(params: {
    priceId: string;
    userId: string;
    commandeId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: params.userId,
        commandeId: params.commandeId,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    return session;
  },

  // Récupérer une session
  async retrieveSession(sessionId: string) {
    return await stripe.checkout.sessions.retrieve(sessionId);
  },

  // Créer un client Stripe
  async createCustomer(email: string, name: string) {
    return await stripe.customers.create({
      email,
      name,
    });
  },

  // Webhook signature verification
  constructEvent(body: Buffer, signature: string) {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  },
};

export default stripe;
