// PortOne Configuration
// Update these values with your actual PortOne credentials

export interface PortOneConfig {
  storeId: string
  apiKey: string
  apiSecret: string
  baseUrl: string
  webhookEndpoint?: string
}

// Mock configuration for development/testing
// Replace these with actual values when ready for production
const MOCK_CONFIG: PortOneConfig = {
  storeId: 'imp00000000',  // Mock Store ID - replace with actual
  apiKey: 'mock_api_key_replace_with_actual',  // Mock API Key - replace with actual  
  apiSecret: 'mock_api_secret_replace_with_actual',  // Mock API Secret - replace with actual
  baseUrl: 'https://api.iamport.kr',  // Production URL
  webhookEndpoint: '/api/portone/webhook'  // Webhook endpoint for payment notifications
}

// Production configuration - update these values
const PRODUCTION_CONFIG: PortOneConfig = {
  storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID || MOCK_CONFIG.storeId,
  apiKey: process.env.PORTONE_API_KEY || MOCK_CONFIG.apiKey,
  apiSecret: process.env.PORTONE_API_SECRET || MOCK_CONFIG.apiSecret,
  baseUrl: process.env.PORTONE_BASE_URL || MOCK_CONFIG.baseUrl,
  webhookEndpoint: process.env.PORTONE_WEBHOOK_ENDPOINT || MOCK_CONFIG.webhookEndpoint
}

// Export the configuration based on environment
export const portOneConfig: PortOneConfig = 
  process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_PORTONE_STORE_ID 
    ? PRODUCTION_CONFIG 
    : MOCK_CONFIG

// Validation function to check if configuration is ready for production
export const isProductionReady = (): boolean => {
  return (
    portOneConfig.storeId !== MOCK_CONFIG.storeId &&
    portOneConfig.apiKey !== MOCK_CONFIG.apiKey &&
    portOneConfig.apiSecret !== MOCK_CONFIG.apiSecret &&
    !portOneConfig.storeId.includes('mock') &&
    !portOneConfig.apiKey.includes('mock') &&
    !portOneConfig.apiSecret.includes('mock')
  )
}

// Helper function to get sanitized config for client-side logging
export const getClientSafeConfig = () => ({
  storeId: portOneConfig.storeId,
  baseUrl: portOneConfig.baseUrl,
  webhookEndpoint: portOneConfig.webhookEndpoint,
  isProductionReady: isProductionReady(),
  isMockMode: !isProductionReady()
})

export default portOneConfig