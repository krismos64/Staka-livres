/**
 * Validation des mots de passe conforme aux exigences RGPD/CNIL
 * 
 * Règles de complexité :
 * - Minimum 12 caractères OU
 * - Minimum 8 caractères AVEC au moins 3 des 4 types suivants :
 *   - Majuscules (A-Z)
 *   - Minuscules (a-z)
 *   - Chiffres (0-9)
 *   - Caractères spéciaux
 */

export interface PasswordValidationResult {
  isValid: boolean;
  message: string;
  details?: {
    length: number;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasDigits: boolean;
    hasSpecialChars: boolean;
    typeCount: number;
  };
}

export class AuthValidators {
  private static readonly MIN_LENGTH_STRONG = 12;
  private static readonly MIN_LENGTH_COMPLEX = 8;
  private static readonly MIN_TYPES_REQUIRED = 3;

  /**
   * Valide la complexité d'un mot de passe selon les règles RGPD/CNIL
   */
  static validatePasswordComplexity(password: string): PasswordValidationResult {
    if (!password) {
      return {
        isValid: false,
        message: "Le mot de passe est requis"
      };
    }

    const length = password.length;
    
    // Vérifier les différents types de caractères
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigits = /[0-9]/.test(password);
    const hasSpecialChars = /[^A-Za-z0-9]/.test(password);

    // Compter le nombre de types différents
    const typeCount = [hasUppercase, hasLowercase, hasDigits, hasSpecialChars]
      .filter(Boolean).length;

    const details = {
      length,
      hasUppercase,
      hasLowercase,
      hasDigits,
      hasSpecialChars,
      typeCount
    };

    // Règle 1: Minimum 12 caractères (pas d'autres exigences)
    if (length >= this.MIN_LENGTH_STRONG) {
      return {
        isValid: true,
        message: "Mot de passe conforme (≥12 caractères)",
        details
      };
    }

    // Règle 2: Minimum 8 caractères avec au moins 3 types différents
    if (length >= this.MIN_LENGTH_COMPLEX && typeCount >= this.MIN_TYPES_REQUIRED) {
      return {
        isValid: true,
        message: "Mot de passe conforme (≥8 caractères avec complexité)",
        details
      };
    }

    // Déterminer le message d'erreur spécifique
    let message = "Mot de passe trop faible. ";
    
    if (length < this.MIN_LENGTH_COMPLEX) {
      message += `Minimum ${this.MIN_LENGTH_COMPLEX} caractères requis. `;
    } else if (typeCount < this.MIN_TYPES_REQUIRED) {
      message += `Utilisez au moins ${this.MIN_TYPES_REQUIRED} types de caractères parmi : majuscules, minuscules, chiffres, caractères spéciaux. `;
    }

    message += `Ou utilisez un mot de passe d'au moins ${this.MIN_LENGTH_STRONG} caractères.`;

    return {
      isValid: false,
      message,
      details
    };
  }

  /**
   * Valide le format d'un email
   */
  static validateEmail(email: string): { isValid: boolean; message: string } {
    if (!email) {
      return {
        isValid: false,
        message: "L'email est requis"
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        message: "Format d'email invalide"
      };
    }

    return {
      isValid: true,
      message: "Email valide"
    };
  }

  /**
   * Valide les champs requis pour l'inscription
   */
  static validateRegistrationFields(data: {
    prenom?: string;
    nom?: string;
    email?: string;
    password?: string;
  }): { isValid: boolean; message: string } {
    const { prenom, nom, email, password } = data;

    if (!prenom || !nom || !email || !password) {
      return {
        isValid: false,
        message: "Tous les champs sont requis (prenom, nom, email, password)"
      };
    }

    // Validation du nom et prénom
    if (prenom.trim().length < 2) {
      return {
        isValid: false,
        message: "Le prénom doit contenir au moins 2 caractères"
      };
    }

    if (nom.trim().length < 2) {
      return {
        isValid: false,
        message: "Le nom doit contenir au moins 2 caractères"
      };
    }

    return {
      isValid: true,
      message: "Champs valides"
    };
  }

  /**
   * Valide les champs requis pour la connexion
   */
  static validateLoginFields(data: {
    email?: string;
    password?: string;
  }): { isValid: boolean; message: string } {
    const { email, password } = data;

    if (!email || !password) {
      return {
        isValid: false,
        message: "Email et mot de passe requis"
      };
    }

    return {
      isValid: true,
      message: "Champs valides"
    };
  }

  /**
   * Valide un token de réinitialisation de mot de passe
   */
  static validateResetToken(token: string): { isValid: boolean; message: string } {
    if (!token) {
      return {
        isValid: false,
        message: "Token de réinitialisation requis"
      };
    }

    // Vérifier que le token a un format base64url valide
    const base64urlRegex = /^[A-Za-z0-9_-]+$/;
    if (!base64urlRegex.test(token)) {
      return {
        isValid: false,
        message: "Format de token invalide"
      };
    }

    // Vérifier une longueur minimale (UUID + 32 bytes random ≈ 64 chars en base64url)
    if (token.length < 40) {
      return {
        isValid: false,
        message: "Token de réinitialisation invalide"
      };
    }

    return {
      isValid: true,
      message: "Token valide"
    };
  }
}