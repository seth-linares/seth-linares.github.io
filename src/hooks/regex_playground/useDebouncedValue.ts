// src/hooks/regex_playground/useDebouncedValue.ts
import { useEffect, useState } from "react";

/**
 * useDebouncedValue
 * Returns a debounced copy of the provided value after the given delay.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
