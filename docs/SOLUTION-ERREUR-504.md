# 🔧 Solution : Erreur 504 "Outdated Optimize Dep"

## 🚨 Problème rencontré

```
Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)
[vite] connected.
```

**Page blanche** lors de l'accès à http://localhost:3000/billing

## 🔍 Cause du problème

L'erreur "504 Outdated Optimize Dep" se produit quand :

1. **Vite cache obsolète** : Les dépendances optimisées en cache ne correspondent plus aux packages installés
2. **Nouvelle dépendance** : `react-query@3.39.3` ajoutée mais pas dans le cache Vite
3. **Confusion de versions** : Vite cherchait `@tanstack/react-query` (v4+) au lieu de `react-query` (v3)

## ✅ Solution appliquée

### 1. Nettoyage du cache Vite

```bash
docker exec -it staka_frontend rm -rf /app/node_modules/.vite /app/dist
```

### 2. Configuration Vite optimisée

```typescript
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["react-query"], // Force l'inclusion de react-query
    force: true, // Force la re-optimisation
  },
  // ... reste de la config
});
```

### 3. Redémarrage du conteneur

```bash
docker restart staka_frontend
```

## 🎯 Résultat

```
Forced re-optimization of dependencies
VITE v5.4.19  ready in 165 ms
```

✅ **Application accessible** sur http://localhost:3000  
✅ **Page de facturation** fonctionne sur http://localhost:3000/billing  
✅ **React Query** correctement optimisé par Vite

## 🔮 Prévention future

### Configuration permanente

La configuration `optimizeDeps` dans `vite.config.ts` prévient ce problème :

```typescript
optimizeDeps: {
  include: ["react-query"],  // Toujours optimiser react-query
  force: true,               // Force la re-optimisation au démarrage
}
```

### Commandes de dépannage

Si le problème se reproduit :

```bash
# 1. Nettoyer le cache Vite
docker exec -it staka_frontend rm -rf /app/node_modules/.vite

# 2. Redémarrer le conteneur
docker restart staka_frontend

# 3. Vérifier les logs
docker logs staka_frontend --tail 10
```

### Bonnes pratiques

1. **Toujours inclure les nouvelles dépendances** dans `optimizeDeps.include`
2. **Nettoyer le cache** après installation de packages
3. **Utiliser `force: true`** en développement pour éviter les caches obsolètes
4. **Redémarrer les conteneurs** après modification de `vite.config.ts`

## 🧪 Test de validation

```bash
# Vérifier que l'application fonctionne
curl -s http://localhost:3000 | head -5

# Vérifier la page de facturation
curl -s http://localhost:3000/billing | head -5
```

**Status :** ✅ **RÉSOLU** - L'application React Query fonctionne parfaitement
