/**
 * Previously loaded MercadoPago + PagBank SDKs.
 * All payments now go through Asaas Edge Functions — these SDKs are no longer needed.
 * Hook kept as no-op to avoid breaking imports during cleanup.
 */
export function usePaymentSDK() {
  // No-op: SDKs removed for performance and iframe compatibility
}
