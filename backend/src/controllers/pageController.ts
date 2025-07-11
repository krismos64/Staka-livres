import { Request, Response } from "express";
import { PageService } from "../services/pageService";

export class PageController {
  static async getPublicPageBySlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const page = await PageService.getPublicPageBySlug(slug);
      res.status(200).json({
        success: true,
        data: page,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Page non trouvée ou non publiée"
      ) {
        res.status(404).json({
          success: false,
          message: "Page non trouvée",
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Erreur interne du serveur",
        });
      }
    }
  }
}
