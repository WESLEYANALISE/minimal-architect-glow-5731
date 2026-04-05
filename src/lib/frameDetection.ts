/**
 * Detects if the app is running inside an iframe.
 * Used to adjust auth flows and SW behavior.
 */
export const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin blocks access → assume iframe
  }
})();

/**
 * Detects if running on a Lovable preview host.
 */
export const isPreviewHost =
  typeof window !== 'undefined' &&
  (window.location.hostname.includes('id-preview--') ||
   window.location.hostname.includes('lovableproject.com'));
