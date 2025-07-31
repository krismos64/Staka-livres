// Script temporaire pour créer des données de test
const { PrismaClient, StatutCommande, FileType } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🔄 Création de données de test...');

    // Créer ou récupérer l'utilisateur test
    let testUser = await prisma.user.findUnique({
      where: { email: 'usertest@test.com' }
    });

    if (!testUser) {
      console.log('🔄 Création de l\'utilisateur test...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Usertes123@', 10);
      
      testUser = await prisma.user.create({
        data: {
          email: 'usertest@test.com',
          password: hashedPassword,
          role: 'USER',
          isActive: true,
          prenom: 'User',
          nom: 'Test'
        }
      });
      console.log('✅ Utilisateur test créé');
    }

    console.log(`✅ Utilisateur test trouvé: ${testUser.email} (ID: ${testUser.id})`);

    // Créer un projet de test pour cet utilisateur
    const testProject = await prisma.commande.create({
      data: {
        userId: testUser.id,
        titre: 'Projet de test - Correction manuscrit',
        description: 'Correction d\'un manuscrit de 150 pages pour test des fonctionnalités',
        statut: StatutCommande.EN_COURS,
        dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Dans 7 jours
        amount: 30000 // 300€
      }
    });

    console.log(`✅ Projet créé: ${testProject.titre} (ID: ${testProject.id})`);

    // Créer le répertoire uploads/projects s'il n'existe pas
    const uploadsDir = path.join(__dirname, 'uploads', 'projects');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Répertoire uploads/projects créé');
    }

    // Créer un fichier de test
    const testFileName = 'test-document.txt';
    const testFilePath = path.join(uploadsDir, testFileName);
    const testFileContent = 'Ceci est un fichier de test pour valider le système de téléchargement.';
    
    fs.writeFileSync(testFilePath, testFileContent);
    console.log(`📄 Fichier de test créé: ${testFilePath}`);

    // Ajouter le fichier en base
    const testFile = await prisma.file.create({
      data: {
        filename: 'Document de test.txt',
        storedName: testFileName,
        mimeType: 'text/plain',
        size: testFileContent.length,
        type: FileType.DOCUMENT,
        url: `/uploads/projects/${testFileName}`,
        commandeId: testProject.id,
        uploadedById: testUser.id
      }
    });

    console.log(`✅ Fichier ajouté en base: ${testFile.filename} (ID: ${testFile.id})`);

    console.log('\n🎉 Données de test créées avec succès !');
    console.log(`📋 Résumé:`);
    console.log(`   - Utilisateur: ${testUser.email}`);
    console.log(`   - Projet: ${testProject.titre}`);
    console.log(`   - Fichier: ${testFile.filename} (ID: ${testFile.id})`);
    console.log(`\n🔗 Pour tester le téléchargement:`);
    console.log(`   GET http://localhost:3001/api/files/download/${testFile.id}`);

  } catch (error) {
    console.error('❌ Erreur lors de la création des données de test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();