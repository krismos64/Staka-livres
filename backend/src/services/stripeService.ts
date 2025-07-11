import Stripe from "stripe";

// Mode développement : si la clé Stripe n'est pas une vraie clé de test
const isDevelopmentMock =
  !process.env.STRIPE_SECRET_KEY ||
  !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");

let stripe: Stripe | null = null;

if (!isDevelopmentMock) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-05-28.basil",
  });
}

export const stripeService = {
  // Créer une session de paiement
  async createCheckoutSession(params: {
    priceId: string;
    userId: string;
    commandeId: string;
    successUrl: string;
    cancelUrl: string;
  }) {
    if (isDevelopmentMock) {
      // Mode mock pour le développement - redirection vers page de succès locale
      const sessionId = `cs_test_mock_${Date.now()}`;
      const connector = params.successUrl.includes("?") ? "&" : "?";
      const mockSession = {
        id: sessionId,
        url: `${params.successUrl}${connector}session_id=${sessionId}&mock=true`,
        payment_status: "unpaid",
        metadata: params,
      };

      console.log("🚧 [STRIPE MOCK] Session créée:", mockSession.id);
      console.log("🚧 [STRIPE MOCK] Redirection mock vers:", mockSession.url);
      return mockSession;
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    // Créer un prix à la volée pour 468€ (montant fixe pour test)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Correction de manuscrit",
              description: "Service de correction et relecture professionnelle",
            },
            unit_amount: 46800, // 468€ en centimes
          },
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
    if (isDevelopmentMock) {
      // Mode mock pour le développement
      const mockSession = {
        id: sessionId,
        payment_status: "paid",
        metadata: {
          userId: "mock-user-id",
          commandeId: "mock-commande-id",
        },
      };

      console.log("🚧 [STRIPE MOCK] Session récupérée:", sessionId);
      return mockSession;
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    return await stripe.checkout.sessions.retrieve(sessionId);
  },

  // Créer un client Stripe
  async createCustomer(email: string, name: string) {
    if (isDevelopmentMock) {
      // Mode mock pour le développement
      const mockCustomer = {
        id: `cus_mock_${Date.now()}`,
        email,
        name,
      };

      console.log("🚧 [STRIPE MOCK] Client créé:", mockCustomer.id);
      return mockCustomer;
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    return await stripe.customers.create({
      email,
      name,
    });
  },

  // Webhook signature verification
  constructEvent(body: Buffer, signature: string) {
    if (isDevelopmentMock) {
      // Mode mock pour le développement
      const mockEvent = {
        id: `evt_mock_${Date.now()}`,
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_mock",
            metadata: {
              userId: "mock-user-id",
              commandeId: "mock-commande-id",
            },
          },
        },
      };

      console.log("🚧 [STRIPE MOCK] Événement webhook:", mockEvent.type);
      return mockEvent;
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  },
};

// Log du mode de fonctionnement
if (isDevelopmentMock) {
  console.log("🚧 [STRIPE] Mode développement - Mock activé");
  console.log(
    "💡 [STRIPE] Pour utiliser Stripe réel, configurez STRIPE_SECRET_KEY=sk_test_..."
  );
} else {
  console.log("💳 [STRIPE] Mode production - API Stripe activée");
}

export default stripe;
