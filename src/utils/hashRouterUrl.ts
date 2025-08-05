// src/utils/hashRouterUrl.ts

/**
 * Utility functions for handling URL parameters with HashRouter
 * Solves the issue where URL parameters would replace the route path
 */

/**
 * Parses parameters from a hash route like /#/regex-playground?pattern=test&flags=g
 * @param hash - The hash string from window.location.hash
 * @returns URLSearchParams object with decoded parameters
 */
export function parseHashParams(hash: string): URLSearchParams {
  // Remove leading # if present
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  
  // Find the question mark separating route from parameters
  const questionIndex = cleanHash.indexOf('?');
  
  // No parameters found
  if (questionIndex === -1) {
    return new URLSearchParams();
  }
  
  // Extract the parameters string after the ?
  const paramsString = cleanHash.slice(questionIndex + 1);
  
  // Create URLSearchParams and decode all parameter values
  const params = new URLSearchParams(paramsString);
  const decodedParams = new URLSearchParams();
  
  // Decode each parameter value to handle special regex characters
  for (const [key, value] of params.entries()) {
    try {
      decodedParams.set(key, decodeURIComponent(value));
    } catch (error) {
      // If decoding fails, use the original value
      console.warn(`Failed to decode URL parameter ${key}:`, error);
      decodedParams.set(key, value);
    }
  }
  
  return decodedParams;
}

/**
 * Gets the route path from hash (e.g., /regex-playground from /#/regex-playground?params)
 * @param hash - The hash string from window.location.hash
 * @returns The route path without parameters
 */
export function getHashRoute(hash: string): string {
  // Remove leading # if present
  const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
  
  // Find the question mark separating route from parameters
  const questionIndex = cleanHash.indexOf('?');
  
  // Return the route part (everything before the ?)
  const route = questionIndex === -1 ? cleanHash : cleanHash.slice(0, questionIndex);
  
  // Ensure route starts with / for consistency
  return route.startsWith('/') ? route : `/${route}`;
}

/**
 * Updates hash parameters while preserving the route path
 * @param params - URLSearchParams object with parameters to set
 * @param route - Optional route to use (defaults to current route)
 */
export function updateHashParams(params: URLSearchParams, route?: string): void {
  if (typeof window === 'undefined') return;
  
  // Get current route if not provided
  const currentRoute = route || getHashRoute(window.location.hash);
  
  // Encode parameter values to handle special regex characters
  const encodedParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    try {
      encodedParams.set(key, encodeURIComponent(value));
    } catch (error) {
      // If encoding fails, use the original value
      console.warn(`Failed to encode URL parameter ${key}:`, error);
      encodedParams.set(key, value);
    }
  }
  
  // Build the new hash with route + parameters
  const paramString = encodedParams.toString();
  const newHash = paramString ? `#${currentRoute}?${paramString}` : `#${currentRoute}`;
  
  // Only update if the hash has actually changed
  if (window.location.hash !== newHash) {
    window.history.replaceState(null, '', newHash);
  }
}

/**
 * Creates a shareable URL for the current state
 * @param params - URLSearchParams object with parameters to include
 * @param route - Optional route to use (defaults to current route)
 * @returns Complete URL that can be shared
 */
export function createShareableUrl(params: URLSearchParams, route?: string): string {
  if (typeof window === 'undefined') return '';
  
  const currentRoute = route || getHashRoute(window.location.hash);
  
  // Encode parameter values
  const encodedParams = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    try {
      encodedParams.set(key, encodeURIComponent(value));
    } catch (error) {
      console.warn(`Failed to encode URL parameter ${key}:`, error);
      encodedParams.set(key, value);
    }
  }
  
  const paramString = encodedParams.toString();
  const hash = paramString ? `#${currentRoute}?${paramString}` : `#${currentRoute}`;
  
  return `${window.location.origin}${window.location.pathname}${hash}`;
}