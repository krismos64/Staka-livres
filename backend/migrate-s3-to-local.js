#!/usr/bin/env node
/**
 * Script de migration des données S3 vers stockage local
 * ATTENTION: Nécessite les credentials AWS temporaires pour la migration
 */

const fs = require('fs');
const path = require('path');

// Configuration de migration
const MIGRATION_CONFIG = {
  // Activé uniquement si les vraies clés AWS sont présentes
  enabled: process.env.AWS_ACCESS_KEY_ID && 
           !process.env.AWS_ACCESS_KEY_ID.startsWith('test-') &&
           process.env.AWS_SECRET_ACCESS_KEY &&
           process.env.AWS_S3_BUCKET,
  
  // Dossiers de destination
  localDirs: {
    invoices: './uploads/invoices',
    projects: './uploads/projects', 
    messages: './uploads/messages'
  },
  
  // Limite de fichiers pour éviter les gros transferts
  maxFiles: 100,
  
  // Types de fichiers à migrer
  fileTypes: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.zip']
};

console.log('🔄 Script de migration S3 → Stockage Local\n');

// Vérifier la configuration
if (!MIGRATION_CONFIG.enabled) {
  console.log('⚠️  Migration S3 désactivée:');
  console.log('   • Pas de credentials AWS valides détectés');
  console.log('   • Variables AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY manquantes');
  console.log('   • Ou clés de test détectées (commençant par "test-")\n');
  
  console.log('📋 Pour activer la migration:');
  console.log('   1. Configurer les vraies clés AWS temporairement');
  console.log('   2. Exporter AWS_ACCESS_KEY_ID=your_real_key');
  console.log('   3. Exporter AWS_SECRET_ACCESS_KEY=your_real_secret');
  console.log('   4. Exporter AWS_S3_BUCKET=your_bucket_name');
  console.log('   5. Relancer ce script\n');
  
  console.log('🎯 Alternative recommandée:');
  console.log('   • Télécharger manuellement les fichiers importants via AWS Console');
  console.log('   • Les placer dans les dossiers ./uploads/{invoices,projects,messages}');  
  console.log('   • Mettre à jour les URLs en base de données si nécessaire\n');
  
  createSampleFiles();
  process.exit(0);
}

// Si AWS est configuré, tenter la migration
console.log('✅ Configuration AWS détectée');
console.log(`   Bucket: ${process.env.AWS_S3_BUCKET}`);
console.log(`   Région: ${process.env.AWS_REGION || 'eu-west-3'}\n`);

async function migrateFromS3() {
  try {
    // Importer AWS SDK uniquement si nécessaire
    const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-3',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    console.log('🔍 Scan du bucket S3...');
    
    // Lister les objets S3
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET,
      MaxKeys: MIGRATION_CONFIG.maxFiles
    });
    
    const response = await s3Client.send(listCommand);
    const objects = response.Contents || [];
    
    console.log(`📦 ${objects.length} objets trouvés dans S3\n`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const object of objects) {
      const key = object.Key;
      const fileExt = path.extname(key).toLowerCase();
      
      // Filtrer par type de fichier
      if (!MIGRATION_CONFIG.fileTypes.includes(fileExt)) {
        console.log(`⏭️  Ignoré: ${key} (type non supporté)`);
        skippedCount++;
        continue;
      }
      
      // Déterminer le dossier local
      let localDir;
      if (key.includes('invoice') || key.includes('facture')) {
        localDir = MIGRATION_CONFIG.localDirs.invoices;
      } else if (key.includes('project') || key.includes('commande')) {
        localDir = MIGRATION_CONFIG.localDirs.projects;
      } else if (key.includes('message')) {
        localDir = MIGRATION_CONFIG.localDirs.messages;
      } else {
        localDir = MIGRATION_CONFIG.localDirs.projects; // Par défaut
      }
      
      const fileName = path.basename(key);
      const localPath = path.join(localDir, fileName);
      
      // Vérifier si le fichier existe déjà
      if (fs.existsSync(localPath)) {
        console.log(`⏭️  Existe: ${fileName}`);
        skippedCount++;
        continue;
      }
      
      try {
        // Télécharger depuis S3
        const getCommand = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key
        });
        
        const data = await s3Client.send(getCommand);
        const chunks = [];
        
        // Lire le stream
        for await (const chunk of data.Body) {
          chunks.push(chunk);
        }
        
        const buffer = Buffer.concat(chunks);
        
        // Sauvegarder localement
        fs.writeFileSync(localPath, buffer);
        
        console.log(`✅ Migré: ${key} → ${localPath} (${buffer.length} bytes)`);
        migratedCount++;
        
      } catch (error) {
        console.log(`❌ Erreur: ${key} - ${error.message}`);
        skippedCount++;
      }
    }
    
    console.log(`\n📊 Migration terminée:`);
    console.log(`   ✅ ${migratedCount} fichiers migrés`);
    console.log(`   ⏭️  ${skippedCount} fichiers ignorés`);
    console.log(`   📁 Fichiers sauvés dans ./uploads/`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration S3:', error.message);
    console.log('\n💡 Suggestions:');
    console.log('   • Vérifier les credentials AWS');
    console.log('   • Vérifier les permissions S3 (s3:GetObject, s3:ListBucket)');
    console.log('   • Vérifier le nom du bucket');
  }
}

function createSampleFiles() {
  console.log('📄 Création de fichiers d\'exemple pour le développement:\n');
  
  // Créer des fichiers de démonstration
  const sampleFiles = [
    {
      path: './uploads/invoices/demo-invoice-001.pdf',
      content: '%PDF-1.4\n%Fake PDF for development\nDemo Invoice #001\nAmount: 29.99€'
    },
    {
      path: './uploads/projects/demo-project-file.txt', 
      content: 'Document de projet de démonstration\nTéléchargé le: ' + new Date().toISOString()
    },
    {
      path: './uploads/messages/demo-message-attachment.txt',
      content: 'Pièce jointe de message de démonstration\nFichier de test pour le développement'
    }
  ];
  
  sampleFiles.forEach(file => {
    const dir = path.dirname(file.path);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(file.path, file.content);
    console.log(`✅ Créé: ${file.path}`);
  });
  
  console.log('\n🎯 Fichiers de démonstration créés pour le développement');
  console.log('   Ces fichiers permettent de tester le système sans migration S3');
}

// Exécuter la migration ou créer des exemples
if (MIGRATION_CONFIG.enabled) {
  migrateFromS3();
} else {
  createSampleFiles();
}