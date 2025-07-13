import app from "./app";
import { CONFIG } from "./config/config";

const PORT = CONFIG.SERVER.PORT;

// Démarrage du serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Serveur backend démarré sur http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || "development"}`);
});

// Export pour les tests
export default app;
