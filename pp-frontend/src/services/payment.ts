// frontend/src/services/payment.ts
// 토스페이먼츠 결제 서비스
import { apiClient } from './api'

// 토스페이먼츠 SDK 타입 정의
declare global {
  interface Window {
    TossPayments: any
  }
}

// 결제 아이템 타입
export interface PaymentItem {
  id: string
  name: string
  price: number
  quantity: number
  description?: string
  type: 'points' | 'premium' | 'item'
}

// 결제 요청 데이터
export interface PaymentRequest {
  orderId: string
  amount: number
  orderName: string
  customerEmail?: string
  customerName?: string
  items: PaymentItem[]
  successUrl: string
  failUrl: string
}

// 결제 결과
export interface PaymentResult {
  orderId: string
  paymentKey: string
  amount: number
  status: 'SUCCESS' | 'FAIL' | 'CANCEL'
  message?: string
}

export class PaymentService {
  private tossPayments: any
  private clientKey: string

  constructor() {
    this.clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_CLIENT_KEY || 'test_ck_example'
    this.initializeTossPayments()
  }

  // 토스페이먼츠 SDK 초기화
  private async initializeTossPayments() {
    if (typeof window === 'undefined') return

    try {
      // SDK가 이미 로드되어 있는지 확인
      if (window.TossPayments) {
        this.tossPayments = window.TossPayments(this.clientKey)
        return
      }

      // SDK 동적 로드
      const script = document.createElement('script')
      script.src = 'https://js.tosspayments.com/v1/payment'
      script.async = true
      
      script.onload = () => {
        this.tossPayments = window.TossPayments(this.clientKey)
        console.log('TossPayments SDK loaded successfully')
      }

      script.onerror = () => {
        console.error('Failed to load TossPayments SDK')
      }

      document.head.appendChild(script)
    } catch (error) {
      console.error('Error initializing TossPayments:', error)
    }
  }

  // 주문 ID 생성
  private generateOrderId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `ORDER_${timestamp}_${random}`
  }

  // 포인트 패키지 결제
  async purchasePoints(pointsPackage: {
    points: number
    price: number
    packageName: string
  }): Promise<PaymentResult> {
    if (!this.tossPayments) {
      throw new Error('TossPayments SDK not initialized')
    }

    const orderId = this.generateOrderId()
    const paymentRequest: PaymentRequest = {
      orderId,
      amount: pointsPackage.price,
      orderName: pointsPackage.packageName,
      customerEmail: 'user@example.com', // 실제로는 사용자 정보에서 가져와야 함
      customerName: 'User', // 실제로는 사용자 정보에서 가져와야 함
      items: [{
        id: 'points_package',
        name: pointsPackage.packageName,
        price: pointsPackage.price,
        quantity: 1,
        type: 'points'
      }],
      successUrl: `${window.location.origin}/payment/success`,
      failUrl: `${window.location.origin}/payment/fail`
    }

    try {
      // 백엔드에서 결제 정보 저장
      await this.createPaymentOrder(paymentRequest)

      // 토스페이먼츠 결제 창 호출
      await this.tossPayments.requestPayment('카드', {
        amount: paymentRequest.amount,
        orderId: paymentRequest.orderId,
        orderName: paymentRequest.orderName,
        customerName: paymentRequest.customerName,
        successUrl: paymentRequest.successUrl,
        failUrl: paymentRequest.failUrl,
      })

      return {
        orderId: paymentRequest.orderId,
        paymentKey: '', // 성공 콜백에서 받아올 예정
        amount: paymentRequest.amount,
        status: 'SUCCESS'
      }
    } catch (error: any) {
      console.error('Payment failed:', error)
      return {
        orderId: paymentRequest.orderId,
        paymentKey: '',
        amount: paymentRequest.amount,
        status: 'FAIL',
        message: error.message || '결제에 실패했습니다.'
      }
    }
  }

  // 프리미엄 구독 결제
  async purchasePremium(subscription: {
    type: 'weekly' | 'monthly' | 'yearly'
    price: number
    name: string
  }): Promise<PaymentResult> {
    if (!this.tossPayments) {
      throw new Error('TossPayments SDK not initialized')
    }

    const orderId = this.generateOrderId()
    
    try {
      await this.tossPayments.requestPayment('카드', {
        amount: subscription.price,
        orderId,
        orderName: subscription.name,
        customerName: 'User',
        successUrl: `${window.location.origin}/payment/success?type=premium`,
        failUrl: `${window.location.origin}/payment/fail`,
      })

      return {
        orderId,
        paymentKey: '',
        amount: subscription.price,
        status: 'SUCCESS'
      }
    } catch (error: any) {
      return {
        orderId,
        paymentKey: '',
        amount: subscription.price,
        status: 'FAIL',
        message: error.message || '결제에 실패했습니다.'
      }
    }
  }

  // 결제 승인 (결제 성공 후 백엔드에서 처리)
  async confirmPayment(paymentKey: string, orderId: string, amount: number): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>('/api/v1/payments/confirm', {
        paymentKey,
        orderId,
        amount
      })
      
      return response.success === true
    } catch (error) {
      console.error('Payment confirmation failed:', error)
      return false
    }
  }

  // 결제 주문 생성 (백엔드)
  private async createPaymentOrder(paymentRequest: PaymentRequest): Promise<void> {
    try {
      await apiClient.post('/api/v1/payments/orders', {
        orderId: paymentRequest.orderId,
        amount: paymentRequest.amount,
        orderName: paymentRequest.orderName,
        items: paymentRequest.items
      })
    } catch (error) {
      console.error('Failed to create payment order:', error)
      throw error
    }
  }

  // 결제 내역 조회
  async getPaymentHistory(limit: number = 10, offset: number = 0) {
    try {
      return await apiClient.get(`/api/v1/payments/history?limit=${limit}&offset=${offset}`)
    } catch (error) {
      console.error('Failed to get payment history:', error)
      throw error
    }
  }

  // 결제 취소
  async cancelPayment(paymentKey: string, cancelReason: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>('/api/v1/payments/cancel', {
        paymentKey,
        cancelReason
      })
      
      return response.success === true
    } catch (error) {
      console.error('Payment cancellation failed:', error)
      return false
    }
  }

  // 아이템 구매 처리
  async processItemPurchase(request: {
    itemId: string
    itemName: string
    amount: number
    paymentMethod: string
  }): Promise<boolean> {
    try {
      // 실제로는 결제 처리 로직
      const response = await apiClient.post<{ success: boolean }>('/api/v1/payments/items', {
        itemId: request.itemId,
        itemName: request.itemName,
        amount: request.amount,
        paymentMethod: request.paymentMethod
      })
      
      return response.success === true
    } catch (error) {
      console.error('Item purchase failed:', error)
      return false
    }
  }

  // 프리미엄 구독 처리
  async subscribePremium(packageId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>('/api/v1/payments/subscribe', {
        packageId
      })
      
      return response.success === true
    } catch (error) {
      console.error('Premium subscription failed:', error)
      return false
    }
  }
}

