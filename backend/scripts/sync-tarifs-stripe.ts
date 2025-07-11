#!/usr/bin/env ts-node

/**
 * Script CLI pour synchroniser tous les tarifs avec Stripe
 * 
 * Usage:
 *   npm run stripe:sync-all
 *   ou
 *   docker exec staka_backend npx ts-node scripts/sync-tarifs-stripe.ts
 * 
 * Options:
 *   --dry-run    Affiche ce qui serait fait sans l'exécuter
 *   --verbose    Affichage détaillé
 *   --force      Force la synchronisation même en cas d'erreurs mineures
 */

import { PrismaClient } from "@prisma/client";
import { TarifStripeSyncService } from "../src/services/tarifStripeSync";

const prisma = new PrismaClient();

interface CliOptions {
  dryRun: boolean;
  verbose: boolean;
  force: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    force: args.includes('--force'),
  };
}

function printUsage() {
  console.log(`
🔄 Script de synchronisation Tarifs ↔ Stripe

Usage:
  npm run stripe:sync-all [options]
  docker exec staka_backend npx ts-node scripts/sync-tarifs-stripe.ts [options]

Options:
  --dry-run    Affiche ce qui serait fait sans l'exécuter
  --verbose    Affichage détaillé des opérations
  --force      Force la synchronisation même en cas d'erreurs mineures
  --help       Affiche cette aide

Exemples:
  npm run stripe:sync-all --dry-run
  npm run stripe:sync-all --verbose
  docker exec staka_backend npx ts-node scripts/sync-tarifs-stripe.ts --force
`);
}

async function main() {
  const options = parseArgs();

  if (process.argv.includes('--help')) {
    printUsage();
    process.exit(0);
  }

  console.log('🚀 Synchronisation Tarifs ↔ Stripe');
  console.log('=====================================');
  
  if (options.dryRun) {
    console.log('⚠️  MODE DRY-RUN: Aucune modification ne sera effectuée');
  }
  
  if (options.verbose) {
    console.log('📝 MODE VERBOSE: Affichage détaillé activé');
  }

  try {
    // 1. Récupération des tarifs actuels
    console.log('\n📊 État actuel des tarifs...');
    
    const tarifs = await prisma.tarif.findMany({
      orderBy: { ordre: 'asc' },
    });

    console.log(`📋 ${tarifs.length} tarifs trouvés en base`);
    
    if (options.verbose) {
      console.log('\nDétail des tarifs:');
      tarifs.forEach(tarif => {
        console.log(`  ${tarif.actif ? '✅' : '❌'} ${tarif.nom} (${tarif.prixFormate})`);
        console.log(`     🆔 ID: ${tarif.id}`);
        console.log(`     📦 Stripe Product: ${tarif.stripeProductId || 'NON CRÉÉ'}`);
        console.log(`     💰 Stripe Price: ${tarif.stripePriceId || 'NON CRÉÉ'}`);
        console.log('');
      });
    }

    // 2. Analyse des actions nécessaires
    console.log('\n🔍 Analyse des actions nécessaires...');
    
    const tarifsActifs = tarifs.filter(t => t.actif);
    const tarifsInactifs = tarifs.filter(t => !t.actif);
    const tarifsAvecStripe = tarifs.filter(t => t.stripeProductId);
    const tarifsSansStripe = tarifsActifs.filter(t => !t.stripeProductId);

    console.log(`  📈 Tarifs actifs: ${tarifsActifs.length}`);
    console.log(`  📉 Tarifs inactifs: ${tarifsInactifs.length}`);
    console.log(`  🔗 Tarifs avec Stripe: ${tarifsAvecStripe.length}`);
    console.log(`  ❓ Tarifs sans Stripe: ${tarifsSansStripe.length}`);

    if (options.dryRun) {
      console.log('\n🎯 Actions qui seraient effectuées:');
      
      for (const tarif of tarifsSansStripe) {
        console.log(`  ➕ CRÉER produit/prix Stripe pour: ${tarif.nom}`);
      }
      
      for (const tarif of tarifsAvecStripe) {
        if (tarif.actif) {
          console.log(`  🔄 METTRE À JOUR produit Stripe pour: ${tarif.nom}`);
        } else {
          console.log(`  ❌ DÉSACTIVER produit Stripe pour: ${tarif.nom}`);
        }
      }
      
      console.log('\n⚠️  Pour exécuter réellement ces actions, relancez sans --dry-run');
      process.exit(0);
    }

    // 3. Synchronisation réelle
    console.log('\n🔄 Début de la synchronisation...');
    
    const syncResult = await TarifStripeSyncService.syncAllTarifsToStripe();

    // 4. Affichage des résultats
    console.log('\n📊 Résultats de la synchronisation:');
    console.log(`  ✅ Total traités: ${syncResult.summary.total}`);
    console.log(`  ➕ Créés: ${syncResult.summary.created}`);
    console.log(`  🔄 Mis à jour: ${syncResult.summary.updated}`);
    console.log(`  ❌ Désactivés: ${syncResult.summary.disabled}`);
    console.log(`  ⏭️  Ignorés: ${syncResult.summary.skipped}`);
    console.log(`  💥 Erreurs: ${syncResult.summary.errors}`);

    if (options.verbose || syncResult.summary.errors > 0) {
      console.log('\n📝 Détail des opérations:');
      
      syncResult.results.forEach(result => {
        const emoji = result.success ? '✅' : '❌';
        const action = result.action.toUpperCase();
        
        console.log(`  ${emoji} [${action}] ${result.message}`);
        
        if (result.error) {
          console.log(`      ❌ Erreur: ${result.error}`);
        }
        
        if (result.stripeProductId) {
          console.log(`      📦 Product: ${result.stripeProductId}`);
        }
        
        if (result.stripePriceId) {
          console.log(`      💰 Price: ${result.stripePriceId}`);
        }
        
        console.log('');
      });
    }

    // 5. Vérification finale
    console.log('\n🎯 Vérification finale...');
    
    const statusAfter = await TarifStripeSyncService.getTarifsWithStripeInfo();
    
    console.log(`  📊 Tarifs avec produit Stripe: ${statusAfter.summary.withStripeProduct}/${statusAfter.summary.total}`);
    console.log(`  💰 Tarifs avec prix Stripe: ${statusAfter.summary.withStripePrice}/${statusAfter.summary.total}`);
    console.log(`  ✅ Tarifs actifs: ${statusAfter.summary.activeOnly}/${statusAfter.summary.total}`);

    // 6. Conclusion
    if (syncResult.success) {
      console.log('\n🎉 Synchronisation terminée avec succès !');
      process.exit(0);
    } else {
      console.log('\n⚠️  Synchronisation terminée avec des erreurs');
      
      if (!options.force) {
        console.log('💡 Utilisez --force pour ignorer les erreurs non critiques');
        process.exit(1);
      } else {
        console.log('🔥 Mode --force: Erreurs ignorées');
        process.exit(0);
      }
    }

  } catch (error) {
    console.error('\n💥 Erreur fatale lors de la synchronisation:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Gestion propre des signaux d'interruption
process.on('SIGINT', async () => {
  console.log('\n⏸️  Interruption détectée, arrêt en cours...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Signal de terminaison reçu, arrêt en cours...');
  await prisma.$disconnect();
  process.exit(0);
});

// Point d'entrée
if (require.main === module) {
  main().catch(async (error) => {
    console.error('💥 Erreur fatale:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
}