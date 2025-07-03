import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import commandesRoutes from "./routes/commandes";
import faqRoutes from "./routes/faq";
import invoiceRoutes from "./routes/invoice";
import messagesRoutes from "./routes/messages";
import paymentsRoutes from "./routes/payments";
import webhookRoutes from "./routes/payments/webhook";

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

// Routes FAQ publiques
app.use("/faq", faqRoutes);

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

export default app;
