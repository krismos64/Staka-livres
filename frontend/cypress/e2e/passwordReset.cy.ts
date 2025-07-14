/**
 * Tests E2E pour le flux de réinitialisation de mot de passe
 * Conforme aux exigences RGPD/CNIL
 */

describe('Password Reset Flow', () => {
  beforeEach(() => {
    // Visiter la page de connexion
    cy.visit('/login');
  });

  describe('Forgot Password Page', () => {
    it('should navigate to forgot password page from login', () => {
      cy.contains('Mot de passe oublié ?').click();
      cy.url().should('include', '/forgot-password');
      cy.contains('Mot de passe oublié').should('be.visible');
      cy.contains('Réinitialiser votre mot de passe').should('be.visible');
    });

    it('should display form elements correctly', () => {
      cy.visit('/forgot-password');
      
      // Vérifier les éléments du formulaire
      cy.get('input[type="email"]').should('be.visible');
      cy.get('label[for="email"]').should('contain', 'Adresse email');
      cy.get('button[type="submit"]').should('contain', 'Envoyer le lien de réinitialisation');
      
      // Vérifier les icônes
      cy.get('i.fa-envelope').should('be.visible');
      cy.get('i.fa-paper-plane').should('be.visible');
      
      // Vérifier le lien retour
      cy.contains('Retour à la connexion').should('be.visible');
    });

    it('should validate email format', () => {
      cy.visit('/forgot-password');
      
      // Tenter de soumettre sans email
      cy.get('button[type="submit"]').click();
      
      // Vérifier que le navigateur valide l'email requis
      cy.get('input[type="email"]').then($input => {
        expect($input[0].validity.valid).to.be.false;
      });
    });

    it('should show loading state when submitting', () => {
      cy.visit('/forgot-password');
      
      // Intercepter la requête API
      cy.intercept('POST', '/api/auth/request-password-reset', {
        delay: 1000,
        statusCode: 200,
        body: { message: 'Email envoyé' }
      }).as('requestReset');
      
      // Remplir et soumettre le formulaire
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Vérifier l'état de chargement
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('button[type="submit"]').should('contain', 'Envoi en cours...');
      cy.get('i.fa-spinner').should('be.visible');
    });

    it('should show success message after successful submission', () => {
      cy.visit('/forgot-password');
      
      // Intercepter la requête API
      cy.intercept('POST', '/api/auth/request-password-reset', {
        statusCode: 200,
        body: { message: 'Un lien de réinitialisation vous a été envoyé par email' }
      }).as('requestReset');
      
      // Remplir et soumettre le formulaire
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();
      
      // Attendre la réponse
      cy.wait('@requestReset');
      
      // Vérifier la page de succès
      cy.contains('Vérifiez vos emails').should('be.visible');
      cy.contains('Un lien de réinitialisation a été envoyé').should('be.visible');
      cy.get('i.fa-check').should('be.visible');
      cy.contains('Le lien n\'est valable que pendant 1 heure').should('be.visible');
    });

    it('should handle API errors gracefully', () => {
      cy.visit('/forgot-password');
      
      // Intercepter la requête API avec erreur
      cy.intercept('POST', '/api/auth/request-password-reset', {
        statusCode: 400,
        body: { error: 'Format d\'email invalide' }
      }).as('requestResetError');
      
      // Remplir et soumettre le formulaire
      cy.get('input[type="email"]').type('invalid@email');
      cy.get('button[type="submit"]').click();
      
      // Attendre la réponse
      cy.wait('@requestResetError');
      
      // Vérifier le message d'erreur
      cy.contains('Format d\'email invalide').should('be.visible');
      cy.get('i.fa-exclamation-circle').should('be.visible');
    });

    it('should navigate back to login page', () => {
      cy.visit('/forgot-password');
      
      cy.contains('Retour à la connexion').click();
      cy.url().should('include', '/login');
    });

    it('should display security information', () => {
      cy.visit('/forgot-password');
      
      // Vérifier les informations de sécurité
      cy.contains('Informations importantes').should('be.visible');
      cy.contains('Le lien de réinitialisation est valable pendant 1 heure').should('be.visible');
      cy.contains('Vous ne pouvez utiliser le lien qu\'une seule fois').should('be.visible');
      cy.contains('Seuls 5 demandes par heure sont autorisées').should('be.visible');
    });
  });

  describe('Reset Password Page', () => {
    const validToken = 'valid-token-12345';
    const invalidToken = 'invalid-token';

    it('should display form elements correctly', () => {
      cy.visit(`/reset-password?token=${validToken}`);
      
      // Vérifier les éléments du formulaire
      cy.get('input[name="newPassword"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
      cy.get('button[type="submit"]').should('contain', 'Réinitialiser le mot de passe');
      
      // Vérifier les indicateurs de validation
      cy.contains('Critères de sécurité').should('be.visible');
      cy.contains('Au moins 12 caractères OU 8 caractères avec complexité').should('be.visible');
      cy.contains('3 types parmi : majuscules, minuscules, chiffres, symboles').should('be.visible');
      cy.contains('Les mots de passe correspondent').should('be.visible');
    });

    it('should toggle password visibility', () => {
      cy.visit(`/reset-password?token=${validToken}`);
      
      // Vérifier que le mot de passe est masqué par défaut
      cy.get('input[name="newPassword"]').should('have.attr', 'type', 'password');
      
      // Cliquer sur l'icône pour afficher
      cy.get('input[name="newPassword"]').parent().find('button').click();
      cy.get('input[name="newPassword"]').should('have.attr', 'type', 'text');
      
      // Cliquer à nouveau pour masquer
      cy.get('input[name="newPassword"]').parent().find('button').click();
      cy.get('input[name="newPassword"]').should('have.attr', 'type', 'password');
    });

    it('should validate password complexity in real-time', () => {
      cy.visit(`/reset-password?token=${validToken}`);
      
      // Taper un mot de passe faible
      cy.get('input[name="newPassword"]').type('weak');
      
      // Vérifier que les critères sont en rouge
      cy.contains('Au moins 12 caractères').parent().should('have.class', 'text-gray-500');
      cy.contains('3 types parmi').parent().should('have.class', 'text-gray-500');
      
      // Taper un mot de passe fort
      cy.get('input[name="newPassword"]').clear().type('StrongPassword123!');
      
      // Vérifier que les critères sont en vert
      cy.contains('Au moins 12 caractères').parent().should('have.class', 'text-green-600');
      cy.contains('3 types parmi').parent().should('have.class', 'text-green-600');
    });

    it('should validate password confirmation', () => {
      cy.visit(`/reset-password?token=${validToken}`);
      
      // Taper des mots de passe différents
      cy.get('input[name="newPassword"]').type('StrongPassword123!');
      cy.get('input[name="confirmPassword"]').type('DifferentPassword123!');
      
      // Vérifier que le critère de correspondance est en rouge
      cy.contains('Les mots de passe correspondent').parent().should('have.class', 'text-gray-500');
      
      // Corriger le mot de passe de confirmation
      cy.get('input[name="confirmPassword"]').clear().type('StrongPassword123!');
      
      // Vérifier que le critère est maintenant en vert
      cy.contains('Les mots de passe correspondent').parent().should('have.class', 'text-green-600');
    });

    it('should enable submit button only when validation passes', () => {
      cy.visit(`/reset-password?token=${validToken}`);
      
      // Le bouton doit être désactivé initialement
      cy.get('button[type="submit"]').should('be.disabled');
      
      // Remplir avec un mot de passe valide
      cy.get('input[name="newPassword"]').type('StrongPassword123!');
      cy.get('input[name="confirmPassword"]').type('StrongPassword123!');
      
      // Le bouton doit être activé
      cy.get('button[type="submit"]').should('not.be.disabled');
    });

    it('should successfully reset password', () => {
      cy.visit(`/reset-password?token=${validToken}`);
      
      // Intercepter la requête API
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: { message: 'Mot de passe réinitialisé avec succès' }
      }).as('resetPassword');
      
      // Remplir le formulaire
      cy.get('input[name="newPassword"]').type('StrongPassword123!');
      cy.get('input[name="confirmPassword"]').type('StrongPassword123!');
      cy.get('button[type="submit"]').click();
      
      // Attendre la réponse
      cy.wait('@resetPassword');
      
      // Vérifier la page de succès
      cy.contains('Mot de passe réinitialisé').should('be.visible');
      cy.contains('Votre mot de passe a été réinitialisé avec succès').should('be.visible');
      cy.get('button').should('contain', 'Se connecter');
    });

    it('should handle invalid token', () => {
      cy.visit(`/reset-password?token=${invalidToken}`);
      
      // Intercepter la requête API avec erreur
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 400,
        body: { error: 'Token invalide ou expiré' }
      }).as('resetPasswordError');
      
      // Remplir et soumettre le formulaire
      cy.get('input[name="newPassword"]').type('StrongPassword123!');
      cy.get('input[name="confirmPassword"]').type('StrongPassword123!');
      cy.get('button[type="submit"]').click();
      
      // Attendre la réponse
      cy.wait('@resetPasswordError');
      
      // Vérifier le message d'erreur
      cy.contains('Token invalide ou expiré').should('be.visible');
    });

    it('should redirect to login when no token provided', () => {
      cy.visit('/reset-password');
      cy.url().should('include', '/login');
    });

    it('should navigate back to login page', () => {
      cy.visit(`/reset-password?token=${validToken}`);
      
      cy.contains('Retour à la connexion').click();
      cy.url().should('include', '/login');
    });
  });

  describe('Complete Password Reset Flow', () => {
    it('should complete the full password reset flow', () => {
      // Étape 1: Aller à la page de connexion
      cy.visit('/login');
      
      // Étape 2: Cliquer sur "Mot de passe oublié"
      cy.contains('Mot de passe oublié ?').click();
      cy.url().should('include', '/forgot-password');
      
      // Étape 3: Soumettre la demande de réinitialisation
      cy.intercept('POST', '/api/auth/request-password-reset', {
        statusCode: 200,
        body: { message: 'Email envoyé' }
      }).as('requestReset');
      
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();
      cy.wait('@requestReset');
      
      // Étape 4: Vérifier la page de succès
      cy.contains('Vérifiez vos emails').should('be.visible');
      
      // Étape 5: Simuler le clic sur le lien dans l'email
      const token = 'valid-token-12345';
      cy.visit(`/reset-password?token=${token}`);
      
      // Étape 6: Réinitialiser le mot de passe
      cy.intercept('POST', '/api/auth/reset-password', {
        statusCode: 200,
        body: { message: 'Mot de passe réinitialisé avec succès' }
      }).as('resetPassword');
      
      cy.get('input[name="newPassword"]').type('NewStrongPassword123!');
      cy.get('input[name="confirmPassword"]').type('NewStrongPassword123!');
      cy.get('button[type="submit"]').click();
      cy.wait('@resetPassword');
      
      // Étape 7: Vérifier la page de succès final
      cy.contains('Mot de passe réinitialisé').should('be.visible');
      
      // Étape 8: Retourner à la page de connexion
      cy.get('button').contains('Se connecter').click();
      cy.url().should('include', '/login');
    });
  });

  describe('Security Features', () => {
    it('should display security warnings', () => {
      cy.visit('/forgot-password');
      
      // Vérifier les avertissements de sécurité
      cy.contains('Le lien de réinitialisation est valable pendant 1 heure').should('be.visible');
      cy.contains('Vous ne pouvez utiliser le lien qu\'une seule fois').should('be.visible');
      cy.contains('Seuls 5 demandes par heure sont autorisées').should('be.visible');
    });

    it('should show password strength requirements', () => {
      cy.visit(`/reset-password?token=valid-token`);
      
      // Vérifier les exigences de sécurité
      cy.contains('Critères de sécurité').should('be.visible');
      cy.contains('Au moins 12 caractères OU 8 caractères avec complexité').should('be.visible');
      cy.contains('3 types parmi : majuscules, minuscules, chiffres, caractères spéciaux').should('be.visible');
    });

    it('should handle rate limiting gracefully', () => {
      cy.visit('/forgot-password');
      
      // Intercepter avec erreur de rate limiting
      cy.intercept('POST', '/api/auth/request-password-reset', {
        statusCode: 429,
        body: { 
          error: 'Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.',
          retryAfter: 3600
        }
      }).as('rateLimitError');
      
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('button[type="submit"]').click();
      cy.wait('@rateLimitError');
      
      // Vérifier le message d'erreur de rate limiting
      cy.contains('Trop de demandes de réinitialisation').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      cy.visit('/forgot-password');
      
      // Vérifier les labels
      cy.get('label[for="email"]').should('exist');
      cy.get('input[type="email"]').should('have.attr', 'id', 'email');
      
      // Vérifier les rôles des boutons
      cy.get('button[type="submit"]').should('have.attr', 'type', 'submit');
    });

    it('should support keyboard navigation', () => {
      cy.visit('/forgot-password');
      
      // Tester la navigation au clavier
      cy.get('input[type="email"]').focus().should('be.focused');
      cy.get('input[type="email"]').tab();
      cy.get('button[type="submit"]').should('be.focused');
    });
  });
});