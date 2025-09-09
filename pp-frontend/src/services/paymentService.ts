// frontend/src/services/paymentService.ts
import axios from 'axios'
import { portOneConfig, isProductionReady, getClientSafeConfig } from '@/config/portone.config'
import type {
  CreatePaymentSessionRequest,
  PaymentSession,
  PreparePaymentResponse,
  PaymentResult,
  PaymentHistoryItem,
  ApiResponse
} from '@/types/payment'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

class PaymentService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    timeout: 30000,
  })

  constructor() {
    // Add auth interceptor
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('access_token')
          window.location.href = '/auth/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Payment Session Management
  async createPaymentSession(request: CreatePaymentSessionRequest): Promise<PaymentSession> {
    try {
      // Check if PortOne is configured for production
      if (!isProductionReady()) {
        console.warn('PortOne is running in mock mode. Update configuration for production.', getClientSafeConfig())
      }

      const response = await this.api.post<ApiResponse<PaymentSession>>('/payments/sessions', request)
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to create payment session')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Failed to create payment session:', error)
      throw error
    }
  }

  async getPaymentSession(sessionId: string): Promise<PaymentSession> {
    try {
      const response = await this.api.get<ApiResponse<PaymentSession>>(`/payments/sessions/${sessionId}`)
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get payment session')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Failed to get payment session:', error)
      throw error
    }
  }

  async preparePayment(sessionId: string): Promise<PreparePaymentResponse> {
    try {
      const response = await this.api.post<ApiResponse<PreparePaymentResponse>>(
        `/payments/sessions/${sessionId}/prepare`
      )
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to prepare payment')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Failed to prepare payment:', error)
      throw error
    }
  }

  async verifyPayment(impUID: string): Promise<PaymentResult> {
    try {
      const response = await this.api.post<ApiResponse<PaymentResult>>('/payments/verify', {
        imp_uid: impUID
      })
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to verify payment')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Failed to verify payment:', error)
      throw error
    }
  }

  async cancelPayment(paymentId: string, reason: string): Promise<any> {
    try {
      const response = await this.api.post<ApiResponse>(`/payments/${paymentId}/cancel`, {
        reason
      })
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to cancel payment')
      }
      
      return response.data.data
    } catch (error) {
      console.error('Failed to cancel payment:', error)
      throw error
    }
  }

  async getPaymentHistory(limit = 20, offset = 0): Promise<PaymentHistoryItem[]> {
    try {
      const response = await this.api.get<ApiResponse<PaymentHistoryItem[]>>('/me/payments', {
        params: { limit, offset }
      })
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get payment history')
      }
      
      return response.data.data || []
    } catch (error) {
      console.error('Failed to get payment history:', error)
      throw error
    }
  }

  // Item Management
  async getItems(): Promise<any[]> {
    try {
      const response = await this.api.get<ApiResponse<any[]>>('/items')
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get items')
      }
      
      return response.data.data || []
    } catch (error) {
      console.error('Failed to get items:', error)
      throw error
    }
  }

  async getItem(itemId: string): Promise<any> {
    try {
      const response = await this.api.get<ApiResponse<any>>(`/items/${itemId}`)
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get item')
      }
      
      return response.data.data!
    } catch (error) {
      console.error('Failed to get item:', error)
      throw error
    }
  }

  // User Points
  async getUserPoints(): Promise<number> {
    try {
      const response = await this.api.get<ApiResponse<number>>('/me/points')
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get user points')
      }
      
      return response.data.data || 0
    } catch (error) {
      console.error('Failed to get user points:', error)
      throw error
    }
  }

  async purchaseWithPoints(itemId: string): Promise<any> {
    try {
      const response = await this.api.post<ApiResponse>('/purchase/points', {
        item_id: itemId
      })
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to purchase with points')
      }
      
      return response.data.data
    } catch (error) {
      console.error('Failed to purchase with points:', error)
      throw error
    }
  }

  // Inventory
  async getUserInventory(): Promise<any[]> {
    try {
      const response = await this.api.get<ApiResponse<any[]>>('/me/inventory')
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get user inventory')
      }
      
      return response.data.data || []
    } catch (error) {
      console.error('Failed to get user inventory:', error)
      throw error
    }
  }

  // Configuration helpers
  getPortOneConfig() {
    return getClientSafeConfig()
  }

  isProductionReady() {
    return isProductionReady()
  }

  getStoreId() {
    return portOneConfig.storeId
  }
}

export const paymentService = new PaymentService()
export default paymentService