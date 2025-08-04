import { PageStatus, PageType, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Suppression de toutes les entités sauf Tarifs et FAQ...");

  // Suppression transactionnelle dans l'ordre des dépendances
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.message.deleteMany(),
    prisma.file.deleteMany(),
    prisma.paymentMethod.deleteMany(),
    // prisma.passwordReset.deleteMany(), // Temporairement commenté
    prisma.supportRequest.deleteMany(),
    prisma.commande.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("✅ Toutes les entités supprimées (Tarifs et FAQ conservés).");

  // Hash des mots de passe
  const adminPassword = await bcrypt.hash("@Staka2020@", 10);
  const userPassword = await bcrypt.hash("Usertes123@", 10);

  console.log("🔑 Création de l'administrateur...");
  const admin = await prisma.user.create({
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
  const user = await prisma.user.create({
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

  // Nettoyage des anciens tarifs pour n'en garder que 3
  console.log("🧹 Nettoyage des anciens tarifs...");
  await prisma.tarif.deleteMany();

  console.log("💰 Ajout des 3 tarifs spécifiés...");

  // 1. Pack KDP
  await prisma.tarif.create({
    data: {
      nom: "Pack KDP",
      description: "Idéal pour débuter",
      prix: 35000, // 350€
      prixFormate: "350€",
      typeService: "Pack",
      dureeEstimee: "5-7 jours",
      actif: true,
      ordre: 1,
      stripeProductId: null,
      stripePriceId: null,
    },
  });

  // 2. Correction Standard
  await prisma.tarif.create({
    data: {
      nom: "Pack Intégral",
      description: "Solution complète",
      prix: 200, // 2€
      prixFormate: "2€/page",
      typeService: "Correction",
      dureeEstimee: "10-15 jours",
      actif: true,
      ordre: 2,
      stripeProductId: null,
      stripePriceId: null,
    },
  });

  // 3. Pack Rédaction Complète
  await prisma.tarif.create({
    data: {
      nom: "Pack Rédaction",
      description: "Coaching complet",
      prix: 145000, // 1450€
      prixFormate: "1450€",
      typeService: "Rédaction",
      dureeEstimee: "3-6 semaines",
      actif: true,
      ordre: 3,
      stripeProductId: null,
      stripePriceId: null,
    },
  });

  console.log("✅ 3 tarifs créés avec succès !");

  // Création des FAQ
  console.log("❓ Création des FAQ de démonstration...");

  // Nettoyage des anciennes FAQ
  await prisma.fAQ.deleteMany();

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
      question: "Comment fonctionne la tarification du Pack Standard ?",
      answer:
        "Le Pack Standard inclut 10 pages gratuites, puis 2€ par page de la page 11 à 300, et 1€ par page au-delà de 300 pages. Le calcul est automatique selon le nombre de pages de votre manuscrit.",
      details:
        "Exemple : Manuscrit de 250 pages = 10 pages gratuites + 240 pages × 2€ = 480€",
      categorie: "Tarifs",
      ordre: 3,
      visible: true,
    },
    {
      question: "Quels sont les moyens de paiement acceptés ?",
      answer:
        "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via notre plateforme sécurisée Stripe. Le paiement est demandé à la validation de votre commande.",
      details:
        "Paiement 100% sécurisé • Facturation automatique • Garantie remboursement si non satisfait",
      categorie: "Paiement",
      ordre: 4,
      visible: true,
    },
    {
      question: "Proposez-vous un échantillon gratuit ?",
      answer:
        "Oui ! Nous proposons la correction gratuite des 5 premières pages de votre manuscrit pour que vous puissiez évaluer la qualité de notre travail avant de commander.",
      details:
        "Service gratuit • Sans engagement • Délai 24h • Parfait pour tester notre approche",
      categorie: "Échantillon",
      ordre: 5,
      visible: true,
    },
    {
      question: "Comment suivre l'avancement de ma commande ?",
      answer:
        "Vous disposez d'un espace client personnalisé où vous pouvez suivre l'état de votre commande, échanger avec nos correcteurs et télécharger vos fichiers corrigés.",
      details:
        "Notifications par email • Messagerie intégrée • Historique complet • Téléchargements illimités",
      categorie: "Suivi",
      ordre: 6,
      visible: true,
    },
    {
      question: "Que comprend exactement le Pack KDP ?",
      answer:
        "Le Pack KDP comprend la correction complète, la mise en page professionnelle, la création de la couverture et l'optimisation pour la publication sur Amazon KDP.",
      details:
        "Correction orthographique et stylistique • Mise en page professionnelle • Couverture personnalisée • Format prêt pour KDP • Guide de publication",
      categorie: "Packs",
      ordre: 7,
      visible: true,
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

  // Pages légales (identiques au seed-prod)
  console.log("📄 Création des pages légales...");

  await prisma.page.deleteMany();

  const pagesLegales = [
    {
      title: "Mentions légales",
      slug: "mentions-legales",
      content: "Contenu des mentions légales...",
      type: PageType.LEGAL,
      status: PageStatus.PUBLISHED,
    },
    {
      title: "Politique de confidentialité",
      slug: "politique-confidentialite",
      content: "Contenu de la politique de confidentialité...",
      type: PageType.LEGAL,
      status: PageStatus.PUBLISHED,
    },
    {
      title: "Conditions Générales de Vente",
      slug: "cgv",
      content: "Contenu des conditions générales de vente...",
      type: PageType.LEGAL,
      status: PageStatus.PUBLISHED,
    },
    {
      title: "RGPD",
      slug: "rgpd",
      content: "Informations RGPD...",
      type: PageType.LEGAL,
      status: PageStatus.PUBLISHED,
    },
  ];

  for (const page of pagesLegales) {
    await prisma.page.create({
      data: page,
    });
    console.log(`✅ Page légale seedée : ${page.title}`);
  }

  console.log("🌱 Seed synchronisé avec succès !");
  console.log(`👤 2 utilisateurs créés (admin + user test)`);
  console.log(
    `💰 3 tarifs créés (Pack KDP, Correction Standard, Pack Rédaction)`
  );
  console.log(`❓ ${faqData.length} FAQ créées`);
  console.log(`📄 ${pagesLegales.length} pages légales créées`);
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
