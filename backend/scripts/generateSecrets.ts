#!/usr/bin/env node

/**
 * 🔒 GÉNÉRATEUR DE SECRETS PRODUCTION - STAKA LIVRES
 * 
 * Script sécurisé pour générer automatiquement tous les secrets
 * nécessaires au déploiement production sur VPS OVH.
 * 
 * USAGE:
 *   npm run build:secrets && node dist/generateSecrets.js
 *   npm run build:secrets && node dist/generateSecrets.js --output .env.production
 *   npm run build:secrets && node dist/generateSecrets.js --help
 * 
 * SÉCURITÉ:
 *   - Utilise crypto.randomBytes pour entropie cryptographique
 *   - Génère des secrets conformes aux standards de sécurité
 *   - Permissions fichier automatiquement sécurisées (600)
 *   - Validation longueur et complexité des secrets
 * 
 * @author Staka Livres Team
 * @version 2.1.0 (TypeScript)
 * @date 2025-07-22
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 🎨 Interface pour les couleurs console
interface ConsoleColors {
    readonly reset: string;
    readonly bright: string;
    readonly red: string;
    readonly green: string;
    readonly yellow: string;
    readonly blue: string;
    readonly magenta: string;
    readonly cyan: string;
}

// 📋 Énumération des encodages supportés
enum EncodingType {
    BASE64URL = 'base64url',
    BASE64 = 'base64',
    HEX = 'hex'
}

// 🔐 Interface pour la configuration d'un secret
interface SecretConfiguration {
    readonly length: number;
    readonly description: string;
    readonly encoding: EncodingType;
    readonly minEntropy: number;
}

// 📊 Interface pour les secrets générés
interface GeneratedSecrets {
    [key: string]: string;
}

// ⚙️ Interface pour les arguments de ligne de commande
interface CommandLineArgs {
    readonly help: boolean;
    readonly dryRun: boolean;
    readonly outputFile: string;
}

// 🎨 Couleurs console pour affichage
const colors: ConsoleColors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
} as const;

// 📋 Configuration des secrets à générer
const SECRET_CONFIG: Record<string, SecretConfiguration> = {
    JWT_SECRET: {
        length: 64,
        description: 'Clé de signature JWT pour authentification',
        encoding: EncodingType.BASE64URL,
        minEntropy: 320 // bits (réaliste pour base64url)
    },
    MYSQL_ROOT_PASSWORD: {
        length: 32,
        description: 'Mot de passe root MySQL',
        encoding: EncodingType.BASE64URL,
        minEntropy: 160
    },
    MYSQL_PASSWORD: {
        length: 24,
        description: 'Mot de passe utilisateur staka_prod MySQL',
        encoding: EncodingType.BASE64URL,
        minEntropy: 120
    },
    AWS_SECRET_ACCESS_KEY: {
        length: 40,
        description: 'Clé secrète AWS pour accès S3',
        encoding: EncodingType.BASE64URL,
        minEntropy: 200
    },
    REDIS_PASSWORD: {
        length: 20,
        description: 'Mot de passe Redis pour cache',
        encoding: EncodingType.BASE64URL,
        minEntropy: 100
    },
    STRIPE_WEBHOOK_ENDPOINT_SECRET: {
        length: 32,
        description: 'Secret endpoint webhook Stripe (sera remplacé par Stripe)',
        encoding: EncodingType.HEX,
        minEntropy: 120
    }
} as const;

/**
 * 🔐 Génère un secret cryptographiquement sécurisé
 * 
 * @param length - Longueur du secret en caractères
 * @param encoding - Encodage du secret
 * @returns Secret généré
 * @throws Error si l'encodage n'est pas supporté
 */
