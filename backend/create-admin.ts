import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminPassword = await bcrypt.hash("admin123", 12);

    const admin = await prisma.user.upsert({
      where: { email: "admin@staka-editions.com" },
      update: {
        password: adminPassword,
        role: Role.ADMIN,
        isActive: true,
      },
      create: {
        prenom: "Admin",
        nom: "Staka",
        email: "admin@staka-editions.com",
        password: adminPassword,
        role: Role.ADMIN,
        isActive: true,
      },
    });

    console.log("✅ Admin créé:", admin.email);
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
