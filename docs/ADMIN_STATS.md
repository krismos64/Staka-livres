# 📊 Guide API Admin Stats - Statistiques Mensuelles

## Vue d'ensemble

L'endpoint `/admin/stats` fournit des **statistiques mensuelles pour les 12 derniers mois glissants**, incluant le chiffre d'affaires réel basé sur les factures payées, le nombre de nouveaux utilisateurs et le nombre de commandes.

## Endpoint Principal

### GET /api/admin/stats

**Description :** Retourne les statistiques mensuelles pour les 12 derniers mois glissants

**Authentification :** Requise (Admin uniquement)

**Méthode :** GET

**URL :** `/api/admin/stats`

**Headers requis :**
```http
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

## Réponse de l'API

### Structure de réponse

```json
{
  "months": ["2024-08", "2024-09", "2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07"],
  "revenue": [1234.56, 2156.78, 3456.90, 2890.45, 4567.23, 3421.67, 2987.34, 4123.89, 3675.12, 4892.56, 5234.78, 4567.89],
  "newUsers": [32, 45, 67, 54, 78, 89, 65, 92, 76, 103, 87, 95],
  "orders": [54, 67, 89, 76, 98, 112, 85, 134, 97, 156, 123, 145]
}
```

### Champs de réponse

#### `months` (Array<string>)
- **Description :** Tableau de 12 mois au format ISO `YYYY-MM`
- **Exemple :** `["2024-08", "2024-09", ..., "2025-07"]`
- **Ordre :** Chronologique, du plus ancien au plus récent
- **Calcul :** Derniers 12 mois glissants à partir de la date actuelle

#### `revenue` (Array<number>)
- **Description :** Chiffre d'affaires mensuel en euros (basé sur `Invoice.status = 'PAID'`)
- **Exemple :** `[1234.56, 2156.78, ...]`
- **Source :** Somme des montants des factures payées (`Invoice.amount`)
- **Devise :** EUR (euros)
- **Précision :** 2 décimales

#### `newUsers` (Array<number>)
- **Description :** Nombre de nouveaux utilisateurs inscrits par mois
- **Exemple :** `[32, 45, ...]`
- **Source :** Comptage des `User.createdAt` groupés par mois
- **Type :** Entiers positifs

#### `orders` (Array<number>)
- **Description :** Nombre total de commandes créées par mois
- **Exemple :** `[54, 67, ...]`
- **Source :** Comptage des `Order.id` groupés par mois
- **Type :** Entiers positifs

## Exemples d'utilisation

### Exemple cURL

```bash
curl -X GET "http://localhost:3001/api/admin/stats" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -H "Content-Type: application/json"
```

### Exemple avec fetch (JavaScript)

```javascript
const response = await fetch('/api/admin/stats', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const statsData = await response.json();
console.log('Derniers 12 mois:', statsData.months);
console.log('CA mensuel:', statsData.revenue);
```

### Exemple avec Axios

```javascript
import axios from 'axios';

const getAdminStats = async () => {
  try {
    const response = await axios.get('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    throw error;
  }
};
```

## Gestion d'erreurs

### Codes de statut HTTP

| Code | Description | Réponse |
|------|-------------|---------|
| `200` | Succès | Données des statistiques |
| `401` | Non authentifié | `{"error": "Token manquant ou invalide"}` |
| `403` | Non autorisé | `{"error": "Accès refusé - Admin requis"}` |
| `500` | Erreur serveur | `{"error": "Internal server error"}` |

### Exemple de réponse d'erreur

```json
{
  "error": "Accès refusé - Admin requis",
  "code": 403
}
```

## Performance et optimisations

### Benchmarks de performance

- **Temps de réponse moyen :** < 300ms
- **Dataset testé :** 10,000+ factures et commandes
- **Optimisations :** Requêtes Prisma groupées avec index sur `createdAt`

### Cache et invalidation

L'endpoint utilise les optimisations suivantes :
- Requêtes Prisma optimisées avec `groupBy()`
- Index sur les colonnes `createdAt` pour performance
- Pas de cache côté serveur (données temps réel)

## Détails techniques

### Logique de calcul des mois

```javascript
// Calcul de la période des 12 derniers mois
const endDate = new Date();
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 11);
startDate.setDate(1);
startDate.setHours(0, 0, 0, 0);
```

### Requêtes Prisma

#### Chiffre d'affaires (Revenue)
```javascript
const revenueData = await prisma.invoice.groupBy({
  by: ['createdAt'],
  where: {
    status: 'PAID',
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  },
  _sum: {
    amount: true,
  },
});
```

#### Nouveaux utilisateurs
```javascript
const usersData = await prisma.user.groupBy({
  by: ['createdAt'],
  where: {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  },
  _count: {
    id: true,
  },
});
```

#### Commandes
```javascript
const ordersData = await prisma.order.groupBy({
  by: ['createdAt'],
  where: {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  },
  _count: {
    id: true,
  },
});
```

### Gestion des mois sans données

L'API garantit **toujours 12 entrées** dans chaque tableau. Pour les mois sans données :
- `revenue[i] = 0`
- `newUsers[i] = 0` 
- `orders[i] = 0`

### Format des mois

Les mois sont formatés selon la norme **ISO 8601** :
- Format : `YYYY-MM`
- Exemple : `"2025-07"` pour juillet 2025
- Tri : Chronologique (du plus ancien au plus récent)

## Tests et validation

### Tests d'intégration inclus

L'endpoint dispose de tests complets couvrant :
- ✅ Authentification admin requise (403 pour utilisateurs normaux)
- ✅ Retour de 12 mois exacts
- ✅ Format ISO YYYY-MM des mois
- ✅ Gestion des mois sans données (valeurs à 0)
- ✅ Performance < 300ms avec grandes données
- ✅ Calcul correct du CA basé sur factures payées

### Exemple de test

```javascript
describe('GET /api/admin/stats', () => {
  it('should return monthly stats for admin users', async () => {
    const response = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    
    const { months, revenue, newUsers, orders } = response.body;
    
    expect(months).toHaveLength(12);
    expect(revenue).toHaveLength(12);
    expect(newUsers).toHaveLength(12);
    expect(orders).toHaveLength(12);
    
    months.forEach(month => {
      expect(month).toMatch(/^\d{4}-\d{2}$/);
    });
  });
});
```

## Sécurité

### Contrôles d'accès

- **Authentification JWT** : Token valide requis
- **Autorisation RBAC** : Rôle `ADMIN` obligatoire
- **Middleware de sécurité** : `requireRole(Role.ADMIN)`

### Audit trail

Toutes les requêtes vers cet endpoint sont automatiquement auditées avec :
- Utilisateur admin qui a fait la requête
- Timestamp de l'accès
- Adresse IP
- User agent

## Intégration frontend

### Hook React Query recommandé

```typescript
import { useQuery } from '@tanstack/react-query';

interface MonthlyStats {
  months: string[];
  revenue: number[];
  newUsers: number[];
  orders: number[];
}

export const useAdminStats = () => {
  return useQuery<MonthlyStats>({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }
      
      return response.json();
    },
    staleTime: 30 * 1000, // 30 secondes
    refetchInterval: 60 * 1000, // Refresh toutes les minutes
  });
};
```

### Usage dans un composant

```typescript
const AdminStatsPage = () => {
  const { data: stats, isLoading, error } = useAdminStats();

  if (isLoading) return <div>Chargement des statistiques...</div>;
  if (error) return <div>Erreur lors du chargement</div>;

  return (
    <div>
      <h1>Statistiques des 12 derniers mois</h1>
      
      {stats?.months.map((month, index) => (
        <div key={month}>
          <h3>{month}</h3>
          <p>CA: {stats.revenue[index]}€</p>
          <p>Nouveaux clients: {stats.newUsers[index]}</p>
          <p>Commandes: {stats.orders[index]}</p>
        </div>
      ))}
    </div>
  );
};
```

## Migration et évolutions

### Évolutions prévues

- **Granularité hebdomadaire** : Possibilité d'obtenir des stats par semaine
- **Filtres personnalisés** : Période custom avec paramètres `?from=` et `?to=`
- **Métriques supplémentaires** : Taux de conversion, panier moyen, etc.
- **Export CSV/Excel** : Téléchargement des données pour analyse

### Rétrocompatibilité

L'API est conçue pour maintenir la rétrocompatibilité :
- Les champs actuels ne seront jamais supprimés
- Les nouveaux champs seront optionnels
- Le format des dates restera ISO 8601

---

**📝 Note :** Cette documentation est mise à jour automatiquement. Pour toute question technique, consulter le code source dans `backend/src/routes/admin/stats.ts` et `backend/src/services/adminStatsService.ts`.