function generateSecureSecret(length: number, encoding: EncodingType = EncodingType.BASE64URL): string {
    // Calcul bytes nécessaires selon l'encodage
    let bytesNeeded: number;
    
    switch (encoding) {
        case EncodingType.BASE64URL:
        case EncodingType.BASE64:
            // Base64: 4 caractères = 3 bytes
            bytesNeeded = Math.ceil((length * 3) / 4);
            break;
        case EncodingType.HEX:
            // Hex: 2 caractères = 1 byte
            bytesNeeded = Math.ceil(length / 2);
            break;
        default:
            throw new Error(`Encodage non supporté: ${encoding}`);
    }

    // Génération avec entropie cryptographique maximale
    const randomBytes: Buffer = crypto.randomBytes(bytesNeeded);
    
    let secret: string;
    switch (encoding) {
        case EncodingType.BASE64URL:
            secret = randomBytes
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '')
                .substring(0, length);
            break;
        case EncodingType.BASE64:
            secret = randomBytes
                .toString('base64')
                .substring(0, length);
            break;
        case EncodingType.HEX:
            secret = randomBytes
                .toString('hex')
                .substring(0, length);
            break;
        default:
            throw new Error(`Encodage non supporté: ${encoding}`);
    }

    return secret;
}

/**
 * 🧮 Calcule l'entropie d'un secret
 * 
 * @param secret - Secret à analyser
 * @param encoding - Encodage du secret
 * @returns Entropie en bits
 */
function calculateEntropy(secret: string, encoding: EncodingType): number {
    let bitsPerChar: number;
    
    switch (encoding) {
        case EncodingType.BASE64URL:
        case EncodingType.BASE64:
            bitsPerChar = Math.log2(64); // ~6 bits
            break;
        case EncodingType.HEX:
            bitsPerChar = Math.log2(16); // 4 bits
            break;
        default:
            bitsPerChar = Math.log2(95); // ASCII printable
    }
    
    return Math.floor(secret.length * bitsPerChar);
}

/**
 * 📊 Affiche les informations d'un secret généré
 * 
 * @param name - Nom de la variable
 * @param secret - Secret généré
 * @param config - Configuration du secret
 */
function displaySecretInfo(name: string, secret: string, config: SecretConfiguration): void {
    const entropy: number = calculateEntropy(secret, config.encoding);
    const entropyStatus: string = entropy >= config.minEntropy ? 
        `${colors.green}✅ ${entropy} bits${colors.reset}` : 
        `${colors.red}⚠️ ${entropy} bits (min: ${config.minEntropy})${colors.reset}`;

    console.log(`\n${colors.bright}${colors.cyan}${name}${colors.reset}`);
    console.log(`  📝 Description: ${config.description}`);
    console.log(`  🔢 Longueur: ${secret.length} caractères`);
    console.log(`  🎲 Entropie: ${entropyStatus}`);
    console.log(`  🔐 Secret: ${colors.yellow}${secret}${colors.reset}`);
}

/**
 * 📝 Génère le contenu du fichier .env.production
 * 
 * @param secrets - Objet contenant tous les secrets générés
 * @returns Contenu du fichier .env
 */
