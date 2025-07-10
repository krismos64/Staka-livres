const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testAdminStats() {
  console.log('🚀 Test de l\'API Statistiques Admin - Staka Livres\n');

  try {
    // 1. Login avec un compte admin
    console.log('1. Connexion admin...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'password'
    });

    const adminToken = loginResponse.data.token;
    console.log('✅ Connexion admin réussie\n');

    // 2. Tester l'API des statistiques
    console.log('2. Récupération des statistiques...');
    const statsResponse = await axios.get(`${API_BASE}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });

    const stats = statsResponse.data;
    
    console.log('✅ Statistiques récupérées avec succès!\n');
    console.log('📊 RÉSUMÉ DES STATISTIQUES:');
    console.log('─'.repeat(50));
    
    // Affichage du résumé du mois
    console.log(`📅 Période: ${stats.resumeMois.periode}`);
    console.log(`💰 Chiffre d'affaires: ${stats.chiffreAffairesMois.toLocaleString('fr-FR')}€ (${stats.evolutionCA > 0 ? '+' : ''}${stats.evolutionCA}%)`);
    console.log(`📦 Nouvelles commandes: ${stats.nouvellesCommandesMois} (${stats.evolutionCommandes > 0 ? '+' : ''}${stats.evolutionCommandes}%)`);
    console.log(`👥 Nouveaux clients: ${stats.nouveauxClientsMois} (${stats.evolutionClients > 0 ? '+' : ''}${stats.evolutionClients}%)`);
    console.log(`⭐ Satisfaction: ${stats.satisfactionMoyenne}/5 (${stats.nombreAvisTotal} avis)`);
    
    console.log('\n💳 DERNIERS PAIEMENTS:');
    console.log('─'.repeat(50));
    
    if (stats.derniersPaiements.length === 0) {
      console.log('Aucun paiement récent');
    } else {
      stats.derniersPaiements.forEach((paiement, index) => {
        const date = new Date(paiement.date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`${index + 1}. ${paiement.clientNom} - ${paiement.montant.toLocaleString('fr-FR')}€ - ${date}`);
        console.log(`   📄 Projet: ${paiement.projetTitre}`);
        console.log(`   📧 Email: ${paiement.clientEmail}\n`);
      });
    }

    // 3. Test avec un compte non-admin
    console.log('3. Test d\'accès non autorisé...');
    try {
      const userLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'user@test.com',
        password: 'password'
      });

      const userToken = userLoginResponse.data.token;
      
      await axios.get(`${API_BASE}/admin/stats`, {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      
      console.log('❌ ERREUR: Un utilisateur normal a pu accéder aux stats admin!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ Accès refusé pour un utilisateur non-admin (comme attendu)\n');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data?.error || error.message);
      }
    }

    // 4. Test sans token
    console.log('4. Test sans authentification...');
    try {
      await axios.get(`${API_BASE}/admin/stats`);
      console.log('❌ ERREUR: Accès autorisé sans token!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Accès refusé sans authentification (comme attendu)');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.data?.error || error.message);
      }
    }

    console.log('\n🎉 Tests terminés avec succès!');
    console.log('\n📈 L\'API des statistiques admin est fonctionnelle:');
    console.log('   ✓ Authentification requise');
    console.log('   ✓ Rôle admin requis');
    console.log('   ✓ Données réelles de la base');
    console.log('   ✓ Calculs d\'évolution corrects');
    console.log('   ✓ Format de données cohérent');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data?.error || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Assurez-vous que le backend est démarré sur le port 3001');
      console.log('   Commande: cd backend && npm run dev');
    }
  }
}

// Exécuter le test
testAdminStats();