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

// Inscription d'un nouvel utilisateur
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { prenom, nom, email, password }: RegisterRequest = req.body;

    // Validation des champs requis
    if (!prenom || !nom || !email || !password) {
      res.status(400).json({
        error: "Tous les champs sont requis (prenom, nom, email, password)",
      });
      return;
    }

    // Validation format email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: "Format d'email invalide" });
      return;
    }

    // Validation mot de passe (minimum 6 caractères)
    if (password.length < 6) {
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
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Connexion d'un utilisateur
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation des champs requis
    if (!email || !password) {
      res.status(400).json({ error: "Email et mot de passe requis" });
      return;
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: "Identifiants incorrects" });
      return;
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      res.status(401).json({ error: "Compte désactivé" });
      return;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Identifiants incorrects" });
      return;
    }

    // Générer le token JWT
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      message: "Connexion réussie",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Récupérer les infos de l'utilisateur connecté
export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    // L'utilisateur est déjà attaché à req par le middleware auth
    const user = req.user;

    if (!user) {
      res.status(401).json({ error: "Utilisateur non authentifié" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération des infos:", error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
