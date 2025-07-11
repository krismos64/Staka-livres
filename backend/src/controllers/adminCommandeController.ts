import { StatutCommande } from "@prisma/client";
import { Request, Response } from "express";
import {
  AdminCommandeService,
  CommandeFilters,
} from "../services/adminCommandeService";

/**
 * Contrôleur pour la gestion administrative des commandes
 */
export class AdminCommandeController {
  /**
   * Récupère la liste des commandes avec filtres et pagination
   */
  static async getCommandes(req: Request, res: Response): Promise<void> {
    try {
      console.log(
        `🔍 [ADMIN] ${req.user?.email} récupère la liste des commandes`
      );
      console.log(`🔍 [DEBUG] Query params reçus:`, req.query);

      // Paramètres de pagination avec validation
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(
        1,
        Math.min(100, parseInt(req.query.limit as string) || 10)
      ); // Limite max 100

      console.log(
        `🔍 [DEBUG] Pagination après parsing: page=${page}, limit=${limit}`
      );

      // Construction des filtres
      const filters: CommandeFilters = {};

      // Filtre de recherche (trim pour éviter les espaces)
      if (
        req.query.search &&
        typeof req.query.search === "string" &&
        req.query.search.trim()
      ) {
        filters.search = req.query.search.trim();
      }

      // Filtre par statut (validation de l'enum)
      if (req.query.statut && typeof req.query.statut === "string") {
        const statut = req.query.statut as StatutCommande;
        if (Object.values(StatutCommande).includes(statut)) {
          filters.statut = statut;
        } else {
          console.warn(
            `🚨 [DEBUG] Statut invalide ignoré: ${req.query.statut}`
          );
        }
      }

      // Filtre par client ID (validation UUID)
      if (
        req.query.clientId &&
        typeof req.query.clientId === "string" &&
        req.query.clientId.trim()
      ) {
        filters.clientId = req.query.clientId.trim();
      }

      // Filtres de date avec validation
      if (req.query.dateFrom && typeof req.query.dateFrom === "string") {
        const dateFrom = new Date(req.query.dateFrom);
        if (!isNaN(dateFrom.getTime())) {
          filters.dateFrom = dateFrom;
        } else {
          console.warn(
            `🚨 [DEBUG] dateFrom invalide ignorée: ${req.query.dateFrom}`
          );
        }
      }

      if (req.query.dateTo && typeof req.query.dateTo === "string") {
        const dateTo = new Date(req.query.dateTo);
        if (!isNaN(dateTo.getTime())) {
          filters.dateTo = dateTo;
        } else {
          console.warn(
            `🚨 [DEBUG] dateTo invalide ignorée: ${req.query.dateTo}`
          );
        }
      }

      console.log(`🔍 [DEBUG] Filtres après parsing:`, filters);

      // Appel du service (sans Prisma injecté, utilise l'instance par défaut)
      const result = await AdminCommandeService.getCommandes(
        page,
        limit,
        filters
      );

      console.log(
        `✅ [ADMIN] ${result.data.length} commandes récupérées depuis la DB`
      );

      res.status(200).json({
        message: "Liste des commandes récupérée avec succès",
        ...result,
        filters,
      });
    } catch (error) {
      console.error(
        "❌ [ADMIN] Erreur lors de la récupération des commandes:",
        error
      );
      res.status(500).json({
        error: "Erreur interne du serveur",
        message: "Impossible de récupérer la liste des commandes",
      });
    }
  }

  /**
   * Met à jour le statut d'une commande
   */
  static async updateCommandeStatut(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { statut } = req.body;

      if (!id) {
        res.status(400).json({
          error: "ID commande requis",
          message: "Veuillez fournir un ID de commande valide",
        });
        return;
      }

      if (!statut) {
        res.status(400).json({
          error: "Statut requis",
          message: "Veuillez fournir un statut valide",
        });
        return;
      }

      console.log(
        `🔄 [ADMIN] ${req.user?.email} met à jour la commande ${id} vers ${statut}`
      );

      // Appel du service (sans Prisma injecté, utilise l'instance par défaut)
      const updatedCommande = await AdminCommandeService.updateCommandeStatut(
        id,
        statut
      );

      console.log(`✅ [ADMIN] Commande ${id} mise à jour avec succès`);

      res.status(200).json({
        message: "Statut de la commande mis à jour avec succès",
        commande: updatedCommande,
      });
    } catch (error: any) {
      console.error("❌ [ADMIN] Erreur lors de la mise à jour:", error);

      if (error.message === "Commande non trouvée") {
        res.status(404).json({
          error: "Commande non trouvée",
          message: "La commande spécifiée n'existe pas",
        });
        return;
      }

      if (error.message.includes("Statut invalide")) {
        res.status(400).json({
          error: "Statut invalide",
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        error: "Erreur interne du serveur",
        message: "Impossible de mettre à jour la commande",
      });
    }
  }

  /**
   * Supprime une commande
   */
  static async deleteCommande(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: "ID commande requis",
          message: "Veuillez fournir un ID de commande valide",
        });
        return;
      }

      console.log(`🗑️ [ADMIN] ${req.user?.email} supprime la commande ${id}`);

      // Appel du service (sans Prisma injecté, utilise l'instance par défaut)
      await AdminCommandeService.deleteCommande(id);

      console.log(`✅ [ADMIN] Commande ${id} supprimée avec succès`);

      res.status(200).json({
        message: "Commande supprimée avec succès",
      });
    } catch (error: any) {
      console.error("❌ [ADMIN] Erreur lors de la suppression:", error);

      if (error.message === "Commande non trouvée") {
        res.status(404).json({
          error: "Commande non trouvée",
          message: "La commande spécifiée n'existe pas",
        });
        return;
      }

      res.status(500).json({
        error: "Erreur interne du serveur",
        message: "Impossible de supprimer la commande",
      });
    }
  }

  /**
   * Récupère une commande spécifique par ID avec toutes les données détaillées
   */
  static async getCommandeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          error: "ID commande requis",
          message: "Veuillez fournir un ID de commande valide",
        });
        return;
      }

      console.log(
        `🔍 [ADMIN] ${req.user?.email} récupère la commande détaillée ${id}`
      );

      const commande = await AdminCommandeService.getCommandeById(id);

      console.log(
        `✅ [ADMIN] Commande détaillée ${commande.titre} récupérée avec succès`
      );

      res.status(200).json({
        message: "Commande récupérée avec succès",
        data: commande,
      });
    } catch (error: any) {
      console.error(
        "❌ [ADMIN] Erreur lors de la récupération de la commande:",
        error
      );

      if (error.message === "Commande non trouvée") {
        res.status(404).json({
          error: "Commande introuvable",
          message: `Aucune commande trouvée avec l'ID ${req.params.id}`,
        });
      } else {
        res.status(500).json({
          error: "Erreur interne du serveur",
          message: "Impossible de récupérer la commande",
        });
      }
    }
  }
}
