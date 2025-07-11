const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAdminRole() {
  try {
    console.log('🔧 Correction du rôle admin...');
    
    // Mettre à jour le rôle de admin@test.com en ADMIN
    const result = await prisma.user.updateMany({
      where: {
        email: 'admin@test.com'
      },
      data: {
        role: 'ADMIN'
      }
    });
    
    console.log(`✅ ${result.count} utilisateur(s) mis à jour avec le rôle ADMIN`);
    
    // Vérifier le résultat
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@test.com'
      },
      select: {
        email: true,
        role: true,
        nom: true,
        prenom: true
      }
    });
    
    if (adminUser) {
      console.log('📋 Utilisateur admin:', adminUser);
    } else {
      console.log('❌ Utilisateur admin@test.com non trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminRole();