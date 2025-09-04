#!/bin/bash

echo "=== Test d'envoi d'email en production ==="
echo "Ce script va vérifier la configuration des emails sur le serveur de production"
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier si on est sur le VPS ou en local
echo -e "${YELLOW}1. Vérification de l'environnement...${NC}"
if [ -f "/.dockerenv" ]; then
    echo -e "${GREEN}✓ Exécution dans Docker${NC}"
else
    echo -e "${YELLOW}⚠ Exécution hors Docker - connexion au conteneur backend${NC}"
fi

# Créer un script de test Node.js temporaire
cat > /tmp/test-email.js << 'EOF'
const { Resend } = require('resend');

console.log('\n=== Configuration Email ===');
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'Non défini');
console.log('SUPPORT_EMAIL:', process.env.SUPPORT_EMAIL || 'Non défini');
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'Non défini');
console.log('FROM_NAME:', process.env.FROM_NAME || 'Non défini');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? '***' + process.env.RESEND_API_KEY.slice(-4) : 'Non défini');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Non défini');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Non défini');

if (!process.env.RESEND_API_KEY) {
    console.error('\n❌ RESEND_API_KEY non configurée !');
    process.exit(1);
}

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
    const testData = {
        from: `${process.env.FROM_NAME || 'Staka Livres'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: process.env.ADMIN_EMAIL || 'contact@staka.fr',
        subject: '[TEST] Configuration email Staka - ' + new Date().toLocaleString('fr-FR'),
        html: `
            <h2>Test de configuration email</h2>
            <p>Ce message est un test automatique de la configuration email.</p>
            <ul>
                <li><strong>Environnement:</strong> ${process.env.NODE_ENV}</li>
                <li><strong>Date/Heure:</strong> ${new Date().toLocaleString('fr-FR')}</li>
                <li><strong>FROM_EMAIL:</strong> ${process.env.FROM_EMAIL}</li>
                <li><strong>ADMIN_EMAIL:</strong> ${process.env.ADMIN_EMAIL}</li>
            </ul>
            <p>Si vous recevez ce message, la configuration email fonctionne correctement.</p>
        `
    };

    console.log('\n=== Tentative d\'envoi ===');
    console.log('De:', testData.from);
    console.log('À:', testData.to);
    console.log('Sujet:', testData.subject);

    try {
        const { data, error } = await resend.emails.send(testData);
        
        if (error) {
            console.error('\n❌ Erreur Resend:', error);
            return false;
        }
        
        console.log('\n✅ Email envoyé avec succès !');
        console.log('ID Resend:', data?.id);
        return true;
    } catch (error) {
        console.error('\n❌ Erreur lors de l\'envoi:', error.message);
        if (error.response) {
            console.error('Détails:', error.response.data);
        }
        return false;
    }
}

// Test de l'API Resend
async function testResendAPI() {
    console.log('\n=== Test de l\'API Resend ===');
    
    try {
        // Tester si la clé API est valide
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: 'delivered@resend.dev', // Adresse de test Resend
            subject: 'API Test',
            html: '<p>Test</p>'
        });
        
        if (error) {
            console.error('❌ La clé API Resend semble invalide:', error);
            return false;
        }
        
        console.log('✅ La clé API Resend est valide');
        return true;
    } catch (error) {
        console.error('❌ Erreur API:', error.message);
        return false;
    }
}

async function main() {
    // Tester d'abord l'API
    const apiValid = await testResendAPI();
    
    if (!apiValid) {
        console.log('\n⚠️  La clé API doit être vérifiée/remplacée');
    }
    
    // Tenter l'envoi réel
    const sent = await testEmail();
    
    if (sent) {
        console.log('\n✅ Test terminé avec succès - Vérifiez la boîte mail:', process.env.ADMIN_EMAIL || 'contact@staka.fr');
    } else {
        console.log('\n❌ Le test a échoué - Vérifiez la configuration');
        console.log('\nSuggestions:');
        console.log('1. Vérifier que la clé RESEND_API_KEY est valide');
        console.log('2. Pour la production, utiliser un domaine vérifié (pas onboarding@resend.dev)');
        console.log('3. Vérifier les limites de quota Resend');
    }
}

main().catch(console.error);
EOF

echo -e "${YELLOW}2. Exécution du test d'email...${NC}"

# Exécuter le test dans le conteneur backend
if [ -f "/.dockerenv" ]; then
    # Si on est déjà dans Docker
    cd /app && node /tmp/test-email.js
else
    # Si on est sur le host, exécuter dans le conteneur
    docker exec -it staka_backend_prod sh -c "cd /app && node /tmp/test-email.js"
fi

# Nettoyer
rm -f /tmp/test-email.js

echo ""
echo -e "${GREEN}=== Vérification des logs du conteneur ===${NC}"
echo "Derniers logs d'email du backend:"
docker logs staka_backend_prod 2>&1 | grep -i "mailer\|email\|resend" | tail -20

echo ""
echo -e "${YELLOW}=== Recommandations ===${NC}"
echo "1. Si les emails ne sont pas reçus:"
echo "   - Vérifier le spam de contact@staka.fr"
echo "   - Configurer un domaine vérifié dans Resend (pas onboarding@resend.dev)"
echo "   - Obtenir une clé API Resend de production"
echo ""
echo "2. Pour configurer un domaine personnalisé:"
echo "   - Aller sur https://resend.com/domains"
echo "   - Ajouter 'livrestaka.fr' ou 'staka.fr'"
echo "   - Configurer les enregistrements DNS"
echo "   - Mettre à jour FROM_EMAIL dans .env.prod"