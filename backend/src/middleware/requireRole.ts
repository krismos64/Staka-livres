import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

// Middleware pour vérifier le rôle utilisateur
export const requireRole = (requiredRole: Role = Role.ADMIN) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!req.user) {
        res.status(401).json({
          error: "Authentification requise",
          message: "Vous devez être connecté pour accéder à cette ressource",
        });
        return;
      }

      // Vérifier le rôle
      if (req.user.role !== requiredRole) {
        res.status(403).json({
          error: "Accès interdit",
          message: `Cette ressource nécessite le rôle ${requiredRole}`,
          currentRole: req.user.role,
        });
        return;
      }

      // L'utilisateur a le bon rôle, continuer
      next();
    } catch (error) {
      console.error("Erreur dans requireRole middleware:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  };
};
