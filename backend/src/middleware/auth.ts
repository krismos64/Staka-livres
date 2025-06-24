import { NextFunction, Request, Response } from "express";
import { JwtPayload, verifyToken } from "../utils/token";

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
      res.status(401).json({ error: "Token d'accès requis" });
      return;
    }

    // Vérifier et décoder le token
    const decoded: JwtPayload = verifyToken(token);

    // Pour les tests - créer un objet user basé sur le token
    // (en production, on récupérerait depuis la DB)
    const mockUser = {
      id: decoded.userId,
      prenom: decoded.email.includes("admin") ? "Admin" : "Test",
      nom: decoded.email.includes("admin") ? "Staka" : "User",
      email: decoded.email,
      role: decoded.role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Attacher l'utilisateur à la requête
    req.user = mockUser;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide" });
  }
};
