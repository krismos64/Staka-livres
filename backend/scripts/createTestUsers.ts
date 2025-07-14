import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log("👥 Création des utilisateurs de test...");

    // Nouveaux mots de passe conformes RGPD/CNIL
    const adminPassword = "AdminStaka2025!"; // 14 caractères avec majuscules, minuscules, chiffres et symboles
    const userPassword = "UserTest2025!";   // 13 caractères avec majuscules, minuscules, chiffres et symboles

    // Hash des mots de passe
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
    const hashedUserPassword = await bcrypt.hash(userPassword, 12);

    // Créer l'utilisateur admin
    const admin = await prisma.user.upsert({
      where: { email: "admin@staka-editions.com" },
      update: { 
        password: hashedAdminPassword,
        isActive: true 
      },
      create: {
        email: "admin@staka-editions.com",
        password: hashedAdminPassword,
        prenom: "Admin",
        nom: "Staka",
        role: Role.ADMIN,
        isActive: true
      }
    });

    // Créer l'utilisateur test
    const user = await prisma.user.upsert({
      where: { email: "user@example.com" },
      update: { 
        password: hashedUserPassword,
        isActive: true 
      },
      create: {
        email: "user@example.com",
        password: hashedUserPassword,
        prenom: "User",
        nom: "Test",
        role: Role.USER,
        isActive: true
      }
    });

    console.log("✅ Utilisateurs créés/mis à jour avec succès !");
    console.log(`👤 Admin: ${admin.email} (${admin.role})`);
    console.log(`👤 User: ${user.email} (${user.role})`);

    console.log("\n🔐 Nouveaux mots de passe des comptes de test :");
    console.log(`📧 admin@staka-editions.com -> ${adminPassword}`);
    console.log(`📧 user@example.com -> ${userPassword}`);

    console.log("\n✅ Configuration terminée !");

  } catch (error) {
    console.error("❌ Erreur lors de la création:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();