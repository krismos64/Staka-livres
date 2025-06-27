import {
  FileType,
  MessageStatut,
  MessageType,
  NotificationPriority,
  NotificationType,
  Priorite,
  PrismaClient,
  Role,
  StatutCommande,
  SupportCategory,
  SupportPriority,
  SupportRequestStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // 1. Hash des mots de passe
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("user123", 12);

  // 2. Création des utilisateurs (ADMIN + CLIENT)
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

  // 3. Création d'une commande par user
  const commandeUser = await prisma.commande.create({
    data: {
      userId: user.id,
      titre: "Correction manuscrit - Seed",
      description: "Commande fictive liée à un client.",
      statut: StatutCommande.EN_ATTENTE,
      priorite: Priorite.NORMALE,
      amount: 4999,
    },
  });

  const commandeAdmin = await prisma.commande.create({
    data: {
      userId: admin.id,
      titre: "Test admin commande",
      description: "Commande fictive liée à un admin.",
      statut: StatutCommande.EN_COURS,
      priorite: Priorite.URGENTE,
      amount: 12000,
    },
  });

  // 4. Création d'un fichier attaché à chaque commande
  const fileUser = await prisma.file.create({
    data: {
      filename: "exemple_client.pdf",
      storedName: "client_1234.pdf",
      mimeType: "application/pdf",
      size: 152500,
      url: "https://exemple.staka.fr/fake.pdf",
      type: FileType.DOCUMENT,
      uploadedById: user.id,
      commandeId: commandeUser.id,
    },
  });

  const fileAdmin = await prisma.file.create({
    data: {
      filename: "exemple_admin.docx",
      storedName: "admin_5678.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 225000,
      url: "https://exemple.staka.fr/fake_admin.docx",
      type: FileType.DOCUMENT,
      uploadedById: admin.id,
      commandeId: commandeAdmin.id,
    },
  });

  // 5. Création d'un message lié à la commande
  const message = await prisma.message.create({
    data: {
      senderId: admin.id,
      receiverId: user.id,
      commandeId: commandeUser.id,
      subject: "Bienvenue sur Staka Livres !",
      content: "Ceci est votre première conversation.",
      type: MessageType.USER_MESSAGE,
      statut: MessageStatut.ENVOYE,
      isRead: false,
      isArchived: false,
      attachments: {
        create: [{ fileId: fileUser.id }],
      },
    },
  });

  // 6. Notification pour l'utilisateur
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "Nouveau message reçu",
      message: "Vous avez un nouveau message de l'équipe Staka.",
      type: NotificationType.MESSAGE,
      priority: NotificationPriority.NORMALE,
      isRead: false,
      isDeleted: false,
    },
  });

  // 7. Méthode de paiement fictive
  await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      stripePaymentMethodId: "pm_fake_1234",
      brand: "visa",
      last4: "4242",
      expMonth: 12,
      expYear: 2029,
      isDefault: true,
      isActive: true,
      fingerprint: "fp_fake",
    },
  });

  // 8. Ticket support + message support
  const support = await prisma.supportRequest.create({
    data: {
      userId: user.id,
      title: "Problème de connexion",
      description: "Je n'arrive pas à accéder à mon espace.",
      category: SupportCategory.TECHNIQUE,
      priority: SupportPriority.NORMALE,
      status: SupportRequestStatus.OUVERT,
      assignedToId: admin.id,
      createdAt: new Date(),
    },
  });

  await prisma.message.create({
    data: {
      senderId: admin.id,
      receiverId: user.id,
      supportRequestId: support.id,
      subject: "Votre demande de support",
      content: "Nous traitons votre demande de support au plus vite.",
      type: MessageType.SUPPORT_MESSAGE,
      statut: MessageStatut.ENVOYE,
      isRead: false,
    },
  });

  console.log(
    "🌱 Seed complet ! Users, commandes, fichiers, messages, support, notif, paiement prêts pour les tests."
  );
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
