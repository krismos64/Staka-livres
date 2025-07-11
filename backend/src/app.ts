import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import adminRoutes from "./routes/admin";
import adminStatsRoutes from "./routes/adminStats";
import authRoutes from "./routes/auth";
import commandesRoutes from "./routes/commandes";
import faqRoutes from "./routes/faq";
import filesRoutes from "./routes/files";
import invoiceRoutes from "./routes/invoice";
import messagesRoutes from "./routes/messages";
import notificationsRoutes from "./routes/notifications";
import pagesRoutes from "./routes/pages";
import paymentsRoutes from "./routes/payments";
import webhookRoutes from "./routes/payments/webhook";
import tarifsRoutes from "./routes/tarifs";

// Configuration de l'environnement
dotenv.config();

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
app.use("/auth", authRoutes);

// Routes FAQ publiques
app.use("/faq", faqRoutes);

// Routes tarifs publiques
app.use("/tarifs", tarifsRoutes);

// Routes publiques pour les pages
app.use("/pages", pagesRoutes);

// Routes commandes (côté client)
app.use("/commandes", commandesRoutes);

// Routes messages (authentifiées)
app.use("/messages", messagesRoutes);

// Routes fichiers (authentifiées)
app.use("/files", filesRoutes);

// Routes notifications (authentifiées)
app.use("/notifications", notificationsRoutes);

// Routes paiements (sans webhook qui est déjà géré ci-dessus)
app.use("/payments", paymentsRoutes);

// Routes admin (protégées)
app.use("/admin", adminRoutes);

// Routes statistiques admin (protégées)
app.use("/admin/stats", adminStatsRoutes);

// Routes factures (côté client)
app.use("/invoices", invoiceRoutes);

// Gestionnaire d'erreur 404
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route non trouvée" });
});

export default app;
