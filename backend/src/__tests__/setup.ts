/**
 * Configuration globale pour les tests Vitest
 */

import { config } from "dotenv";

// Charger les variables d'environnement pour les tests
config({ path: ".env.test" });

// Configuration par défaut si pas de .env.test
if (!process.env.AWS_ACCESS_KEY_ID) {
  process.env.AWS_ACCESS_KEY_ID = process.env.TEST_AWS_ACCESS_KEY_ID || "test-access-key";
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  process.env.AWS_SECRET_ACCESS_KEY = process.env.TEST_AWS_SECRET_ACCESS_KEY || "test-secret-key";
}

if (!process.env.AWS_S3_BUCKET) {
  process.env.AWS_S3_BUCKET = "staka-invoices";
}

if (!process.env.AWS_REGION) {
  process.env.AWS_REGION = "eu-west-3";
}

// Configuration pour les tests d'intégration
console.log("🧪 [Test Setup] Configuration tests Vitest chargée");
console.log(`📦 [Test Setup] Bucket S3: ${process.env.AWS_S3_BUCKET}`);
console.log(`🌍 [Test Setup] Région AWS: ${process.env.AWS_REGION}`);

// Handler global pour les erreurs non gérées dans les tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 [Test] Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 [Test] Uncaught Exception:', error);
});