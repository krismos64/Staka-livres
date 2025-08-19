// Exemple d'amélioration pour ajouter des metadata permettant de filtrer les événements

// Dans publicCommandeController.ts, lors de la création de la session Stripe :
const checkoutSession = await stripeService.createCheckoutSession({
  priceId,
  userId: pendingCommande.id,
  commandeId: pendingCommande.id,
  amount,
  successUrl: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
  cancelUrl: `${process.env.FRONTEND_URL}/order-cancelled`,
  metadata: {
    source: 'livrestaka.fr',  // Identifier la source
    pendingCommandeId: pendingCommande.id,
    environment: process.env.NODE_ENV
  }
});

// Dans webhook.ts, filtrer les événements :
case "checkout.session.completed": {
  const session = event.data.object;
  
  // Ignorer les événements qui ne viennent pas de livrestaka.fr
  if (session.metadata?.source !== 'livrestaka.fr') {
    console.log(`🔄 [Stripe Webhook] Événement ignoré - Source: ${session.metadata?.source || 'unknown'}`);
    res.json({ received: true, ignored: true, reason: 'different_source' });
    return;
  }
  
  // Continuer le traitement normal...
}