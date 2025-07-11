// frontend/src/utils/debug.ts
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

/**
 * Affiche des logs de débogage en console uniquement en mode développement.
 * @param message Le message principal à afficher.
 * @param data Données optionnelles à logger (objet, variable, etc.).
 */
export const debugLog = (message: string, data?: any) => {
  if (IS_DEVELOPMENT) {
    console.log(`[DEBUG FRONTEND] ${message}`, data !== undefined ? data : "");
  }
};
