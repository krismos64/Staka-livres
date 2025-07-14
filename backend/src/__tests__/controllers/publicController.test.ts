import { Request, Response } from "express";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { sendContactMessage } from "../../controllers/publicController";
import { MailerService } from "../../utils/mailer";

// Mock MailerService
vi.mock("../../utils/mailer");
const mockMailerService = vi.mocked(MailerService);

// Helper to create mock request and response
const createMockReq = (body: any = {}): Partial<Request> => ({
  body,
});

const createMockRes = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("PublicController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock des variables d'environnement
    process.env.SUPPORT_EMAIL = "support@test.com";
  });

  describe("sendContactMessage", () => {
    test("devrait envoyer un email de contact avec succès", async () => {
      const req = createMockReq({
        nom: "John Doe",
        email: "john@example.com",
        sujet: "Test Contact",
        message: "Ceci est un message de test"
      }) as Request;

      const res = createMockRes() as Response;

      // Mock successful email sending
      mockMailerService.sendEmail.mockResolvedValue();

      await sendContactMessage(req, res);

      // Vérifier que l'email a été envoyé
      expect(mockMailerService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "support@test.com",
          subject: "Contact site – Test Contact",
          html: expect.stringContaining("John Doe"),
          text: expect.stringContaining("John Doe"),
        })
      );

      // Vérifier la réponse
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Votre message a bien été envoyé à notre équipe. Nous vous répondrons sous 24h."
      });
    });

    test("devrait valider les champs requis", async () => {
      const req = createMockReq({
        nom: "",
        email: "john@example.com",
        sujet: "",
        message: "Test"
      }) as Request;

      const res = createMockRes() as Response;

      await sendContactMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Tous les champs sont requis",
        details: "Nom, email, sujet et message sont obligatoires"
      });

      // L'email ne devrait pas être envoyé
      expect(mockMailerService.sendEmail).not.toHaveBeenCalled();
    });

    test("devrait valider le format email", async () => {
      const req = createMockReq({
        nom: "John Doe",
        email: "email-invalide",
        sujet: "Test",
        message: "Test message"
      }) as Request;

      const res = createMockRes() as Response;

      await sendContactMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Format d'email invalide",
        details: "Veuillez saisir une adresse email valide"
      });

      // L'email ne devrait pas être envoyé
      expect(mockMailerService.sendEmail).not.toHaveBeenCalled();
    });

    test("devrait valider la longueur des champs", async () => {
      const req = createMockReq({
        nom: "x".repeat(101), // Trop long
        email: "john@example.com",
        sujet: "Test",
        message: "Test message"
      }) as Request;

      const res = createMockRes() as Response;

      await sendContactMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Nom trop long",
        details: "Le nom ne peut pas dépasser 100 caractères"
      });
    });

    test("devrait gérer les erreurs d'envoi d'email", async () => {
      const req = createMockReq({
        nom: "John Doe",
        email: "john@example.com",
        sujet: "Test Contact",
        message: "Ceci est un message de test"
      }) as Request;

      const res = createMockRes() as Response;

      // Mock email failure
      mockMailerService.sendEmail.mockRejectedValue(new Error("Email service down"));

      await sendContactMessage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Erreur lors de l'envoi du message",
        message: "Une erreur technique est survenue. Veuillez réessayer ou nous contacter directement."
      });
    });

    test("devrait nettoyer les données d'entrée", async () => {
      const req = createMockReq({
        nom: "  John Doe  ",
        email: "  john@example.com  ", // Minuscules pour éviter les problèmes de validation
        sujet: "  Test Contact  ",
        message: "  Ceci est un message de test  "
      }) as Request;

      const res = createMockRes() as Response;
      
      // Reset the mock pour ce test
      mockMailerService.sendEmail.mockClear();
      mockMailerService.sendEmail.mockResolvedValue();

      await sendContactMessage(req, res);

      // Vérifier la réponse de succès
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Votre message a bien été envoyé à notre équipe. Nous vous répondrons sous 24h."
      });
    });
  });
});