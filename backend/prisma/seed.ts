import {
  FileType,
  InvoiceStatus,
  MessageStatut,
  MessageType,
  NotificationPriority,
  NotificationType,
  PageStatus,
  PageType,
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

  // Purge des tables pour un seed propre
  await prisma.commande.deleteMany({});
  await prisma.file.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.paymentMethod.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.supportRequest.deleteMany({});
  await prisma.fAQ.deleteMany({});
  console.log("✅ Anciennes données purgées.");

  // 3. Création de commandes variées pour tous les statuts
  const commandesData = [
    // Commande 1 - EN_ATTENTE
    {
      userId: user.id,
      titre: "Correction manuscrit - Roman",
      description:
        "Correction orthographique et grammaticale d'un roman de 300 pages.",
      statut: StatutCommande.EN_ATTENTE,
      priorite: Priorite.NORMALE,
      amount: 4999,
    },
    // Commande 2 - EN_COURS
    {
      userId: admin.id,
      titre: "Mise en page livre",
      description: "Mise en page professionnelle d'un recueil de poésies.",
      statut: StatutCommande.EN_COURS,
      priorite: Priorite.URGENTE,
      amount: 12000,
    },
    // Commande 3 - TERMINE
    {
      userId: user2.id,
      titre: "Correction essai philosophique",
      description: "Correction complète d'un essai de 150 pages.",
      statut: StatutCommande.TERMINE,
      priorite: Priorite.NORMALE,
      amount: 3500,
      createdAt: new Date("2024-01-15"),
    },
    // Commande 4 - ANNULEE
    {
      userId: user2.id,
      titre: "Projet annulé",
      description: "Commande annulée par le client.",
      statut: StatutCommande.ANNULEE,
      priorite: Priorite.FAIBLE,
      amount: 2000,
      createdAt: new Date("2024-02-01"),
    },
    // Commande 5 - SUSPENDUE
    {
      userId: user3.id,
      titre: "Correction biographie - En attente infos",
      description:
        "Correction suspendue en attente d'informations complémentaires du client.",
      statut: StatutCommande.SUSPENDUE,
      priorite: Priorite.NORMALE,
      amount: 6500,
      createdAt: new Date("2024-02-15"),
    },
    // Commande 6 - EN_ATTENTE (récente)
    {
      userId: user3.id,
      titre: "Relecture manuscrit thriller",
      description: "Relecture approfondie d'un thriller de 250 pages.",
      statut: StatutCommande.EN_ATTENTE,
      priorite: Priorite.HAUTE,
      amount: 4200,
    },
  ];

  await prisma.commande.createMany({
    data: commandesData,
  });

  const commandes = await prisma.commande.findMany();
  const commande1 = commandes.find((c) => c.titre.includes("Roman"));
  const commande2 = commandes.find((c) => c.titre.includes("Mise en page"));
  if (!commande1 || !commande2) {
    console.error("Erreur: Commandes de base non trouvées après création.");
    return;
  }

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

  // 10. Création des FAQ de démonstration
  console.log("❓ Création des FAQ de démonstration...");

  const faqData = [
    {
      question: "Quels types de manuscrits acceptez-vous ?",
      answer:
        "Nous travaillons avec tous les genres littéraires : romans, nouvelles, essais, biographies, mémoires, poésie, guides pratiques, etc. Nous acceptons les fichiers Word (.doc, .docx) et PDF dans toutes les langues avec caractères latins.",
      details: null,
      categorie: "Général",
      ordre: 1,
      visible: true,
    },
    {
      question: "Quels sont vos délais de livraison ?",
      answer:
        "Le délai moyen est de 7 à 15 jours selon la longueur du manuscrit et le pack choisi. Pour le Pack Intégral, comptez 15 jours pour un manuscrit de 200 pages. Une estimation précise vous est donnée dès réception de votre fichier.",
      details:
        "Délais par service : Correction seule : 7-10 jours • Design + mise en page : 5-7 jours • Pack complet : 10-15 jours • Urgence (48h) : +50% du tarif",
      categorie: "Délais",
      ordre: 2,
      visible: true,
    },
    {
      question: "Comment fonctionne la tarification du Pack Intégral ?",
      answer:
        "Le Pack Intégral suit notre tarification dégressive : 10 premières pages gratuites, puis 2€ par page jusqu'à 300 pages, et 1€ par page au-delà. Si votre livre fait 150 pages, le total sera de 280€ (10 gratuites + 140 × 2€).",
      details:
        "Exemple concret : 100 pages : 180€ (90 pages payantes) • 200 pages : 380€ (190 pages payantes) • 400 pages : 780€ (290 + 100 pages payantes)",
      categorie: "Tarifs",
      ordre: 3,
      visible: true,
    },
    {
      question: "Puis-je demander des modifications après livraison ?",
      answer:
        "Oui, absolument ! Nous offrons des modifications illimitées jusqu'à votre entière satisfaction. C'est notre garantie \"Satisfait ou corrigé\". Vous pouvez demander autant de retouches que nécessaire sans frais supplémentaires.",
      details: null,
      categorie: "Correction",
      ordre: 4,
      visible: true,
    },
    {
      question: "Mes données sont-elles protégées ?",
      answer:
        "Vos manuscrits et données personnelles sont protégés selon le RGPD. Nous signons un accord de confidentialité et ne partageons jamais vos contenus. Vos fichiers sont stockés de manière sécurisée et supprimés après le projet.",
      details: null,
      categorie: "Général",
      ordre: 5,
      visible: true,
    },
    {
      question: "Puis-je parler à un conseiller avant de commander ?",
      answer:
        "Bien sûr ! Contactez-nous via le formulaire, par email ou WhatsApp pour organiser un échange téléphonique gratuit avec un membre de notre équipe éditoriale. Nous répondons à toutes vos questions et vous conseillons le pack le plus adapté.",
      details: null,
      categorie: "Général",
      ordre: 6,
      visible: true,
    },
    {
      question: "Quelle est la différence entre correction et relecture ?",
      answer:
        "La correction traite l'orthographe, la grammaire, la conjugaison et la syntaxe. La relecture va plus loin avec l'amélioration du style, de la cohérence narrative et de la fluidité. Notre Pack Intégral combine les deux pour un résultat optimal.",
      details: null,
      categorie: "Correction",
      ordre: 7,
      visible: true,
    },
    {
      question: "FAQ cachée pour tests admin",
      answer:
        "Cette FAQ n'est pas visible publiquement et sert uniquement aux tests administrateurs.",
      details: null,
      categorie: "Test",
      ordre: 8,
      visible: false,
    },
  ];

  for (const faq of faqData) {
    await prisma.fAQ.create({
      data: faq,
    });
  }

  console.log(
    `✅ ${faqData.length} FAQ créées (${
      faqData.filter((f) => f.visible).length
    } visibles, ${faqData.filter((f) => !f.visible).length} cachées)`
  );

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

  // 11. Seed des tarifs de test (fusion seed-tarifs.ts)
  console.log("🌱 Ajout des tarifs de test...");

  const tarifsDeTest = [
    {
      nom: "Correction Standard",
      description:
        "Correction orthographique, grammaticale et typographique de votre manuscrit",
      prix: 200,
      prixFormate: "2€",
      typeService: "Correction",
      dureeEstimee: "7-10 jours",
      actif: true,
      ordre: 1,
    },
    {
      nom: "Correction Express",
      description: "Correction rapide en 3-5 jours pour les manuscrits urgents",
      prix: 300,
      prixFormate: "3€",
      typeService: "Correction",
      dureeEstimee: "3-5 jours",
      actif: true,
      ordre: 2,
    },
    {
      nom: "Pack KDP Autoédition",
      description:
        "Maquette intérieure + couverture + formats ePub/Mobi pour Amazon KDP",
      prix: 35000,
      prixFormate: "350€",
      typeService: "Mise en forme",
      dureeEstimee: "5-7 jours",
      actif: true,
      ordre: 3,
    },
    {
      nom: "Relecture Avancée",
      description:
        "Relecture approfondie avec suggestions stylistiques et structurelles",
      prix: 250,
      prixFormate: "2,50€",
      typeService: "Relecture",
      dureeEstimee: "10-12 jours",
      actif: true,
      ordre: 4,
    },
    {
      nom: "Pack Rédaction Complète",
      description:
        "Coaching rédactionnel + correction + mise en forme + couverture",
      prix: 145000,
      prixFormate: "1450€",
      typeService: "Rédaction",
      dureeEstimee: "3-6 semaines",
      actif: true,
      ordre: 5,
    },
    {
      nom: "Traduction Français-Anglais",
      description:
        "Traduction professionnelle de votre manuscrit vers l'anglais",
      prix: 120,
      prixFormate: "1,20€",
      typeService: "Traduction",
      dureeEstimee: "2-3 semaines",
      actif: false,
      ordre: 6,
    },
  ];

  // Suppression des tarifs existants
  const existingTarifs = await prisma.tarif.count();
  if (existingTarifs > 0) {
    console.log(`⚠️  ${existingTarifs} tarifs existent déjà. Suppression...`);
    await prisma.tarif.deleteMany();
  }

  // Ajout des nouveaux tarifs
  for (const tarifData of tarifsDeTest) {
    const tarif = await prisma.tarif.create({
      data: tarifData,
    });
    console.log(`✅ Tarif créé: ${tarif.nom} (${tarif.prixFormate})`);
  }
  console.log(`🎉 ${tarifsDeTest.length} tarifs ajoutés avec succès !`);

  // 12. Seed des pages légales (fixes, non supprimables)
  // Purge la table Page avant de reseeder les pages légales
  await prisma.page.deleteMany({});

  const legalPages = [
    {
      slug: "mentions-legales",
      title: "Mentions légales",
      content: "<p>Mentions légales à compléter...</p>",
      metaTitle: "Mentions légales",
      metaDescription: "Mentions légales du site Staka.",
      type: PageType.PAGE,
      status: PageStatus.PUBLISHED,
      isPublic: true,
      sortOrder: 1,
    },
    {
      slug: "politique-confidentialite",
      title: "Politique de confidentialité",
      content: "<p>Politique de confidentialité à compléter...</p>",
      metaTitle: "Politique de confidentialité",
      metaDescription: "Politique de confidentialité du site Staka.",
      type: PageType.PAGE,
      status: PageStatus.PUBLISHED,
      isPublic: true,
      sortOrder: 2,
    },
    {
      slug: "cgv",
      title: "Conditions Générales de Vente",
      content: "<p>CGV à compléter...</p>",
      metaTitle: "CGV",
      metaDescription: "Conditions Générales de Vente du site Staka.",
      type: PageType.PAGE,
      status: PageStatus.PUBLISHED,
      isPublic: true,
      sortOrder: 3,
    },
    {
      slug: "rgpd",
      title: "RGPD",
      content: "<p>RGPD à compléter...</p>",
      metaTitle: "RGPD",
      metaDescription: "Informations RGPD du site Staka.",
      type: PageType.PAGE,
      status: PageStatus.PUBLISHED,
      isPublic: true,
      sortOrder: 4,
    },
  ];

  for (const page of legalPages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: page,
      create: page,
    });
    console.log(`✅ Page légale seedée : ${page.title}`);
  }
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
