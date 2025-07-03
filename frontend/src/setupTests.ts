import "@testing-library/jest-dom";

// Configuration globale pour les tests unitaires Jest
(global as any).API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://backend:3001";

// Configuration de l'environnement de test
delete (window as any).location;
(window as any).location = {
  href: "http://localhost:3000",
  origin: "http://localhost:3000",
  pathname: "/",
  search: "",
  hash: "",
};

// Mock pour localStorage
const localStorageMock = {
  getItem: jest.fn((key: string) => {
    if (key === "auth_token") {
      return "mock-jwt-token"; // Token de test valide
    }
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Configuration pour les tests
beforeEach(() => {
  // Reset localStorage mock
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();

  // S'assurer qu'il y a un token pour les tests
  localStorageMock.getItem.mockImplementation((key: string) => {
    if (key === "auth_token") {
      return "mock-jwt-token";
    }
    return null;
  });
});

// Helper pour attendre que l'API soit disponible
export const waitForAPI = async (maxRetries = 5): Promise<boolean> => {
  const testApiUrl = "http://backend:3001"; // URL correcte pour Docker

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${testApiUrl}/health`);
      if (response.ok) {
        console.log(`✅ API backend accessible sur ${testApiUrl}`);
        return true;
      }
    } catch (error) {
      console.log(
        `🔄 Tentative ${i + 1}/${maxRetries} - API pas encore disponible`
      );
    }

    // Attendre 2 secondes avant de réessayer
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.warn("⚠️ API backend not available for tests");
  return false;
};

// Helper pour nettoyer les données de test
export const cleanupTestData = async () => {
  // Ici on pourrait ajouter des appels pour nettoyer les données de test
  // Pour l'instant, on fait confiance au système de nettoyage du backend
};

console.log(
  `🧪 Tests Jest configurés avec API_BASE_URL: ${(global as any).API_BASE_URL}`
);
