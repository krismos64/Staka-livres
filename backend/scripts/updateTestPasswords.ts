import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function updateTestPasswords() {
  try {
    console.log("🔐 Mise à jour des mots de passe des comptes de test...");

    // Nouveaux mots de passe conformes RGPD/CNIL
    const adminPassword = "AdminStaka2025!"; // 14 caractères avec majuscules, minuscules, chiffres et symboles
    const userPassword = "UserTest2025!";   // 13 caractères avec majuscules, minuscules, chiffres et symboles

    // Hash des nouveaux mots de passe
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);
    const hashedUserPassword = await bcrypt.hash(userPassword, 12);

    // Mise à jour du compte admin
    const adminResult = await prisma.user.updateMany({
      where: { email: "admin@staka-editions.com" },
      data: { password: hashedAdminPassword }
    });

    // Mise à jour du compte user
    const userResult = await prisma.user.updateMany({
      where: { email: "user@example.com" },
      data: { password: hashedUserPassword }
    });

    console.log(`✅ Compte admin mis à jour: ${adminResult.count} utilisateur(s)`);
    console.log(`✅ Compte user mis à jour: ${userResult.count} utilisateur(s)`);

    console.log("\n🎯 Nouveaux mots de passe des comptes de test :");
    console.log(`📧 admin@staka-editions.com -> ${adminPassword}`);
    console.log(`📧 user@example.com -> ${userPassword}`);

    console.log("\n✅ Mise à jour terminée avec succès !");

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestPasswords();