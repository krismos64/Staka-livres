import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import commandesRoutes from "./routes/commandes";
import consultationRoutes from "./routes/consultations";
import faqRoutes from "./routes/faq";
import filesRoutes from "./routes/files";
import invoiceRoutes from "./routes/invoice";
import messagesRoutes from "./routes/messages";
import notificationsRoutes from "./routes/notifications";
import pagesRoutes from "./routes/pages";
import paymentMethodsRoutes from "./routes/paymentMethods";
import paymentsRoutes from "./routes/payments";
import projectsRoutes from "./routes/projects";
import statsRoutes from "./routes/stats";
import webhookRoutes from "./routes/payments/webhook";
import tarifsRoutes from "./routes/tarifs";
import usersRoutes from "./routes/users";
import publicRoutes from "./routes/public";

// Configuration de l'environnement
dotenv.config();

// Initialize event listeners (side-effect import)
import "./listeners/adminNotificationEmailListener";

const app = express();

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

// Body parser standard pour les autres routes (avec limite augmentée pour les uploads)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Servir les fichiers statiques uploadés
app.use("/uploads", express.static("uploads"));

// Routes de base
app.get("/", (req, res) => {
  res.json({ message: "Staka Livres API - Backend fonctionnel!" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes d'authentification
app.use("/api/auth", authRoutes);

// Routes publiques (contact, etc.)
app.use("/api/public", publicRoutes);

// Routes FAQ publiques
app.use("/api/faq", faqRoutes);

// Routes tarifs publiques
app.use("/api/tarifs", tarifsRoutes);

// Routes consultations (publiques et admin)
app.use("/api/consultations", consultationRoutes);

// Routes publiques pour les pages
app.use("/api/pages", pagesRoutes);

// Routes commandes (côté client)
app.use("/api/commandes", commandesRoutes);

// Routes messages (authentifiées)
app.use("/api/messages", messagesRoutes);

// Routes fichiers (authentifiées)
app.use("/api/files", filesRoutes);

// Routes notifications (authentifiées)
app.use("/api/notifications", notificationsRoutes);

// Routes paiements (sans webhook qui est déjà géré ci-dessus)
app.use("/api/payments", paymentsRoutes);

// Routes moyens de paiement (authentifiées)
app.use("/api/payment-methods", paymentMethodsRoutes);

// Routes statistiques utilisateur (authentifiées)
app.use("/api/stats", statsRoutes);

// Routes projets (authentifiées)
app.use("/api/projects", projectsRoutes);

// Routes utilisateurs (authentifiées - RGPD)
app.use("/api/users", usersRoutes);

// Routes admin (protégées)
app.use("/api/admin", adminRoutes);

// Routes factures (côté client)
app.use("/api/invoices", invoiceRoutes);

// Gestionnaire d'erreur 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

export default app;
