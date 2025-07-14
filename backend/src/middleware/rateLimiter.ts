import { Request, Response, NextFunction } from "express";

// Interface pour stocker les informations de rate limiting
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

// Stockage en mémoire des tentatives par IP
const rateLimitStore: Map<string, RateLimitInfo> = new Map();

// Nettoyage périodique des entrées expirées
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, info] of rateLimitStore.entries()) {
    if (info.resetTime <= now) {
      rateLimitStore.delete(ip);
    }
  }
}, 60000); // Nettoyage toutes les minutes

// Fonction pour créer un rate limiter
export const createRateLimiter = (config: {
  windowMs: number;
  maxRequests: number;
  message: string;
  keyGenerator?: (req: Request) => string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = config.keyGenerator ? config.keyGenerator(req) : ip;
    const now = Date.now();
    
    // Récupérer ou créer l'entrée pour cette IP
    let rateLimitInfo = rateLimitStore.get(key);
    
    if (!rateLimitInfo || rateLimitInfo.resetTime <= now) {
      // Nouvelle fenêtre temporelle
      rateLimitInfo = {
        count: 1,
        resetTime: now + config.windowMs
      };
      rateLimitStore.set(key, rateLimitInfo);
      return next();
    }
    
    // Vérifier si la limite est atteinte
    if (rateLimitInfo.count >= config.maxRequests) {
      const remainingTime = Math.ceil((rateLimitInfo.resetTime - now) / 1000);
      
      // Log de la tentative bloquée
      console.warn(`🚫 [RATE LIMIT] IP ${ip} bloquée - ${rateLimitInfo.count} tentatives`);
      
      return res.status(429).json({
        error: config.message,
        retryAfter: remainingTime
      });
    }
    
    // Incrémenter le compteur
    rateLimitInfo.count++;
    rateLimitStore.set(key, rateLimitInfo);
    
    next();
  };
};

// Rate limiter spécifique pour les demandes de réinitialisation de mot de passe
export const passwordResetRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 heure
  maxRequests: 5, // 5 tentatives par heure
  message: "Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.",
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const email = req.body.email || 'unknown';
    return `reset:${ip}:${email}`;
  }
});

// Rate limiter général pour les tentatives d'authentification
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 tentatives par 15 minutes
  message: "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes."
});

// Fonction pour nettoyer le store (utile pour les tests)
export const clearRateLimitStore = () => {
  rateLimitStore.clear();
};

// Fonction pour obtenir les statistiques de rate limiting
export const getRateLimitStats = () => {
  const stats = {
    totalEntries: rateLimitStore.size,
    entries: Array.from(rateLimitStore.entries()).map(([key, info]) => ({
      key,
      count: info.count,
      resetTime: new Date(info.resetTime).toISOString()
    }))
  };
  return stats;
};

// Nettoyage lors de l'arrêt du processus
process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
  rateLimitStore.clear();
});

process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
  rateLimitStore.clear();
});