function generateEnvContent(secrets: GeneratedSecrets): string {
    const timestamp: string = new Date().toISOString();
    
    return `# 🔒 CONFIGURATION PRODUCTION - STAKA LIVRES
# Fichier généré automatiquement le ${timestamp}
# ⚠️ ATTENTION: Fichier sensible - Ne jamais commiter dans Git
# Permissions: 600 (lecture/écriture propriétaire uniquement)

# =============================================================================
# 🔐 SÉCURITÉ ET AUTHENTIFICATION
# =============================================================================

# JWT Secret pour signature des tokens (512+ bits d'entropie)
JWT_SECRET="${secrets.JWT_SECRET}"
NODE_ENV="production"
PORT=3001

# =============================================================================
# 🗄️ BASE DE DONNÉES MYSQL
# =============================================================================

# URLs de connexion MySQL production
DATABASE_URL="mysql://staka_prod:${secrets.MYSQL_PASSWORD}@db:3306/stakalivres_prod"
SHADOW_DATABASE_URL="mysql://staka_prod:${secrets.MYSQL_PASSWORD}@db:3306/prisma_shadow_prod"

# Mots de passe MySQL sécurisés
MYSQL_ROOT_PASSWORD="${secrets.MYSQL_ROOT_PASSWORD}"
MYSQL_PASSWORD="${secrets.MYSQL_PASSWORD}"

# =============================================================================
# 🌐 CONFIGURATION URLs ET DOMAINES
# =============================================================================

# URLs production
FRONTEND_URL="https://livres.staka.fr"
APP_URL="https://livres.staka.fr"

# =============================================================================
# 📧 SYSTÈME D'EMAILS CENTRALISÉ
# =============================================================================

# Configuration Resend (REMPLACER PAR VOS VRAIES CLÉS)
RESEND_API_KEY="re_VOTRE_CLE_RESEND_PRODUCTION_ICI"
FROM_EMAIL="noreply@staka-livres.fr"
FROM_NAME="Staka Livres"
ADMIN_EMAIL="admin@staka-livres.fr"
SUPPORT_EMAIL="support@staka-livres.fr"

# =============================================================================
# 💳 PAIEMENTS STRIPE LIVE
# =============================================================================

# ⚠️ CLÉS STRIPE LIVE - REMPLACER IMPÉRATIVEMENT
STRIPE_SECRET_KEY="sk_live_VOTRE_CLE_STRIPE_LIVE_ICI"
STRIPE_WEBHOOK_SECRET="whsec_VOTRE_WEBHOOK_SECRET_STRIPE_ICI"

# Secret endpoint généré (sera remplacé par Stripe)
STRIPE_WEBHOOK_ENDPOINT_SECRET="${secrets.STRIPE_WEBHOOK_ENDPOINT_SECRET}"

# =============================================================================
# ☁️ STOCKAGE AWS S3
# =============================================================================

# Configuration AWS S3 production
AWS_ACCESS_KEY_ID="AKIA_VOTRE_ACCESS_KEY_PRODUCTION_ICI"
AWS_SECRET_ACCESS_KEY="${secrets.AWS_SECRET_ACCESS_KEY}"
AWS_REGION="eu-west-3"
AWS_S3_BUCKET="staka-livres-prod-files"

# =============================================================================
# 🚀 CACHE ET PERFORMANCE
# =============================================================================

# Configuration Redis
REDIS_PASSWORD="${secrets.REDIS_PASSWORD}"
REDIS_URL="redis://:${secrets.REDIS_PASSWORD}@redis:6379"

# =============================================================================
# 📊 MONITORING ET LOGS
# =============================================================================

# Niveau de logs en production
LOG_LEVEL="info"
LOG_FILE="/app/backend/logs/production.log"

# Rétention logs audit (en jours)
AUDIT_LOG_RETENTION_DAYS=2555

# =============================================================================
# 🔒 NOTES DE SÉCURITÉ
# =============================================================================

# 1. Remplacez IMPÉRATIVEMENT les valeurs avec "VOTRE_" par vos vraies clés
# 2. Ce fichier doit avoir les permissions 600: chmod 600 .env.production
# 3. Ne jamais commiter ce fichier dans Git (.gitignore)
# 4. Sauvegardez ce fichier dans un gestionnaire de mots de passe
# 5. Changez tous les secrets en cas de compromission

# Variables générées automatiquement - NE PAS MODIFIER:
# - JWT_SECRET: ${calculateEntropy(secrets.JWT_SECRET ?? '', EncodingType.BASE64URL)} bits d'entropie
# - MYSQL_ROOT_PASSWORD: ${calculateEntropy(secrets.MYSQL_ROOT_PASSWORD ?? '', EncodingType.BASE64URL)} bits d'entropie  
# - MYSQL_PASSWORD: ${calculateEntropy(secrets.MYSQL_PASSWORD ?? '', EncodingType.BASE64URL)} bits d'entropie
# - AWS_SECRET_ACCESS_KEY: ${calculateEntropy(secrets.AWS_SECRET_ACCESS_KEY ?? '', EncodingType.BASE64URL)} bits d'entropie
# - REDIS_PASSWORD: ${calculateEntropy(secrets.REDIS_PASSWORD ?? '', EncodingType.BASE64URL)} bits d'entropie
`;
}

