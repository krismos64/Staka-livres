import {
  FileType,
  InvoiceStatus,
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

  // 2.5. Création d'utilisateurs supplémentaires pour tests
  const user2 = await prisma.user.upsert({
    where: { email: "marie.martin@example.com" },
    update: {},
    create: {
      prenom: "Marie",
      nom: "Martin",
      email: "marie.martin@example.com",
      password: userPassword,
      role: Role.USER,
      isActive: true,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: "pierre.durand@example.com" },
    update: {},
    create: {
      prenom: "Pierre",
      nom: "Durand",
      email: "pierre.durand@example.com",
      password: userPassword,
      role: Role.USER,
      isActive: true,
    },
  });

  console.log("✅ Utilisateurs créés/mise à jour:");
  console.log(`- Admin: ${admin.email} (${admin.id})`);
  console.log(`- User1: ${user.email} (${user.id})`);
  console.log(`- User2: ${user2.email} (${user2.id})`);
  console.log(`- User3: ${user3.email} (${user3.id})`);

  // 3. Création de commandes variées pour tous les statuts
  const commandes: any[] = [];

  // Commande 1 - EN_ATTENTE
  const commande1 = await prisma.commande.create({
    data: {
      userId: user.id,
      titre: "Correction manuscrit - Roman",
      description:
        "Correction orthographique et grammaticale d'un roman de 300 pages.",
      statut: StatutCommande.EN_ATTENTE,
      priorite: Priorite.NORMALE,
      amount: 4999,
    },
  });
  commandes.push(commande1);

  // Commande 2 - EN_COURS
  const commande2 = await prisma.commande.create({
    data: {
      userId: admin.id,
      titre: "Mise en page livre",
      description: "Mise en page professionnelle d'un recueil de poésies.",
      statut: StatutCommande.EN_COURS,
      priorite: Priorite.URGENTE,
      amount: 12000,
    },
  });
  commandes.push(commande2);

  // Commande 3 - TERMINE
  const commande3 = await prisma.commande.create({
    data: {
      userId: user2.id,
      titre: "Correction essai philosophique",
      description: "Correction complète d'un essai de 150 pages.",
      statut: StatutCommande.TERMINE,
      priorite: Priorite.NORMALE,
      amount: 3500,
      createdAt: new Date("2024-01-15"),
    },
  });
  commandes.push(commande3);

  // Commande 4 - ANNULEE
  const commande4 = await prisma.commande.create({
    data: {
      userId: user2.id,
      titre: "Projet annulé",
      description: "Commande annulée par le client.",
      statut: StatutCommande.ANNULEE,
      priorite: Priorite.FAIBLE,
      amount: 2000,
      createdAt: new Date("2024-02-01"),
    },
  });
  commandes.push(commande4);

  // Commande 5 - SUSPENDUE
  const commande5 = await prisma.commande.create({
    data: {
      userId: user3.id,
      titre: "Correction biographie - En attente infos",
      description:
        "Correction suspendue en attente d'informations complémentaires du client.",
      statut: StatutCommande.SUSPENDUE,
      priorite: Priorite.NORMALE,
      amount: 6500,
      createdAt: new Date("2024-02-15"),
    },
  });
  commandes.push(commande5);

  // Commande 6 - EN_ATTENTE (récente)
  const commande6 = await prisma.commande.create({
    data: {
      userId: user3.id,
      titre: "Relecture manuscrit thriller",
      description: "Relecture approfondie d'un thriller de 250 pages.",
      statut: StatutCommande.EN_ATTENTE,
      priorite: Priorite.HAUTE,
      amount: 4200,
    },
  });
  commandes.push(commande6);

  console.log("✅ Commandes créées:");
  commandes.forEach((cmd, index) => {
    console.log(
      `- Commande ${index + 1}: ${cmd.titre} (${cmd.statut}) - User: ${
        cmd.userId
      }`
    );
  });

  // 4. Création de fichiers attachés à certaines commandes
  const fileUser = await prisma.file.create({
    data: {
      filename: "manuscrit_roman.pdf",
      storedName: "client_1234.pdf",
      mimeType: "application/pdf",
      size: 152500,
      url: "https://exemple.staka.fr/fake.pdf",
      type: FileType.DOCUMENT,
      uploadedById: user.id,
      commandeId: commande1.id,
    },
  });

  const fileAdmin = await prisma.file.create({
    data: {
      filename: "recueil_poesies.docx",
      storedName: "admin_5678.docx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 225000,
      url: "https://exemple.staka.fr/fake_admin.docx",
      type: FileType.DOCUMENT,
      uploadedById: admin.id,
      commandeId: commande2.id,
    },
  });

  // 5. Création d'un message lié à la commande
  const message = await prisma.message.create({
    data: {
      senderId: admin.id,
      receiverId: user.id,
      commandeId: commande1.id,
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

  // 9. Création d'une facture réelle pour une commande payée
  console.log("📋 Création d'une facture réelle...");

  // Récupération de l'utilisateur client (adaptation du code original)
  const clientUser = await prisma.user.findUnique({
    where: { email: "marie.martin@example.com" },
  });

  if (!clientUser) {
    throw new Error("Client non trouvé");
  }

  // Récupération de la commande terminée (équivalent d'une commande payée)
  const paidOrder = await prisma.commande.findFirst({
    where: {
      userId: clientUser.id,
      statut: StatutCommande.TERMINE,
      amount: { not: null },
    },
  });

  if (!paidOrder) {
    throw new Error("Commande payée non trouvée");
  }

  // Création de la facture réelle
  const invoice = await prisma.invoice.create({
    data: {
      commandeId: paidOrder.id,
      number: "INV-2025-0001",
      amount: paidOrder.amount!, // 3500 centimes = 35.00€
      taxAmount: Math.round(paidOrder.amount! * 0.2), // TVA 20%
      status: InvoiceStatus.PAID,
      pdfUrl:
        "https://staka-s3-bucket.s3.eu-west-3.amazonaws.com/invoices/INV-2025-0001.pdf",
      issuedAt: new Date("2025-06-30T10:00:00Z"),
      dueAt: new Date("2025-07-15T23:59:59Z"),
      paidAt: new Date("2025-06-30T14:30:00Z"),
    },
  });

  console.log("✅ Seed invoice INV-2025-0001 created");
  console.log(
    `📋 Facture créée: ${invoice.number} pour ${(invoice.amount / 100).toFixed(
      2
    )}€`
  );
  console.log(
    `👤 Client: ${clientUser.prenom} ${clientUser.nom} (${clientUser.email})`
  );
  console.log(`📦 Commande: ${paidOrder.titre}`);

  console.log(
    "🌱 Seed complet ! 6 commandes avec statuts variés créées pour tests."
  );
  console.log("📊 Répartition des statuts:");
  console.log("- EN_ATTENTE: 2 commandes");
  console.log("- EN_COURS: 1 commande");
  console.log("- TERMINE: 1 commande");
  console.log("- ANNULEE: 1 commande");
  console.log("- SUSPENDUE: 1 commande");
  console.log("💰 1 facture réelle créée et payée");
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
