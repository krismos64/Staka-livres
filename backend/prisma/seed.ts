import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hash des mots de passe
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  // Créer un utilisateur admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@staka-editions.com" },
    update: {},
    create: {
      prenom: "Admin",
      nom: "Staka",
      email: "admin@staka-editions.com",
      password: adminPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // Créer un utilisateur normal
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      prenom: "Jean",
      nom: "Dupont",
      email: "user@example.com",
      password: userPassword,
      role: Role.USER,
      isActive: true,
    },
  });

  console.log("🌱 Seed completed!");
  console.log("📧 Admin: admin@staka-editions.com / admin123");
  console.log("📧 User: user@example.com / user123");
  console.log({ admin, user });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
