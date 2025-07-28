import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { signToken } from "../utils/token";
import { notifyAdminNewRegistration } from "./notificationsController";
import { AuthValidators } from "../validators/authValidators";
import { PasswordResetService } from "../services/passwordResetService";
import { AuditService } from "../services/auditService";
import { MailerService } from "../utils/mailer";
import { WelcomeEmailService } from "../services/welcomeEmailService";

const prisma = new PrismaClient();

// Types pour les requêtes
interface RegisterRequest {
  prenom: string;
  nom: string;
  email: string;
  password: string;
  telephone?: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface PasswordResetRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
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
  const { prenom, nom, email, password, telephone }: RegisterRequest = req.body;

  try {
    // Log tentative d'inscription
    logAuthEvent("REGISTER_ATTEMPT", email, ip, userAgent);

    // Validation des champs requis
    const fieldsValidation = AuthValidators.validateRegistrationFields({
      prenom, nom, email, password
    });
    if (!fieldsValidation.isValid) {
      logAuthEvent("REGISTER_FAILED", email, ip, userAgent, "Invalid fields");
      res.status(400).json({ error: fieldsValidation.message });
      return;
    }

    // Validation format email
    const emailValidation = AuthValidators.validateEmail(email);
    if (!emailValidation.isValid) {
      logAuthEvent("REGISTER_FAILED", email, ip, userAgent, "Invalid email format");
      res.status(400).json({ error: emailValidation.message });
      return;
    }

    // Validation complexité mot de passe (RGPD/CNIL)
    const passwordValidation = AuthValidators.validatePasswordComplexity(password);
    if (!passwordValidation.isValid) {
      logAuthEvent("REGISTER_FAILED", email, ip, userAgent, "Password too weak");
      res.status(400).json({ error: passwordValidation.message });
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
        telephone: telephone || null,
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

    // Email de bienvenue désactivé - les clients reçoivent un email personnalisé lors de la création de leur premier projet
    // try {
    //   const userName = WelcomeEmailService.formatUserName(user.prenom, user.nom);
    //   await WelcomeEmailService.sendWelcomeEmail(user.email, userName, user.prenom);
    // } catch (welcomeEmailError) {
    //   console.error("Erreur lors de l'envoi de l'email de bienvenue:", welcomeEmailError);
    //   // Ne pas faire échouer l'inscription si l'email ne part pas
    // }

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
    const fieldsValidation = AuthValidators.validateLoginFields({ email, password });
    if (!fieldsValidation.isValid) {
      logAuthEvent("LOGIN_FAILED", email, ip, userAgent, "Missing credentials");
      res.status(400).json({ error: fieldsValidation.message });
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

// Demande de réinitialisation de mot de passe
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  const { email }: PasswordResetRequest = req.body;

  try {
    // Validation de l'email
    if (!email) {
      res.status(400).json({ error: "Email requis" });
      return;
    }

    const emailValidation = AuthValidators.validateEmail(email);
    if (!emailValidation.isValid) {
      res.status(400).json({ error: emailValidation.message });
      return;
    }

    // Vérifier si l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe
      // Mais on log l'événement
      await AuditService.logPasswordResetEvent(
        email,
        'failed',
        undefined,
        ip,
        userAgent,
        { reason: 'user_not_found' }
      );
      
      res.status(200).json({ 
        message: "Si cet email existe, un lien de réinitialisation vous a été envoyé" 
      });
      return;
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      await AuditService.logPasswordResetEvent(
        email,
        'failed',
        user.id,
        ip,
        userAgent,
        { reason: 'account_inactive' }
      );
      
      res.status(200).json({ 
        message: "Si cet email existe, un lien de réinitialisation vous a été envoyé" 
      });
      return;
    }

    // Créer le token de réinitialisation
    const tokenResult = await PasswordResetService.createToken(user.id);
    
    if (!tokenResult.success || !tokenResult.token) {
      await AuditService.logPasswordResetEvent(
        email,
        'failed',
        user.id,
        ip,
        userAgent,
        { reason: 'token_creation_failed' }
      );
      
      res.status(500).json({ error: "Erreur lors de la création du token" });
      return;
    }

    // Envoyer l'email de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${tokenResult.token}`;
    
    const emailSubject = "Réinitialisation de votre mot de passe";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">🔐 Réinitialisation de mot de passe</h2>
        
        <p>Bonjour ${user.prenom},</p>
        
        <p>Vous avez demandé la réinitialisation de votre mot de passe sur Staka Livres.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #2563eb; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Ce lien est valable pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, 
          vous pouvez ignorer cet email.
        </p>
        
        <p style="color: #6b7280; font-size: 14px;">
          Si le bouton ne fonctionne pas, vous pouvez copier/coller ce lien : 
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        
        <p style="color: #6b7280; font-size: 12px;">
          Cordialement,<br>
          <strong>L'équipe Staka Livres</strong>
        </p>
      </div>
    `;

    const emailText = `
Réinitialisation de votre mot de passe

Bonjour ${user.prenom},

Vous avez demandé la réinitialisation de votre mot de passe sur Staka Livres.

Cliquez sur ce lien pour réinitialiser votre mot de passe :
${resetUrl}

Ce lien est valable pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.

Cordialement,
L'équipe Staka Livres
    `;

    await MailerService.sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    // Log de l'événement réussi
    await AuditService.logPasswordResetEvent(
      email,
      'request',
      user.id,
      ip,
      userAgent
    );

    res.status(200).json({ 
      message: "Un lien de réinitialisation vous a été envoyé par email" 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Erreur lors de la demande de réinitialisation:", error);
    
    await AuditService.logPasswordResetEvent(
      email,
      'failed',
      undefined,
      ip,
      userAgent,
      { error: errorMessage }
    );
    
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

// Réinitialisation du mot de passe
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';
  const { token, newPassword }: ResetPasswordRequest = req.body;

  try {
    // Validation des champs
    if (!token || !newPassword) {
      res.status(400).json({ error: "Token et nouveau mot de passe requis" });
      return;
    }

    // Validation du token
    const tokenValidation = AuthValidators.validateResetToken(token);
    if (!tokenValidation.isValid) {
      res.status(400).json({ error: tokenValidation.message });
      return;
    }

    // Validation du nouveau mot de passe
    const passwordValidation = AuthValidators.validatePasswordComplexity(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({ error: passwordValidation.message });
      return;
    }

    // Vérifier et consommer le token
    const tokenResult = await PasswordResetService.consumeToken(token);
    
    if (!tokenResult.success || !tokenResult.userId) {
      await AuditService.logPasswordResetEvent(
        'unknown',
        'failed',
        undefined,
        ip,
        userAgent,
        { reason: 'invalid_token' }
      );
      
      res.status(400).json({ error: "Token invalide ou expiré" });
      return;
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: tokenResult.userId }
    });

    if (!user) {
      await AuditService.logPasswordResetEvent(
        'unknown',
        'failed',
        tokenResult.userId,
        ip,
        userAgent,
        { reason: 'user_not_found' }
      );
      
      res.status(400).json({ error: "Utilisateur introuvable" });
      return;
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      await AuditService.logPasswordResetEvent(
        user.email,
        'failed',
        user.id,
        ip,
        userAgent,
        { reason: 'account_inactive' }
      );
      
      res.status(400).json({ error: "Compte désactivé" });
      return;
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // Invalider tous les tokens de réinitialisation de l'utilisateur
    await PasswordResetService.invalidateUserTokens(user.id);

    // Log de l'événement réussi
    await AuditService.logPasswordResetEvent(
      user.email,
      'success',
      user.id,
      ip,
      userAgent
    );

    res.status(200).json({ 
      message: "Mot de passe réinitialisé avec succès" 
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Erreur lors de la réinitialisation:", error);
    
    await AuditService.logPasswordResetEvent(
      'unknown',
      'failed',
      undefined,
      ip,
      userAgent,
      { error: errorMessage }
    );
    
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};