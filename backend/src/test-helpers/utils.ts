import crypto from "crypto";
import jwt from "jsonwebtoken";

/**
 * Vérifie si les credentials AWS sont disponibles
 */
export const hasAwsCreds = () =>
  !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

/**
 * Vérifie si les credentials AWS sont valides (pas de test)
 */
export const hasValidAwsCreds = () =>
  hasAwsCreds() && !process.env.AWS_ACCESS_KEY_ID?.startsWith("test-");

/**
 * Helper pour skip les tests AWS si pas de credentials valides
 */
export const skipIfNoAws = !hasValidAwsCreds();


/**
 * Génère un UUID v4 pour les tests
 */
export const genId = () => crypto.randomUUID();

/**
 * Génère un token admin valide pour les tests
 */
export const getAdminToken = () =>
  jwt.sign(
    { id: genId(), role: "ADMIN" },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );

/**
 * Génère un token utilisateur valide pour les tests
 */
export const userToken = () =>
  jwt.sign(
    { id: genId(), role: "USER" },
    process.env.JWT_SECRET || "test-secret",
    { expiresIn: "1h" }
  );
