import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log("👥 Liste des utilisateurs existants :");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (users.length === 0) {
      console.log("❌ Aucun utilisateur trouvé dans la base de données");
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. 📧 ${user.email}`);
        console.log(`   👤 ${user.prenom} ${user.nom}`);
        console.log(`   🔐 Rôle: ${user.role}`);
        console.log(`   ✅ Actif: ${user.isActive}`);
        console.log(`   📅 Créé: ${user.createdAt.toLocaleDateString('fr-FR')}`);
        console.log("   ---");
      });
    }

    console.log(`\n📊 Total: ${users.length} utilisateur(s)`);

  } catch (error) {
    console.error("❌ Erreur lors de la récupération:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();