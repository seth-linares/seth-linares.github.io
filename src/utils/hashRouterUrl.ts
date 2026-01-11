// src/utils/hashRouterUrl.ts

export function parseHashParams(hash: string): URLSearchParams {
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;

    const questionIndex = cleanHash.indexOf('?');

    // No parameters found
    if (questionIndex === -1) {
        return new URLSearchParams();
    }

    const paramsString = cleanHash.slice(questionIndex + 1);

    const params = new URLSearchParams(paramsString);
    const decodedParams = new URLSearchParams();

    for (const [key, value] of params.entries()) {
        try {
            decodedParams.set(key, decodeURIComponent(value));
        } catch (error) {
            console.warn(`Failed to decode URL parameter ${key}:`, error);
            decodedParams.set(key, value);
        }
    }

    return decodedParams;
}

export function getHashRoute(hash: string): string {
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;

    const questionIndex = cleanHash.indexOf('?');

    const route = questionIndex === -1 ? cleanHash : cleanHash.slice(0, questionIndex);

    return route.startsWith('/') ? route : `/${route}`;
}

export function updateHashParams(params: URLSearchParams, route?: string): void {
    if (typeof window === 'undefined') return;

    const currentRoute = route || getHashRoute(window.location.hash);

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
    const newHash = paramString ? `#${currentRoute}?${paramString}` : `#${currentRoute}`;

    if (window.location.hash !== newHash) {
        window.history.replaceState(null, '', newHash);
    }
}

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
