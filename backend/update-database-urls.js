#!/usr/bin/env node
/**
 * Script pour mettre à jour les URLs S3 vers les URLs locales en base de données
 */

require('dotenv').config();

console.log('🔄 Mise à jour des URLs S3 → URLs locales en base de données\n');

// Configuration
const URL_MAPPINGS = {
  // Factures: URLs S3 → URLs locales
  invoices: {
    from: /https:\/\/.*\.s3\..*\.amazonaws\.com\/.*invoice.*\.pdf/gi,
    to: (filename) => `/uploads/invoices/${filename}`,
    description: 'Factures PDF (S3 → Local)'
  },
  
  // Fichiers de projets  
  projectFiles: {
    from: /https:\/\/.*\.s3\..*\.amazonaws\.com\/.*project.*\.(pdf|doc|docx|txt|jpg|png|zip)/gi,
    to: (filename) => `/uploads/projects/${filename}`,
    description: 'Fichiers de projets (S3 → Local)'
  },
  
  // Pièces jointes de messages
  messageFiles: {
    from: /https:\/\/.*\.s3\..*\.amazonaws\.com\/.*message.*\.(pdf|doc|docx|txt|jpg|png|zip)/gi,
    to: (filename) => `/uploads/messages/${filename}`,  
    description: 'Pièces jointes messages (S3 → Local)'
  }
};

async function updateDatabaseUrls() {
  try {
    // Importer Prisma uniquement si nécessaire
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('🔗 Connexion à la base de données...');
    
    let totalUpdated = 0;
    
    // 1. Mettre à jour les URLs des factures
    console.log('\n📄 Mise à jour des URLs de factures:');
    const invoices = await prisma.invoice.findMany({
      where: {
        pdfUrl: {
          contains: 's3'  // URLs S3
        }
      }
    });
    
    console.log(`   Trouvé: ${invoices.length} factures avec URLs S3`);
    
    for (const invoice of invoices) {
      const oldUrl = invoice.pdfUrl;
      
      // Extraire le nom de fichier de l'ancienne URL
      const filename = oldUrl.split('/').pop();
      const newUrl = `/uploads/invoices/${filename}`;
      
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { pdfUrl: newUrl }
      });
      
      console.log(`   ✅ ${invoice.number}: ${oldUrl} → ${newUrl}`);
      totalUpdated++;
    }
    
    // 2. Mettre à jour les URLs des fichiers de projets
    console.log('\n📁 Mise à jour des URLs de fichiers de projets:');
    const projectFiles = await prisma.file.findMany({
      where: {
        url: {
          contains: 's3'  // URLs S3
        }
      }
    });
    
    console.log(`   Trouvé: ${projectFiles.length} fichiers avec URLs S3`);
    
    for (const file of projectFiles) {
      const oldUrl = file.url;
      
      // Extraire le nom de fichier
      const filename = oldUrl.split('/').pop();
      let newUrl;
      
      // Déterminer le dossier selon le type de fichier
      if (file.description && file.description.includes('ADMIN_FILE')) {
        newUrl = `/uploads/projects/${filename}`; // Documents corrigés
      } else if (file.commandeId) {
        newUrl = `/uploads/projects/${filename}`; // Fichiers de projets
      } else {
        newUrl = `/uploads/messages/${filename}`; // Messages par défaut
      }
      
      await prisma.file.update({
        where: { id: file.id },
        data: { url: newUrl }
      });
      
      console.log(`   ✅ ${file.filename}: ${oldUrl} → ${newUrl}`);
      totalUpdated++;
    }
    
    // 3. Statistiques finales
    console.log(`\n📊 Mise à jour terminée:`);
    console.log(`   ✅ ${totalUpdated} URLs mises à jour`);
    console.log(`   📁 Nouveau format: /uploads/{invoices,projects,messages}/filename`);
    console.log(`   🗑️  Anciennes URLs S3 supprimées`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    console.log('\n💡 Suggestions:');
    console.log('   • Vérifier la connexion à la base de données');
    console.log('   • Vérifier les variables DATABASE_URL dans .env');
    console.log('   • Exécuter npx prisma generate si nécessaire');
  }
}

// Mode simulation (sans modification)
async function simulateUpdate() {
  console.log('🧪 Mode simulation (aucune modification en base)\n');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    // Compter les URLs S3 existantes
    const invoicesCount = await prisma.invoice.count({
      where: { pdfUrl: { contains: 's3' } }
    });
    
    const filesCount = await prisma.file.count({  
      where: { url: { contains: 's3' } }
    });
    
    console.log('📈 URLs S3 détectées:');
    console.log(`   📄 ${invoicesCount} factures`);
    console.log(`   📁 ${filesCount} fichiers de projets`);
    console.log(`   📊 ${invoicesCount + filesCount} URLs total à migrer`);
    
    console.log('\n🔄 Pour exécuter la migration:');
    console.log('   node update-database-urls.js --execute');
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Erreur simulation:', error.message);
  }
}

// Détecter le mode d'exécution
const executeMode = process.argv.includes('--execute');

if (executeMode) {
  console.log('⚡ Mode exécution - Modification en base activée\n');
  updateDatabaseUrls();
} else {
  simulateUpdate();
}