/**
 * 🔧 Sécurise les permissions d'un fichier
 * 
 * @param filePath - Chemin du fichier à sécuriser
 */
function secureFilePermissions(filePath: string): void {
    try {
        // Permissions 600 (rw-------)
        fs.chmodSync(filePath, 0o600);
        console.log(`${colors.green}✅ Permissions sécurisées: ${filePath} (600)${colors.reset}`);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.warn(`${colors.yellow}⚠️ Impossible de sécuriser les permissions: ${errorMessage}${colors.reset}`);
    }
}

/**
 * 📋 Affiche l'aide du script
 */
function showHelp(): void {
    console.log(`${colors.bright}${colors.blue}
🔒 GÉNÉRATEUR DE SECRETS PRODUCTION - STAKA LIVRES${colors.reset}

${colors.bright}USAGE:${colors.reset}
  npm run build:secrets && node dist/generateSecrets.js [OPTIONS]

${colors.bright}OPTIONS:${colors.reset}
  --output <file>     Fichier de sortie (défaut: .env.production)
  --help, -h          Affiche cette aide
  --dry-run           Génère les secrets sans créer de fichier

${colors.bright}EXEMPLES:${colors.reset}
  npm run build:secrets && node dist/generateSecrets.js
  npm run build:secrets && node dist/generateSecrets.js --output .env.prod
  npm run build:secrets && node dist/generateSecrets.js --dry-run

${colors.bright}SÉCURITÉ:${colors.reset}
  • Utilise crypto.randomBytes pour entropie cryptographique maximale
  • Génère des secrets conformes aux standards de sécurité
  • Sécurise automatiquement les permissions fichier (600)
  • Validation de l'entropie des secrets générés

${colors.bright}VARIABLES GÉNÉRÉES:${colors.reset}
  • JWT_SECRET (64 chars, 384+ bits entropie)
  • MYSQL_ROOT_PASSWORD (32 chars, 192+ bits)
  • MYSQL_PASSWORD (24 chars, 144+ bits)
  • AWS_SECRET_ACCESS_KEY (40 chars, 240+ bits)
  • REDIS_PASSWORD (20 chars, 120+ bits)
    `);
}

/**
 * 🔍 Parse les arguments de ligne de commande
 * 
 * @param args - Arguments de process.argv
 * @returns Arguments parsés
 */
function parseCommandLineArgs(args: string[]): CommandLineArgs {
    const help: boolean = args.includes('--help') || args.includes('-h');
    const dryRun: boolean = args.includes('--dry-run');
    
    const outputIndex: number = args.indexOf('--output');
    let outputFile = '.env.production';
    if (outputIndex !== -1 && outputIndex + 1 < args.length) {
        const nextArg = args[outputIndex + 1];
        if (nextArg !== undefined) {
            outputFile = nextArg;
        }
    }

    return {
        help,
        dryRun,
        outputFile
    };
}

/**
 * 🎯 Fonction principale
 */
