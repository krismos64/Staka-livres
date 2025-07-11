import { PrismaClient, Tarif } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();

// Mode développement : si la clé Stripe n'est pas une vraie clé de test
const isDevelopmentMock =
  !process.env.STRIPE_SECRET_KEY ||
  !process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");

let stripe: Stripe | null = null;

if (!isDevelopmentMock) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-06-30.basil" as any,
  });
}

export interface TarifStripeSync {
  success: boolean;
  tarifId: string;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  action: 'created' | 'updated' | 'disabled' | 'skipped' | 'error';
  message: string;
  error?: string;
}

export class TarifStripeSyncService {
  
  /**
   * Synchronise un tarif avec Stripe
   * - Crée le produit et prix Stripe si le tarif est actif et n'a pas d'IDs Stripe
   * - Met à jour le produit Stripe si nécessaire
   * - Désactive le prix Stripe si le tarif est désactivé
   */
  static async syncTarifToStripe(tarif: Tarif): Promise<TarifStripeSync> {
    const result: TarifStripeSync = {
      success: false,
      tarifId: tarif.id,
      action: 'error',
      message: '',
    };

    try {
      // Mode mock en développement
      if (isDevelopmentMock) {
        console.log(`🚧 [STRIPE MOCK] Sync tarif: ${tarif.nom}`);
        
        if (tarif.actif && !tarif.stripeProductId) {
          // Simuler création produit/prix Stripe
          const mockProductId = `prod_mock_${Date.now()}`;
          const mockPriceId = `price_mock_${Date.now()}`;
          
          await prisma.tarif.update({
            where: { id: tarif.id },
            data: {
              stripeProductId: mockProductId,
              stripePriceId: mockPriceId,
            },
          });

          result.success = true;
          result.action = 'created';
          result.stripeProductId = mockProductId;
          result.stripePriceId = mockPriceId;
          result.message = `Mock: Produit et prix Stripe créés pour ${tarif.nom}`;
          
          console.log(`✅ [STRIPE MOCK] ${result.message}`);
          return result;
        }

        if (!tarif.actif && tarif.stripePriceId) {
          // Simuler désactivation prix Stripe
          result.success = true;
          result.action = 'disabled';
          result.message = `Mock: Prix Stripe désactivé pour ${tarif.nom}`;
          
          console.log(`⚠️ [STRIPE MOCK] ${result.message}`);
          return result;
        }

        result.success = true;
        result.action = 'skipped';
        result.message = `Mock: Aucune action nécessaire pour ${tarif.nom}`;
        return result;
      }

      if (!stripe) {
        throw new Error("Stripe non configuré");
      }

      // Tarif actif sans IDs Stripe -> Créer produit et prix
      if (tarif.actif && !tarif.stripeProductId) {
        console.log(`🔄 [STRIPE] Création produit/prix pour: ${tarif.nom}`);
        
        // Créer le produit Stripe
        const product = await stripe.products.create({
          name: tarif.nom,
          description: tarif.description,
          metadata: {
            tarifId: tarif.id,
            typeService: tarif.typeService,
          },
        });

        // Créer le prix Stripe
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: tarif.prix,
          currency: 'eur',
          metadata: {
            tarifId: tarif.id,
          },
        });

        // Sauvegarder les IDs en base
        await prisma.tarif.update({
          where: { id: tarif.id },
          data: {
            stripeProductId: product.id,
            stripePriceId: price.id,
          },
        });

        result.success = true;
        result.action = 'created';
        result.stripeProductId = product.id;
        result.stripePriceId = price.id;
        result.message = `Produit et prix Stripe créés pour ${tarif.nom}`;
        
        console.log(`✅ [STRIPE] ${result.message}`);
        return result;
      }

      // Tarif actif avec IDs Stripe -> Mettre à jour le produit si nécessaire
      if (tarif.actif && tarif.stripeProductId) {
        console.log(`🔄 [STRIPE] Mise à jour produit: ${tarif.nom}`);
        
        await stripe.products.update(tarif.stripeProductId, {
          name: tarif.nom,
          description: tarif.description,
          metadata: {
            tarifId: tarif.id,
            typeService: tarif.typeService,
            lastUpdated: new Date().toISOString(),
          },
        });

        result.success = true;
        result.action = 'updated';
        result.stripeProductId = tarif.stripeProductId;
        result.stripePriceId = tarif.stripePriceId;
        result.message = `Produit Stripe mis à jour pour ${tarif.nom}`;
        
        console.log(`✅ [STRIPE] ${result.message}`);
        return result;
      }

