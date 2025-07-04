import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tarifsDeTest = [
  {
    nom: "Correction Standard",
    description:
      "Correction orthographique, grammaticale et typographique de votre manuscrit",
    prix: 200, // 2€ en centimes
    prixFormate: "2€",
    typeService: "Correction",
    dureeEstimee: "7-10 jours",
    actif: true,
    ordre: 1,
  },
  {
    nom: "Correction Express",
    description: "Correction rapide en 3-5 jours pour les manuscrits urgents",
    prix: 300, // 3€ en centimes
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
    prix: 35000, // 350€ en centimes
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
    prix: 250, // 2.5€ en centimes
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
    prix: 145000, // 1450€ en centimes
    prixFormate: "1450€",
    typeService: "Rédaction",
    dureeEstimee: "3-6 semaines",
    actif: true,
    ordre: 5,
  },
  {
    nom: "Traduction Français-Anglais",
    description: "Traduction professionnelle de votre manuscrit vers l'anglais",
    prix: 120, // 1.2€ en centimes
    prixFormate: "1,20€",
    typeService: "Traduction",
    dureeEstimee: "2-3 semaines",
    actif: false, // Inactif pour tester les filtres
    ordre: 6,
  },
];

async function seedTarifs() {
  console.log("🌱 Ajout des tarifs de test...");

  try {
    // Vérifier si des tarifs existent déjà
    const existingTarifs = await prisma.tarif.count();

    if (existingTarifs > 0) {
      console.log(`⚠️  ${existingTarifs} tarifs existent déjà. Suppression...`);
      await prisma.tarif.deleteMany();
    }

    // Ajouter les nouveaux tarifs
    for (const tarifData of tarifsDeTest) {
      const tarif = await prisma.tarif.create({
        data: tarifData,
      });
      console.log(`✅ Tarif créé: ${tarif.nom} (${tarif.prixFormate})`);
    }

    console.log(`🎉 ${tarifsDeTest.length} tarifs ajoutés avec succès !`);
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des tarifs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedTarifs();
}

export { seedTarifs };
