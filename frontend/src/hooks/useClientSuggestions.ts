import { useState, useRef, useEffect } from "react";
import { useClientSuggestions as useClientSuggestionsData } from "./useClients";

export interface UseClientSuggestionsReturn {
  /** Whether suggestions are visible */
  showSuggestions: boolean;
  /** Show suggestions dropdown */
  showSuggestionsDropdown: () => void;
  /** Hide suggestions dropdown */
  hideSuggestionsDropdown: () => void;
  /** Client suggestions data */
  suggestions: ReturnType<typeof useClientSuggestionsData>;
  /** Ref for input element */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Ref for suggestions container */
  suggestionsRef: React.RefObject<HTMLDivElement | null>;
  /** Handle client selection */
  handleClientSelect: (
    clientName: string,
    callback?: (clientName: string) => void,
  ) => void;
}

/**
 * Reusable hook for managing client suggestions dropdown behavior
 */
export function useClientSuggestions(
  searchQuery: string,
): UseClientSuggestionsReturn {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const suggestions = useClientSuggestionsData(searchQuery);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showSuggestionsDropdown = () => {
    if (searchQuery.length > 0) {
      setShowSuggestions(true);
    }
  };

  const hideSuggestionsDropdown = () => {
    setShowSuggestions(false);
  };

  const handleClientSelect = (
    clientName: string,
    callback?: (clientName: string) => void,
  ) => {
    if (callback) {
      callback(clientName);
    }
    setShowSuggestions(false);
  };

  return {
    showSuggestions,
    showSuggestionsDropdown,
    hideSuggestionsDropdown,
    suggestions,
    inputRef,
    suggestionsRef,
    handleClientSelect,
  };
}

export default useClientSuggestions;