// 포인트 패키지 정의
export const POINTS_PACKAGES = [
  {
    id: 'points_1000',
    points: 1000,
    price: 1000, // 원 단위
    packageName: '포인트 1,000개',
    description: '기본 포인트 패키지',
    bonus: 0,
    popular: false
  },
  {
    id: 'points_5000',
    points: 5000,
    price: 4900, // 100원 할인
    packageName: '포인트 5,000개',
    description: '인기 포인트 패키지',
    bonus: 100,
    popular: true
  },
  {
    id: 'points_10000',
    points: 10000,
    price: 9500, // 500원 할인
    packageName: '포인트 10,000개',
    description: '대용량 포인트 패키지',
    bonus: 500,
    popular: false
  },
  {
    id: 'points_50000',
    points: 50000,
    price: 45000, // 5000원 할인
    packageName: '포인트 50,000개',
    description: '최대 용량 포인트 패키지',
    bonus: 5000,
    popular: false
  }
]

// 프리미엄 구독 패키지 정의
export const PREMIUM_PACKAGES = [
  {
    id: 'premium_weekly',
    type: 'weekly' as const,
    price: 2900,
    name: '프리미엄 주간 패스',
    description: '7일간 모든 프리미엄 혜택',
    features: [
      '포인트 획득량 2배',
      '광고 제거',
      '프리미엄 아바타 무료',
      '우선 지원'
    ]
  },
  {
    id: 'premium_monthly',
    type: 'monthly' as const,
    price: 9900,
    name: '프리미엄 월간 패스',
    description: '30일간 모든 프리미엄 혜택',
    features: [
      '포인트 획득량 3배',
      '광고 완전 제거',
      '모든 아바타/테마 무료',
      '프리미엄 리더보드',
      '24/7 우선 지원'
    ],
    popular: true
  },
  {
    id: 'premium_yearly',
    type: 'yearly' as const,
    price: 99000, // 2개월 무료
    name: '프리미엄 연간 패스',
    description: '1년간 모든 프리미엄 혜택 (2개월 무료!)',
    features: [
      '포인트 획득량 5배',
      '광고 완전 제거',
      '모든 콘텐츠 무료',
      '독점 아바타/테마',
      'VIP 리더보드',
      '전용 고객 지원'
    ]
  }
]

// 싱글톤 인스턴스
export const paymentService = new PaymentService()

// 유틸리티 함수들
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(price)
}

export const getPointsPackageById = (id: string) => {
  return POINTS_PACKAGES.find(pkg => pkg.id === id)
}

export const getPremiumPackageById = (id: string) => {
  return PREMIUM_PACKAGES.find(pkg => pkg.id === id)
}