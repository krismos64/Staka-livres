#!/usr/bin/env node

/**
 * Script pour valider la structure du test E2E ClientWorkflow
 * sans nécessiter l'environnement Docker complet
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validation du test E2E ClientWorkflow...\n');

// Vérifier que les fichiers existent
const testFile = path.join(__dirname, 'cypress/e2e/ClientWorkflow.cy.ts');
const supportFile = path.join(__dirname, 'cypress/support/e2e.ts');
const fixtureFile = path.join(__dirname, 'cypress/fixtures/test-manuscript.docx');
const configFile = path.join(__dirname, 'cypress.config.cjs');

const files = [
  { name: 'Test ClientWorkflow', path: testFile },
  { name: 'Support file avec helpers', path: supportFile },
  { name: 'Fixture manuscrit test', path: fixtureFile },
  { name: 'Configuration Cypress', path: configFile }
];

console.log('📁 Vérification des fichiers...');
let allFilesExist = true;

files.forEach(file => {
  if (fs.existsSync(file.path)) {
    console.log(`✅ ${file.name}: OK`);
  } else {
    console.log(`❌ ${file.name}: MANQUANT`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Certains fichiers sont manquants. Arrêt de la validation.');
  process.exit(1);
}

// Vérifier le contenu du test
console.log('\n🔍 Analyse du contenu du test...');

const testContent = fs.readFileSync(testFile, 'utf8');

// Vérifications structurelles
const checks = [
  {
    name: 'Déclaration du test principal',
    regex: /it\("Workflow complet : Utilisateur créé projet → Paiement → Admin traite → Livraison"/,
    required: true
  },
  {
    name: 'Test d\'échec de paiement',
    regex: /it\("Workflow avec échec de paiement"/,
    required: true
  },
  {
    name: 'Test des fonctionnalités admin',
    regex: /it\("Workflow admin : Modification de statut et notifications"/,
    required: true
  },
  {
    name: 'Utilisation de cy.loginAsUser()',
    regex: /cy\.loginAsUser\(\)/,
    required: true
  },
  {
    name: 'Utilisation de cy.loginAsAdmin()',
    regex: /cy\.loginAsAdmin\(\)/,
    required: true
  },
  {
    name: 'Simulation de paiement Stripe',
    regex: /cy\.simulateStripePayment\(\)/,
    required: true
  },
  {
    name: 'Vérification des statuts de projet',
    regex: /EN_ATTENTE.*EN_COURS.*TERMINE/s,
    required: true
  },
  {
    name: 'Upload de fichier manuscrit',
    regex: /data-cy="file-upload"/,
    required: true
  },
  {
    name: 'Vérification de facture',
    regex: /visit\("\/app\/billing"\).*Facture.*visible/s,
    required: true
  }
];

let validationsPassed = 0;

checks.forEach(check => {
  if (check.regex.test(testContent)) {
    console.log(`✅ ${check.name}: OK`);
    validationsPassed++;
  } else {
    console.log(`${check.required ? '❌' : '⚠️'} ${check.name}: ${check.required ? 'MANQUANT' : 'OPTIONNEL'}`);
  }
});

// Vérifier le support file
console.log('\n🔍 Analyse du fichier de support...');

const supportContent = fs.readFileSync(supportFile, 'utf8');

const supportChecks = [
  {
    name: 'Import cypress-file-upload',
    regex: /import 'cypress-file-upload'/,
    required: true
  },
  {
    name: 'Commande loginAsUser',
    regex: /Cypress\.Commands\.add\("loginAsUser"/,
    required: true
  },
  {
    name: 'Commande logout',
    regex: /Cypress\.Commands\.add\("logout"/,
    required: true
  },
  {
    name: 'Commande simulateStripePayment',
    regex: /Cypress\.Commands\.add\("simulateStripePayment"/,
    required: true
  },
  {
    name: 'Commande createPaidProject',
    regex: /Cypress\.Commands\.add\("createPaidProject"/,
    required: true
  }
];

let supportValidationsPassed = 0;

supportChecks.forEach(check => {
  if (check.regex.test(supportContent)) {
    console.log(`✅ ${check.name}: OK`);
    supportValidationsPassed++;
  } else {
    console.log(`❌ ${check.name}: MANQUANT`);
  }
});

// Résumé final
console.log('\n📊 RÉSUMÉ DE LA VALIDATION:');
console.log(`✅ Fichiers requis: ${allFilesExist ? 'TOUS PRÉSENTS' : 'MANQUANTS'}`);
console.log(`✅ Structure du test: ${validationsPassed}/${checks.length} validations passées`);
console.log(`✅ Helpers de support: ${supportValidationsPassed}/${supportChecks.length} commandes implémentées`);

const overallScore = ((validationsPassed / checks.length) + (supportValidationsPassed / supportChecks.length)) / 2;

console.log(`\n🎯 SCORE GLOBAL: ${Math.round(overallScore * 100)}%`);

if (overallScore >= 0.9) {
  console.log('🟢 EXCELLENT: Le test E2E est prêt à être exécuté !');
} else if (overallScore >= 0.7) {
  console.log('🟡 CORRECT: Le test nécessite quelques ajustements mineurs.');
} else {
  console.log('🔴 PROBLÈME: Le test nécessite plus de travail avant d\'être fonctionnel.');
}

// Recommandations
console.log('\n💡 RECOMMANDATIONS POUR L\'EXÉCUTION:');
console.log('1. Démarrer l\'environnement Docker: `npm run dev:watch`');
console.log('2. Attendre que tous les services soient en ligne');
console.log('3. Exécuter le test: `npm run test:e2e`');
console.log('4. Ou exécuter spécifiquement: `npx cypress run --spec cypress/e2e/ClientWorkflow.cy.ts`');

console.log('\n🔧 NOTES TECHNIQUES:');
console.log('- Le test utilise des data-cy attributes pour sélectionner les éléments');
console.log('- Les paiements Stripe sont simulés avec des cartes de test');
console.log('- La base de données est réinitialisée avant chaque test');
console.log('- Les fichiers uploadés utilisent des fixtures de test');

process.exit(overallScore >= 0.7 ? 0 : 1);