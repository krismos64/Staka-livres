import Stripe from "stripe";

// Mode développement : si la clé Stripe n'est pas une vraie clé de test
const isDevelopmentMock =
  !process.env.STRIPE_SECRET_KEY ||
  !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");

let stripe: Stripe | null = null;

if (!isDevelopmentMock) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-06-30.basil" as any,
  });
}

export const stripeService = {
  // Créer un prix dynamique pour un montant spécifique (non utilisé - prix dynamique via price_data)
  async createDynamicPrice(params: {
    amount: number;
    currency: string;
    productId: string;
    description: string;
  }) {
    if (isDevelopmentMock) {
      // Mode mock pour le développement
      const mockPrice = {
        id: `price_mock_${Date.now()}`,
        unit_amount: params.amount,
        currency: params.currency,
        product: params.productId,
        description: params.description
      };

      console.log("🚧 [STRIPE MOCK] Prix dynamique créé:", mockPrice.id, `${params.amount/100}€`);
      return mockPrice;
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    // Créer d'abord un produit, puis un prix
    const product = await stripe.products.create({
      name: params.description,
    });

    return await stripe.prices.create({
      unit_amount: params.amount,
      currency: params.currency,
      product: product.id,
    });
  },

  // Créer une session de paiement
  async createCheckoutSession(params: {
    priceId: string;
    userId: string;
    commandeId: string;
    successUrl: string;
    cancelUrl: string;
    amount?: number;
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

      const displayAmount = params.amount ? `${params.amount/100}€` : "montant dynamique";
      console.log("🚧 [STRIPE MOCK] Session créée:", mockSession.id, displayAmount);
      console.log("🚧 [STRIPE MOCK] Redirection mock vers:", mockSession.url);
      return mockSession;
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    // Créer une session avec le priceId fourni ou un prix dynamique
    const sessionConfig: any = {
      mode: "payment",
      metadata: {
        userId: params.userId,
        commandeId: params.commandeId,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    };

    // Si un prix fixe est fourni, l'utiliser
    if (params.priceId && params.priceId !== "default") {
      sessionConfig.line_items = [
        {
          price: params.priceId,
          quantity: 1,
        },
      ];
    } else {
      // Sinon, utiliser un prix dynamique (avec montant fourni ou 468€ par défaut)
      const amount = params.amount || 46800; // 468€ par défaut
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Correction de manuscrit",
              description: "Service de correction et relecture professionnelle",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

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

  // Définir un moyen de paiement par défaut
  async setDefaultPaymentMethod(paymentMethodId: string, customerEmail: string) {
    if (isDevelopmentMock) {
      // Mode mock pour le développement
      console.log("🚧 [STRIPE MOCK] Définition moyen de paiement par défaut:", paymentMethodId);
      return { success: true };
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    // Trouver le customer par email
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      throw new Error("Customer Stripe introuvable");
    }

    const customer = customers.data[0];

    // Mettre à jour le moyen de paiement par défaut
    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return { success: true };
  },

  // Détacher un moyen de paiement
  async detachPaymentMethod(paymentMethodId: string) {
    if (isDevelopmentMock) {
      // Mode mock pour le développement
      console.log("🚧 [STRIPE MOCK] Détachement moyen de paiement:", paymentMethodId);
      return { success: true };
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    await stripe.paymentMethods.detach(paymentMethodId);
    return { success: true };
  },

  // Créer un Setup Intent pour l'ajout de moyens de paiement
  async createSetupIntent(customerEmail: string) {
    if (isDevelopmentMock) {
      // Mode mock pour le développement
      const mockSetupIntent = {
        id: `seti_mock_${Date.now()}`,
        client_secret: `seti_mock_${Date.now()}_secret_mock`,
        status: 'requires_payment_method',
      };

      console.log("🚧 [STRIPE MOCK] Setup Intent créé:", mockSetupIntent.id);
      return mockSetupIntent;
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    // Trouver ou créer le customer
    let customer;
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (customers.data.length > 0) {
      customer = customers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
      });
    }

    // Créer le Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      usage: 'off_session',
      payment_method_types: ['card'],
    });

    return setupIntent;
  },

  // Récupérer les détails d'un moyen de paiement
  async getPaymentMethodDetails(paymentMethodId: string) {
    if (isDevelopmentMock) {
      // Mode mock pour le développement
      const mockPaymentMethod = {
        id: paymentMethodId,
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
          fingerprint: 'mock_fingerprint',
        },
      };

      console.log("🚧 [STRIPE MOCK] Détails moyen de paiement:", paymentMethodId);
      return mockPaymentMethod;
    }

    if (!stripe) {
      throw new Error("Stripe non configuré");
    }

    return await stripe.paymentMethods.retrieve(paymentMethodId);
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