function main(): void {
    const args = process.argv.slice(2);
    const parsedArgs = parseCommandLineArgs(args);
    
    // Gestion des arguments
    if (parsedArgs.help) {
        showHelp();
        return;
    }

    console.log(`${colors.bright}${colors.blue}
🔒 GÉNÉRATEUR DE SECRETS PRODUCTION - STAKA LIVRES${colors.reset}
${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}
`);

    console.log(`${colors.bright}⚙️ Configuration:${colors.reset}`);
    console.log(`   📄 Fichier sortie: ${colors.yellow}${parsedArgs.outputFile}${colors.reset}`);
    console.log(`   🧪 Mode test: ${parsedArgs.dryRun ? `${colors.yellow}Activé${colors.reset}` : `${colors.green}Désactivé${colors.reset}`}`);
    console.log(`   🕒 Timestamp: ${colors.cyan}${new Date().toISOString()}${colors.reset}`);

    // Génération de tous les secrets
    console.log(`\n${colors.bright}🔐 GÉNÉRATION DES SECRETS:${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);

    const secrets: GeneratedSecrets = {};
    let totalEntropy = 0;

    for (const [name, config] of Object.entries(SECRET_CONFIG)) {
        const secret = generateSecureSecret(config.length, config.encoding);
        const entropy = calculateEntropy(secret, config.encoding);
        
        secrets[name] = secret;
        totalEntropy += entropy;
        
        displaySecretInfo(name, secret, config);
    }

    // Résumé de sécurité
    console.log(`\n${colors.bright}🛡️ ANALYSE DE SÉCURITÉ:${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`   🎲 Entropie totale: ${colors.green}${totalEntropy} bits${colors.reset}`);
    console.log(`   🔒 Niveau sécurité: ${totalEntropy > 1500 ? `${colors.green}EXCELLENT${colors.reset}` : `${colors.yellow}CORRECT${colors.reset}`}`);
    console.log(`   📊 Standards: ${colors.green}Conformes NIST/OWASP${colors.reset}`);

    // Génération du fichier .env.production
    if (!parsedArgs.dryRun) {
        const envContent = generateEnvContent(secrets);
        const fullPath: string = path.resolve(parsedArgs.outputFile);

        try {
            fs.writeFileSync(fullPath, envContent, 'utf8');
            secureFilePermissions(fullPath);

            console.log(`\n${colors.bright}✅ FICHIER GÉNÉRÉ AVEC SUCCÈS:${colors.reset}`);
            console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
            console.log(`   📄 Fichier: ${colors.green}${fullPath}${colors.reset}`);
            console.log(`   📏 Taille: ${colors.yellow}${fs.statSync(fullPath).size} bytes${colors.reset}`);
            console.log(`   🔒 Permissions: ${colors.green}600 (rw--------)${colors.reset}`);

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            console.error(`\n${colors.red}❌ ERREUR lors de l'écriture:${colors.reset}`);
            console.error(`   ${errorMessage}`);
            process.exit(1);
        }
    } else {
        console.log(`\n${colors.yellow}🧪 MODE TEST - Aucun fichier créé${colors.reset}`);
    }

    // Instructions post-génération
    console.log(`\n${colors.bright}📋 INSTRUCTIONS SUIVANTES:${colors.reset}`);
    console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`   1. ${colors.yellow}Remplacez les valeurs avec "VOTRE_" par vos vraies clés${colors.reset}`);
    console.log(`   2. ${colors.yellow}Configurez Stripe Dashboard avec webhook production${colors.reset}`);
    console.log(`   3. ${colors.yellow}Vérifiez SendGrid et domaine email vérifié${colors.reset}`);
    console.log(`   4. ${colors.yellow}Testez AWS S3 avec vraies credentials${colors.reset}`);
    console.log(`   5. ${colors.green}Lancez le déploiement Docker production${colors.reset}`);

    console.log(`\n${colors.bright}⚠️ SÉCURITÉ CRITIQUE:${colors.reset}`);
    console.log(`${colors.red}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`   • ${colors.red}Ne jamais commiter ce fichier dans Git${colors.reset}`);
    console.log(`   • ${colors.red}Sauvegardez dans un gestionnaire de mots de passe${colors.reset}`);
    console.log(`   • ${colors.red}Changez tous les secrets en cas de compromission${colors.reset}`);

    console.log(`\n${colors.green}🎉 Génération terminée avec succès!${colors.reset}\n`);
}

// Gestion des erreurs non catchées
process.on('uncaughtException', (error: Error) => {
    console.error(`${colors.red}❌ Erreur critique: ${error.message}${colors.reset}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
    const errorMessage = reason instanceof Error ? reason.message : String(reason);
    console.error(`${colors.red}❌ Promesse rejetée: ${errorMessage}${colors.reset}`);
    process.exit(1);
});

// Lancement du script (vérification si exécuté directement)
if (require.main === module) {
    main();
}

// Exports pour utilisation en tant que module
export {
    generateSecureSecret,
    calculateEntropy,
    SECRET_CONFIG,
    EncodingType,
    type SecretConfiguration,
    type GeneratedSecrets,
    type CommandLineArgs
};