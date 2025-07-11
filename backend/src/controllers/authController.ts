import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { signToken } from "../utils/token";
import { notifyAdminNewRegistration } from "./notificationsController";

const prisma = new PrismaClient();

// Types pour les requêtes
interface RegisterRequest {
  prenom: string;
  nom: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// Service d'audit pour les événements d'authentification
const logAuthEvent = (event: string, email: string, ip: string, userAgent: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`🔐 [AUTH AUDIT] ${timestamp} - ${event} - Email: ${email} - IP: ${ip} - UserAgent: ${userAgent?.substring(0, 100)}`, details ? JSON.stringify(details) : "");
};

// Inscription d'un nouvel utilisateur
export const register = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  const { prenom, nom, email, password }: RegisterRequest = req.body;

  try {
    // Log tentative d'inscription
    logAuthEvent("REGISTER_ATTEMPT", email, ip, userAgent);

    // Validation des champs requis
    if (!prenom || !nom || !email || !password) {
      logAuthEvent("REGISTER_FAILED", email, ip, userAgent, "Missing required fields");
      res.status(400).json({
        error: "Tous les champs sont requis (prenom, nom, email, password)",
      });
      return;
    }

    // Validation format email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logAuthEvent("REGISTER_FAILED", email, ip, userAgent, "Invalid email format");
      res.status(400).json({ error: "Format d'email invalide" });
      return;
    }

    // Validation mot de passe (minimum 6 caractères)
    if (password.length < 6) {
      logAuthEvent("REGISTER_FAILED", email, ip, userAgent, "Password too short");
      res.status(400).json({
        error: "Le mot de passe doit contenir au moins 6 caractères",
      });
      return;
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      logAuthEvent("REGISTER_FAILED", email, ip, userAgent, "Email already exists");
      res
        .status(409)
        .json({ error: "Un utilisateur avec cet email existe déjà" });
      return;
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        prenom,
        nom,
        email,
        password: hashedPassword,
        role: Role.USER,
        isActive: true,
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

    // Générer le token JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log inscription réussie
    logAuthEvent("REGISTER_SUCCESS", email, ip, userAgent, {
      userId: user.id,
      role: user.role,
      prenom: user.prenom,
      nom: user.nom
    });

    // Notifier les admins de la nouvelle inscription
    try {
      await notifyAdminNewRegistration(`${user.prenom} ${user.nom}`, user.email);
    } catch (notificationError) {
      console.error("Erreur lors de la création de la notification:", notificationError);
    }

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user,
      token,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logAuthEvent("REGISTER_ERROR", email, ip, userAgent, errorMessage);
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Connexion d'un utilisateur
export const login = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  const { email, password }: LoginRequest = req.body;

  try {
    // Log tentative de connexion
    logAuthEvent("LOGIN_ATTEMPT", email, ip, userAgent);

    // Validation des champs requis
    if (!email || !password) {
      logAuthEvent("LOGIN_FAILED", email, ip, userAgent, "Missing credentials");
      res.status(400).json({ error: "Email et mot de passe requis" });
      return;
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logAuthEvent("LOGIN_FAILED", email, ip, userAgent, "User not found");
      res.status(401).json({ error: "Identifiants incorrects" });
      return;
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      logAuthEvent("LOGIN_FAILED", email, ip, userAgent, "Account inactive");
      res.status(401).json({ error: "Compte désactivé" });
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      logAuthEvent("LOGIN_FAILED", email, ip, userAgent, "Invalid password");
      res.status(401).json({ error: "Identifiants incorrects" });
      return;
    }

    // Générer le token JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Log connexion réussie
    logAuthEvent("LOGIN_SUCCESS", email, ip, userAgent, {
      userId: user.id,
      role: user.role,
      prenom: user.prenom,
      nom: user.nom
    });

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Connexion réussie",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logAuthEvent("LOGIN_ERROR", email, ip, userAgent, errorMessage);
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Récupérer les infos de l'utilisateur connecté
export const me = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  try {
    // L'utilisateur est déjà attaché à req par le middleware auth
    const user = req.user;

    if (!user) {
      logAuthEvent("ME_FAILED", "unknown", ip, userAgent, "User not authenticated");
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    // Log accès aux informations utilisateur
    logAuthEvent("ME_ACCESS", user.email, ip, userAgent, {
      userId: user.id,
      role: user.role
    });

    res.status(200).json(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logAuthEvent("ME_ERROR", req.user?.email || "unknown", ip, userAgent, errorMessage);
    console.error("Erreur lors de la récupération des infos:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};