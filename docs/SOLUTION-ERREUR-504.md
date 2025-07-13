# 🔧 Solution : Erreur 504 "Outdated Optimize Dep" - ✅ MISE À JOUR JUILLET 2025

## 🚨 Problème rencontré

```
Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)
[vite] connected.
```

**Page blanche** lors de l'accès à http://localhost:3002/billing ou autres pages React Query

## 🔍 Cause du problème - MISE À JOUR 2025

L'erreur "504 Outdated Optimize Dep" se produit quand :

1. **Vite cache obsolète** : Les dépendances optimisées en cache ne correspondent plus aux packages installés
2. **Nouvelle dépendance** : `@tanstack/react-query@5.81.5` (NON plus react-query v3)
3. **Migration TanStack** : Application migrée vers @tanstack/react-query v5 (moderne)
4. **Redémarrage Docker** : Après `docker-compose down/up`, le cache peut être corrompu

## ✅ Solution appliquée et validée

### 1. Nettoyage du cache Vite

```bash
# Supprimer le cache Vite dans le conteneur
docker exec -it staka_frontend rm -rf /app/node_modules/.vite /app/dist

# Alternative si conteneurs arrêtés
docker-compose down
docker volume prune -f  # ATTENTION: supprime tous les volumes non utilisés
```

### 2. Configuration Vite optimisée (DÉJÀ EN PLACE)

```typescript
// frontend/vite.config.ts - ✅ MISE À JOUR 2025
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["@tanstack/react-query"], // TanStack React Query v5.81.5
    // ATTENTION: force: true n'est PLUS dans la config actuelle
  },
  // ... reste de la config
});
```

### 3. Redémarrage du conteneur

```bash
# Redémarrage simple
docker restart staka_frontend

# Ou rebuild complet si problème persiste
docker-compose down
docker-compose up --build -d
```

## 🎯 Résultat

```
Forced re-optimization of dependencies
VITE v6.3.5  ready in 165 ms
Local:   http://localhost:5173/ (dev) ou http://localhost:3002/ (prod)
```

✅ **Application accessible** sur http://localhost:3002 (production Docker)  
✅ **Page de facturation** fonctionne sur http://localhost:3002/billing  
✅ **@tanstack/react-query v5.81.5** correctement optimisé par Vite  
✅ **Hooks useInvoices, useMessages, useAdminMessages** fonctionnels

## 🆕 Pages confirmées fonctionnelles (2025)

- ✅ `/billing` - Page facturation avec `useInvoices()`
- ✅ `/messages` - Messagerie avec `useMessages()` et `useInfiniteQuery`
- ✅ `/admin/messagerie` - Admin messagerie avec `useAdminMessages()`
- ✅ `/admin/utilisateurs` - Gestion users avec `useAdminUsers()`
- ✅ `/admin/commandes` - Gestion commandes avec `useAdminCommandes()`

## 🔮 Prévention future

### Configuration permanente - ✅ DÉJÀ APPLIQUÉE

La configuration `optimizeDeps` dans `vite.config.ts` prévient ce problème :

```typescript
optimizeDeps: {
  include: ["@tanstack/react-query"],  // TanStack React Query v5.81.5
  // force: true // RETIRÉ de la config actuelle
}
```

### Commandes de dépannage actualisées

Si le problème se reproduit :

```bash
# 1. Vérifier que Docker est démarré
docker --version
docker-compose --version

# 2. Nettoyer le cache Vite (si conteneurs actifs)
docker exec -it staka_frontend rm -rf /app/node_modules/.vite

# 3. Redémarrer le conteneur frontend
docker restart staka_frontend

# 4. Rebuild complet si nécessaire
docker-compose down
docker-compose up --build -d

# 5. Vérifier les logs
docker logs staka_frontend --tail 20
```

### Bonnes pratiques actualisées

1. **Toujours inclure les nouvelles dépendances** dans `optimizeDeps.include`
2. **Nettoyer le cache** après installation de packages ou mise à jour
3. **Utiliser `force: true`** en développement pour éviter les caches obsolètes
4. **Redémarrer les conteneurs** après modification de `vite.config.ts`
5. **Vérifier Docker** avant de déboguer (daemon en cours d'exécution)

## 🧪 Test de validation actualisé

```bash
# Vérifier Docker daemon
docker ps | grep staka

# Test application React Query complète
curl -s "http://localhost:3002/billing" | grep -i "facturation\|billing"
curl -s "http://localhost:3002/admin/messagerie" | grep -i "messagerie\|admin"

# Test API backend (avec auth)
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3001/invoices"
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" "http://localhost:3001/admin/conversations"
```

## 📊 État technique actuel (Juillet 2025)

- **Vite** : v6.3.5 (dernière version stable)
- **React Query** : @tanstack/react-query v5.81.5 (migration TanStack complétée)
- **Configuration** : Optimisée et validée en production
- **Docker** : Frontend port 3002, Backend port 3001
- **Pages React Query** : 5+ pages testées et fonctionnelles

**Status :** ✅ **RÉSOLU ET VALIDÉ** - L'application React Query fonctionne parfaitement

### 🔧 Troubleshooting avancé

Si l'erreur persiste après toutes les étapes :

```bash
# Diagnostic complet
echo "=== DIAGNOSTIC ERREUR 504 ==="
echo "1. Version Vite:"
docker exec -it staka_frontend npm list vite
echo "2. Cache Vite:"
docker exec -it staka_frontend ls -la /app/node_modules/.vite/
echo "3. Package React Query:"
docker exec -it staka_frontend npm list react-query
echo "4. Processus Node:"
docker exec -it staka_frontend ps aux | grep node
```

**Résolution ultime** :

```bash
# Reset complet du frontend
docker-compose down
docker rmi staka-livres_frontend
docker-compose up --build -d
```
