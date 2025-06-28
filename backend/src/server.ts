import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import commandesRoutes from "./routes/commandes";
import invoiceRoutes from "./routes/invoice";
import messagesRoutes from "./routes/messages";
import paymentsRoutes from "./routes/payments";
import webhookRoutes from "./routes/payments/webhook";

// Configuration de l'environnement
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Body parser raw pour les webhooks Stripe (AVANT express.json())
app.use(
  "/payments/webhook",
  bodyParser.raw({ type: "application/json" }),
  webhookRoutes
);

// Body parser standard pour les autres routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes de base
app.get("/", (req, res) => {
  res.json({ message: "Staka Livres API - Backend fonctionnel!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes d'authentification
app.use("/auth", authRoutes);

// Routes commandes (côté client)
app.use("/commandes", commandesRoutes);

// Routes messages (authentifiées)
app.use("/messages", messagesRoutes);

// Routes paiements (sans webhook qui est déjà géré ci-dessus)
app.use("/payments", paymentsRoutes);

// Routes admin (protégées)
app.use("/admin", adminRoutes);

// Routes factures (côté client)
app.use("/invoices", invoiceRoutes);

// Gestionnaire d'erreur 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

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
