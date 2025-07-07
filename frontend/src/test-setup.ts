import "@testing-library/jest-dom";
import { vi } from "vitest";

// Configuration globale pour les tests unitaires Vitest
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
  getItem: vi.fn((key: string) => {
    if (key === "auth_token") {
      return "mock-jwt-token"; // Token de test valide
    }
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock pour sessionStorage
Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
});

// Mock pour IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, "IntersectionObserver", {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock pour ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock pour matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock pour fetch global
global.fetch = vi.fn();
