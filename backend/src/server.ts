import app from "./app";

const PORT = Number(process.env.PORT) || 3001;

// Démarrage du serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur backend démarré sur http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔐 Routes d'authentification disponibles:`);
  console.log(`   POST /auth/register - Inscription`);
  console.log(`   POST /auth/login - Connexion`);
  console.log(`   GET /auth/me - Profil utilisateur (protégé)`);
  console.log(`📝 Routes commandes (utilisateurs connectés):`);
  console.log(`   POST /commandes - Créer une commande`);
  console.log(`   GET /commandes - Mes commandes`);
  console.log(`   GET /commandes/:id - Détail d'une commande`);
  console.log(`💬 Routes messages (utilisateurs connectés):`);
  console.log(`   POST /messages - Créer un message`);
  console.log(`   GET /messages - Liste paginée avec filtres`);
  console.log(`   GET /messages/stats - Statistiques messages`);
  console.log(`   GET /messages/:id - Détail message + réponses`);
  console.log(`   PATCH /messages/:id - Maj statut (lu, archivé, épinglé)`);
  console.log(`   DELETE /messages/:id - Suppression (soft/hard RGPD)`);
  console.log(`   POST /messages/:id/attachments - Ajouter pièce jointe`);
  console.log(`💳 Routes paiements:`);
  console.log(
    `   POST /payments/create-checkout-session - Créer session paiement`
  );
  console.log(`   GET /payments/status/:sessionId - Statut paiement`);
  console.log(`   POST /payments/webhook - Webhook Stripe (nouveau)`);
  console.log(`🧾 Routes factures:`);
  console.log(`   GET /invoices - Liste des factures (USER authentifié)`);
  console.log(
    `   GET /invoices/:id - Détails d'une facture (USER authentifié)`
  );
  console.log(
    `   GET /invoices/:id/download - Télécharger PDF facture (USER authentifié)`
  );
  console.log(`👑 Routes admin disponibles:`);
  console.log(`   GET /admin/test - Test admin (ADMIN uniquement)`);
  console.log(
    `   GET /admin/stats - Statistiques générales (ADMIN uniquement)`
  );
  console.log(`👥 Gestion des utilisateurs:`);
  console.log(
    `   GET /admin/users - Liste des utilisateurs (ADMIN uniquement)`
  );
  console.log(
    `   GET /admin/user/:id - Utilisateur spécifique (ADMIN uniquement)`
  );
  console.log(
    `   GET /admin/users/stats - Statistiques utilisateurs (ADMIN uniquement)`
  );
  console.log(`📋 Gestion des commandes:`);
  console.log(
    `   GET /admin/commandes - Liste des commandes (ADMIN uniquement)`
  );
  console.log(
    `   GET /admin/commande/:id - Commande spécifique (ADMIN uniquement)`
  );
  console.log(
    `   PATCH /admin/commande/:id - Mettre à jour statut (ADMIN uniquement)`
  );
  console.log(
    `   GET /admin/commandes/stats - Statistiques commandes (ADMIN uniquement)`
  );
});

// Export pour les tests
export default app;
