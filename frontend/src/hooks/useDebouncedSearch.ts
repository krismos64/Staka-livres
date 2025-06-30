import { useCallback, useEffect, useState } from "react";

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
  initialValue?: string;
}

interface UseDebouncedSearchReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (value: string) => void;
  isSearching: boolean;
  clearSearch: () => void;
}

/**
 * Hook pour gérer la recherche avec debounce
 * @param delay - Délai de debounce en ms (défaut: 300ms)
 * @param minLength - Longueur minimale pour déclencher la recherche (défaut: 0)
 * @param initialValue - Valeur initiale
 */
export const useDebouncedSearch = ({
  delay = 300,
  minLength = 0,
  initialValue = "",
}: UseDebouncedSearchOptions = {}): UseDebouncedSearchReturn => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Si le terme de recherche est trop court, on vide immédiatement
    if (searchTerm.length < minLength) {
      setDebouncedSearchTerm("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm, delay, minLength]);

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setIsSearching(false);
  }, []);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
    isSearching,
    clearSearch,
  };
};
