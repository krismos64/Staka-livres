import { PrismaClient } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { JwtPayload, verifyToken } from "../utils/token";

const prisma = new PrismaClient();

// Extension de l'interface Request pour inclure user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        prenom: string;
        nom: string;
        email: string;
        role: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

    if (!token) {
      // Log tentative d'accès sans token
      console.log(`🔐 [AUTH] Tentative d'accès sans token - IP: ${req.ip} - UserAgent: ${req.get('user-agent')}`);
      res.status(401).json({ error: "Token d'accès requis" });
      return;
    }

    // Vérifier et décoder le token
    const decoded: JwtPayload = verifyToken(token);

    // CORRECTION CRITIQUE : Récupérer l'utilisateur depuis la base de données
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
      select: {
        id: true,
        prenom: true,
        nom: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      // Log tentative d'accès avec token invalide
      console.log(`🔐 [AUTH] Token valide mais utilisateur introuvable - UserID: ${decoded.userId} - IP: ${req.ip}`);
      res.status(401).json({ error: "Utilisateur non trouvé" });
      return;
    }

    if (!user.isActive) {
      // Log tentative d'accès avec compte inactif
      console.log(`🔐 [AUTH] Tentative d'accès avec compte inactif - User: ${user.email} - IP: ${req.ip}`);
      res.status(401).json({ error: "Compte désactivé" });
      return;
    }

    // Log connexion réussie pour monitoring
    console.log(`✅ [AUTH] Connexion réussie - User: ${user.email} - Role: ${user.role} - IP: ${req.ip}`);

    // Attacher l'utilisateur à la requête
    req.user = user;
    next();
  } catch (error) {
    // Log tentative d'accès avec token invalide
    console.log(`❌ [AUTH] Token invalide - IP: ${req.ip} - Error: ${error.message}`);
    res.status(401).json({ error: "Token invalide" });
  }
};