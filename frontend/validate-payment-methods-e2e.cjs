#!/usr/bin/env node

/**
 * Script de validation des tests E2E pour les moyens de paiement
 * Vérifie que tous les éléments sont en place avant de lancer les tests complets
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validation des tests E2E - Moyens de paiement\n');

// 1. Vérifier que les fichiers de composants existent
const componentsToCheck = [
  'src/components/billing/PaymentMethodsCard.tsx',
  'src/components/modals/AddPaymentMethodModal.tsx',
  'src/hooks/usePaymentMethods.ts',
  'src/pages/BillingPage.tsx'
];

console.log('📂 Vérification des composants...');
let allComponentsExist = true;

componentsToCheck.forEach(component => {
  const filePath = path.join(__dirname, component);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${component}`);
  } else {
    console.log(`❌ ${component} - MANQUANT`);
    allComponentsExist = false;
  }
});

// 2. Vérifier que les data-cy attributes sont présents
console.log('\n🏷️  Vérification des attributs data-cy...');
const dataCyAttributes = [
  'add-payment-method-btn',
  'payment-methods-list', 
  'add-payment-modal',
  'card-number-input',
  'card-expiry-input',
  'card-cvc-input',
  'card-name-input',
  'add-card-submit-btn',
  'cancel-btn',
  'close-modal-btn'
];

let allAttributesFound = true;

dataCyAttributes.forEach(attr => {
  // Vérifier dans les fichiers de composants
  let found = false;
  componentsToCheck.forEach(component => {
    const filePath = path.join(__dirname, component);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(`data-cy="${attr}"`)) {
        found = true;
      }
    }
  });
  
  if (found) {
    console.log(`✅ data-cy="${attr}"`);
  } else {
    console.log(`❌ data-cy="${attr}" - NON TROUVÉ`);
    allAttributesFound = false;
  }
});

// 3. Vérifier les fichiers de test
console.log('\n📋 Vérification des fichiers de test...');
const testFiles = [
  'cypress/e2e/PaymentMethods.cy.ts',
  'cypress/e2e/PaymentMethodsBasic.cy.ts',
  'cypress/support/e2e.ts'
];

let allTestFilesExist = true;
testFiles.forEach(testFile => {
  const filePath = path.join(__dirname, testFile);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${testFile}`);
  } else {
    console.log(`❌ ${testFile} - MANQUANT`);
    allTestFilesExist = false;
  }
});

// 4. Résumé final
console.log('\n📊 RÉSUMÉ DE LA VALIDATION\n');

if (allComponentsExist) {
  console.log('✅ Tous les composants sont présents');
} else {
  console.log('❌ Des composants sont manquants');
}

if (allAttributesFound) {
  console.log('✅ Tous les attributs data-cy sont présents');
} else {
  console.log('❌ Des attributs data-cy sont manquants');
}

if (allTestFilesExist) {
  console.log('✅ Tous les fichiers de test sont présents');
} else {
  console.log('❌ Des fichiers de test sont manquants');
}

const overallSuccess = allComponentsExist && allAttributesFound && allTestFilesExist;

if (overallSuccess) {
  console.log('\n🎉 VALIDATION RÉUSSIE ! Les tests E2E peuvent être lancés.\n');
  console.log('📝 Commandes suggérées :');
  console.log('   npm run test:e2e:open  # Mode interactif pour debugging');
  console.log('   npm run test:e2e -- --spec cypress/e2e/PaymentMethodsBasic.cy.ts  # Test de base');
  process.exit(0);
} else {
  console.log('\n⚠️  VALIDATION ÉCHOUÉE ! Corriger les problèmes avant de lancer les tests.\n');
  process.exit(1);
}