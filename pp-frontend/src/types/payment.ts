// frontend/src/types/payment.ts

export interface PaymentItem {
  id: string
  name: string
  description: string
  price_cash: number
  price_points?: number
  image_url?: string
  type: string
}

export interface BuyerInfo {
  name: string
  email: string
  tel: string
  addr?: string
  postcode?: string
}

export interface CreatePaymentSessionRequest {
  item_id: string
  quantity: number
  buyer_info: BuyerInfo
  redirect_url: string
}

export interface PaymentSession {
  session_id: string
  merchant_uid: string
  item: PaymentItem
  amount: number
  currency: string
  buyer_info: BuyerInfo
  status: string
  created_at: string
}

export interface PreparePaymentResponse {
  merchant_uid: string
  amount: number
  success: boolean
  message?: string
}

export interface PaymentResult {
  payment_id: string
  imp_uid: string
  merchant_uid: string
  status: 'ready' | 'paid' | 'cancelled' | 'failed'
  amount: number
  paid_at?: string
  success: boolean
  message?: string
}

export interface PaymentHistoryItem {
  payment_id: string
  imp_uid: string
  merchant_uid: string
  item_name: string
  amount: number
  status: 'ready' | 'paid' | 'cancelled' | 'failed'
  created_at: string
  paid_at?: string
}

// PortOne IMP integration types
export interface IMPRequestData {
  pg: string
  pay_method: 'card' | 'vbank' | 'trans' | 'phone' | 'cultureland' | 'smartculture' | 'kakaopay' | 'payco'
  merchant_uid: string
  name: string
  amount: number
  buyer_email: string
  buyer_name: string
  buyer_tel: string
  buyer_addr?: string
  buyer_postcode?: string
  notice_url?: string
  m_redirect_url?: string
  app_scheme?: string
}

export interface IMPResponse {
  success: boolean
  error_code?: string
  error_msg?: string
  imp_uid?: string
  merchant_uid?: string
  pay_method?: string
  paid_amount?: number
  status?: string
}

// API Response wrappers
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaymentError {
  code: string
  message: string
  details?: any
}