      // Tarif désactivé avec prix Stripe -> Marquer comme inactif
      if (!tarif.actif && tarif.stripePriceId) {
        console.log(`⚠️ [STRIPE] Désactivation prix: ${tarif.nom}`);
        
        // Note: Stripe ne permet pas de supprimer un prix, on peut seulement le marquer comme inactif
        // Pour l'instant, on archive le produit
        if (tarif.stripeProductId) {
          await stripe.products.update(tarif.stripeProductId, {
            active: false,
            metadata: {
              tarifId: tarif.id,
              deactivatedAt: new Date().toISOString(),
            },
          });
        }

        result.success = true;
        result.action = 'disabled';
        result.stripeProductId = tarif.stripeProductId;
        result.stripePriceId = tarif.stripePriceId;
        result.message = `Produit Stripe désactivé pour ${tarif.nom}`;
        
        console.log(`⚠️ [STRIPE] ${result.message}`);
        return result;
      }

      // Aucune action nécessaire
      result.success = true;
      result.action = 'skipped';
      result.message = `Aucune action Stripe nécessaire pour ${tarif.nom}`;
      
      return result;

    } catch (error) {
      console.error(`❌ [STRIPE] Erreur sync tarif ${tarif.nom}:`, error);
      
      result.success = false;
      result.action = 'error';
      result.error = error instanceof Error ? error.message : 'Erreur inconnue';
      result.message = `Erreur synchronisation Stripe pour ${tarif.nom}`;
      
      return result;
    }
  }

  /**
   * Synchronise tous les tarifs avec Stripe
   */
  static async syncAllTarifsToStripe(): Promise<{
    success: boolean;
    results: TarifStripeSync[];
    summary: {
      total: number;
      created: number;
      updated: number;
      disabled: number;
      skipped: number;
      errors: number;
    };
  }> {
    console.log('🔄 [STRIPE] Début synchronisation tous les tarifs...');
    
    try {
      const tarifs = await prisma.tarif.findMany({
        orderBy: { ordre: 'asc' },
      });

      const results: TarifStripeSync[] = [];
      const summary = {
        total: tarifs.length,
        created: 0,
        updated: 0,
        disabled: 0,
        skipped: 0,
        errors: 0,
      };

      for (const tarif of tarifs) {
        const result = await this.syncTarifToStripe(tarif);
        results.push(result);
        
        if (result.success) {
          // Incrémenter le compteur selon l'action
          switch (result.action) {
            case 'created':
              summary.created++;
              break;
            case 'updated':
              summary.updated++;
              break;
            case 'disabled':
              summary.disabled++;
              break;
            case 'skipped':
              summary.skipped++;
              break;
          }
        } else {
          summary.errors++;
        }

        // Petite pause entre les appels Stripe pour éviter le rate limiting
        if (!isDevelopmentMock) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log('✅ [STRIPE] Synchronisation terminée:', summary);
      
      return {
        success: summary.errors === 0,
        results,
        summary,
      };

    } catch (error) {
      console.error('❌ [STRIPE] Erreur synchronisation globale:', error);
      throw error;
    }
  }

  /**
   * Récupère les tarifs avec leurs informations Stripe
   */
  static async getTarifsWithStripeInfo(): Promise<{
    tarifs: (Tarif & { 
      stripeProductActive?: boolean;
      stripePriceActive?: boolean;
    })[];
    summary: {
      total: number;
      withStripeProduct: number;
      withStripePrice: number;
      activeOnly: number;
    };
  }> {
    const tarifs = await prisma.tarif.findMany({
      orderBy: { ordre: 'asc' },
    });

    const tarifsWithInfo = [];
    const summary = {
      total: tarifs.length,
      withStripeProduct: 0,
      withStripePrice: 0,
      activeOnly: tarifs.filter(t => t.actif).length,
    };

    for (const tarif of tarifs) {
      const tarifInfo: any = { ...tarif };
      
      if (tarif.stripeProductId) {
        summary.withStripeProduct++;
        
        if (!isDevelopmentMock && stripe) {
          try {
            const product = await stripe.products.retrieve(tarif.stripeProductId);
            tarifInfo.stripeProductActive = product.active;
          } catch (error) {
            console.warn(`⚠️ Produit Stripe ${tarif.stripeProductId} introuvable`);
            tarifInfo.stripeProductActive = false;
          }
        } else {
          tarifInfo.stripeProductActive = true; // Mock mode
        }
      }

      if (tarif.stripePriceId) {
        summary.withStripePrice++;
        tarifInfo.stripePriceActive = true; // Les prix Stripe ne peuvent pas être supprimés
      }

      tarifsWithInfo.push(tarifInfo);
    }

    return {
      tarifs: tarifsWithInfo,
      summary,
    };
  }
}