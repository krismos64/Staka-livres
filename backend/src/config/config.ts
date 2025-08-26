/**
 * Configuration centralisée pour l'application Staka Livres
 */

export const CONFIG = {
  // Configuration S3
  S3: {
    // TTL des URLs signées S3 : 30 jours en secondes
    SIGNED_URL_TTL: 30 * 24 * 60 * 60, // 2592000 secondes
    BUCKET: process.env.AWS_S3_BUCKET || 'staka-invoices',
    REGION: process.env.AWS_REGION || 'eu-west-3',
  },

  // Configuration PDF
  PDF: {
    COMPANY_NAME: 'STAKA LIVRES',
    COMPANY_ADDRESS: {
      line1: 'Correction et édition de manuscrits',
      line2: '123 Rue des Livres',
      line3: '75000 Paris, France',
      phone: '+33 1 23 45 67 89',
      email: 'contact@staka.fr',
      siret: '123 456 789 00010',
    },
    TVA_RATE: 0.20, // 20%
    LOGO_PATH: '../../assets/logo.png',
  },

  // Configuration JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'your_secure_jwt_secret',
    EXPIRES_IN: '7d',
  },

  // Configuration base de données
  DATABASE: {
    URL: process.env.DATABASE_URL,
  },

  // Configuration Stripe
  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  },

  // Configuration serveur
  SERVER: {
    PORT: parseInt(process.env.PORT || '3000'),
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
} as const;

export default CONFIG;