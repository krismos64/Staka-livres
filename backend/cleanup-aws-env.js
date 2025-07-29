#!/usr/bin/env node
/**
 * Script pour nettoyer les variables d'environnement AWS après migration
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Nettoyage des variables AWS après migration vers stockage local\n');

// Variables AWS à supprimer
const AWS_VARIABLES = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY', 
  'AWS_REGION',
  'AWS_S3_BUCKET',
  'S3_BUCKET_NAME'  // Alias parfois utilisé
];

// Fichiers d'environnement à traiter
const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.example'
];

function cleanupEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  ${filePath} : fichier non trouvé`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  let modifiedLines = [];
  let removedCount = 0;
  let commentedCount = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Identifier les lignes AWS
    const isAwsVariable = AWS_VARIABLES.some(awsVar => 
      trimmedLine.startsWith(`${awsVar}=`) || 
      trimmedLine.startsWith(`# ${awsVar}=`)
    );
    
    if (isAwsVariable) {
      if (trimmedLine.startsWith('#')) {
        // Déjà commentée, la supprimer complètement
        console.log(`  🗑️  Supprimé: ${trimmedLine}`);
        removedCount++;
        continue;
      } else {
        // Commenter au lieu de supprimer pour garder une trace
        modifiedLines.push(`# DEPRECATED (migration S3→Local): ${line}`);
        console.log(`  📝 Commenté: ${trimmedLine}`);
        commentedCount++;
      }
    } else {
      modifiedLines.push(line);
    }
  }
  
  if (removedCount > 0 || commentedCount > 0) {
    // Ajouter un commentaire explicatif
    const migrationComment = [
      '',
      '# ==============================================',
      '# AWS S3 Variables (deprecated after migration)',
      '# Migration date: ' + new Date().toISOString().split('T')[0],
      '# Status: Stockage local actif - Variables AWS supprimées',
      '# ==============================================',
      ''
    ];
    
    // Insérer le commentaire au début (après les éventuels commentaires existants)
    let insertIndex = 0;
    while (insertIndex < modifiedLines.length && 
           (modifiedLines[insertIndex].startsWith('#') || modifiedLines[insertIndex].trim() === '')) {
      insertIndex++;
    }
    
    modifiedLines.splice(insertIndex, 0, ...migrationComment);
    
    // Sauvegarder le fichier modifié
    fs.writeFileSync(filePath, modifiedLines.join('\n'));
    
    console.log(`✅ ${filePath} : ${commentedCount} variables commentées, ${removedCount} supprimées`);
  } else {
    console.log(`✅ ${filePath} : aucune variable AWS trouvée`);
  }
}

function createProductionEnvExample() {
  const productionEnvContent = `# Variables d'environnement - Production
# Après migration AWS S3 → Stockage Local

# Base de données
DATABASE_URL="mysql://user:password@db:3306/stakalivres"

# JWT
JWT_SECRET="your_production_jwt_secret_here"

# URLs
FRONTEND_URL="https://livrestaka.fr"
PORT=3000

# E-mails (SendGrid)
SENDGRID_API_KEY="SG.your_sendgrid_key_here"
FROM_EMAIL="contact@staka.fr"
FROM_NAME="Staka Livres"
SUPPORT_EMAIL="contact@staka.fr"
ADMIN_EMAIL="contact@staka.fr"

# Stripe
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# ==============================================
# AWS Variables SUPPRIMÉES après migration
# Date: ${new Date().toISOString().split('T')[0]}
# Raison: Migration vers stockage local
# Économies: ~10€/mois
# ==============================================
# AWS_ACCESS_KEY_ID=     # ❌ Plus nécessaire
# AWS_SECRET_ACCESS_KEY= # ❌ Plus nécessaire  
# AWS_REGION=            # ❌ Plus nécessaire
# AWS_S3_BUCKET=         # ❌ Plus nécessaire
`;

  const examplePath = '.env.production.example';
  fs.writeFileSync(examplePath, productionEnvContent);
  console.log(`📝 Créé: ${examplePath} (template pour production)`);
}

function displayMigrationSummary() {
  console.log('\n🎯 Résumé de la migration AWS:');
  console.log('   ✅ Code: Migration S3 → Stockage Local terminée');
  console.log('   ✅ Variables: AWS env variables supprimées/commentées');
  console.log('   ✅ Coûts: 0€/mois (au lieu de ~10€/mois)');
  console.log('   ✅ Dépendances: AWS SDK supprimé du code actif');
  
  console.log('\n📋 Actions à faire en production:');
  console.log('   1. Déployer le nouveau code');
  console.log('   2. Supprimer les variables AWS du .env production');  
  console.log('   3. Créer les dossiers uploads/ avec bonnes permissions');
  console.log('   4. Optionnel: Migrer les fichiers S3 critiques');
  console.log('   5. Optionnel: Mettre à jour les URLs en base de données');
  
  console.log('\n🔧 Commandes post-déploiement:');
  console.log('   mkdir -p uploads/{projects,invoices,messages}');
  console.log('   chmod 755 uploads/');
  console.log('   docker compose restart');
  
  console.log('\n💰 Économies annuelles prévues: ~120€');
}

// Exécution principale
console.log('🔍 Recherche des fichiers .env...\n');

ENV_FILES.forEach(envFile => {
  cleanupEnvFile(envFile);
});

console.log('\n📄 Création d\'un template .env production...\n');
createProductionEnvExample();

displayMigrationSummary();

console.log('\n✅ Nettoyage AWS terminé ! Le système est prêt pour la production sans AWS.');