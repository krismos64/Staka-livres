import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Suppression de toutes les entités sauf Tarifs et Faq...");

  // Suppression transactionnelle dans l'ordre des dépendances
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.file.deleteMany(),
    prisma.paymentMethod.deleteMany(),
    prisma.passwordReset.deleteMany(),
    prisma.supportRequest.deleteMany(),
    prisma.commande.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("✅ Toutes les entités supprimées (Tarifs et Faq conservés).");

  // Hash des mots de passe
  const adminPassword = await bcrypt.hash("@Staka2020@", 10);
  const userPassword = await bcrypt.hash("Usertes123@", 10);

  console.log("🔑 Création de l'administrateur...");
  await prisma.user.create({
    data: {
      email: "contact@staka.fr",
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
      prenom: "Admin",
      nom: "Staka",
    },
  });

  console.log("✅ Administrateur créé.");

  console.log("🔑 Création de l'utilisateur test...");
  await prisma.user.create({
    data: {
      email: "usertest@test.com",
      password: userPassword,
      role: Role.USER,
      isActive: true,
      prenom: "User",
      nom: "Test",
    },
  });

  console.log("✅ Utilisateur test créé.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🌱 Seed terminé avec succès.");
  })
  .catch(async (e) => {
    console.error("❌ Erreur lors du seed :", e);
    await prisma.$disconnect();
    process.exit(1);
  });
