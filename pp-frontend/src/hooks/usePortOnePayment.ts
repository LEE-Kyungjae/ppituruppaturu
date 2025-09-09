// frontend/src/hooks/usePortOnePayment.ts
import { useState, useEffect, useCallback } from 'react'
import type { 
  PaymentSession, 
  IMPRequestData, 
  IMPResponse, 
  PaymentResult,
  BuyerInfo,
  PaymentItem
} from '@/types/payment'
import paymentService from '@/services/paymentService'

// PortOne IMP 전역 객체 타입 정의
declare global {
  interface Window {
    IMP?: {
      init: (userCode: string) => void
      request_pay: (data: IMPRequestData, callback: (response: IMPResponse) => void) => void
    }
  }
}

interface UsePortOnePaymentOptions {
  onSuccess?: (result: PaymentResult) => void
  onError?: (error: Error) => void
  onCancel?: () => void
}

export const usePortOnePayment = (options: UsePortOnePaymentOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null)

  // PortOne 스크립트 로드
  useEffect(() => {
    const loadPortOneScript = () => {
      if (window.IMP) return Promise.resolve()

      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://cdn.iamport.kr/v1/iamport.js'
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load PortOne script'))
        document.head.appendChild(script)
      })
    }

    loadPortOneScript().catch((err) => {
      setError('Failed to initialize payment system')
      console.error('PortOne script load error:', err)
    })
  }, [])

  // 결제 세션 생성
  const createPaymentSession = useCallback(async (
    item: PaymentItem,
    quantity: number,
    buyerInfo: BuyerInfo
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const session = await paymentService.createPaymentSession({
        item_id: item.id,
        quantity,
        buyer_info: buyerInfo,
        redirect_url: `${window.location.origin}/payment/success`
      })

      setPaymentSession(session)
      return session
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create payment session'
      setError(errorMessage)
      options.onError?.(new Error(errorMessage))
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [options])

  // 결제 실행
  const executePayment = useCallback(async (
    session: PaymentSession,
    payMethod: IMPRequestData['pay_method'] = 'card'
  ) => {
    if (!window.IMP) {
      throw new Error('PortOne is not loaded')
    }

    setIsLoading(true)
    setError(null)

    try {
      // PortOne 초기화
      const userCode = process.env.NEXT_PUBLIC_PORTONE_USER_CODE
      if (!userCode) {
        throw new Error('PortOne user code is not configured')
      }

      window.IMP.init(userCode)

      // 결제 준비
      await paymentService.preparePayment(session.session_id)

      // 결제 요청 데이터 구성
      const paymentData: IMPRequestData = {
        pg: process.env.NEXT_PUBLIC_PORTONE_PG || 'html5_inicis',
        pay_method: payMethod,
        merchant_uid: session.merchant_uid,
        name: session.item.name,
        amount: session.amount,
        buyer_email: session.buyer_info.email,
        buyer_name: session.buyer_info.name,
        buyer_tel: session.buyer_info.tel,
        buyer_addr: session.buyer_info.addr,
        buyer_postcode: session.buyer_info.postcode,
        notice_url: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/webhook`,
        m_redirect_url: `${window.location.origin}/payment/success`
      }

      // 결제 실행
      return new Promise<PaymentResult>((resolve, reject) => {
        window.IMP!.request_pay(paymentData, async (response) => {
          setIsLoading(false)

          if (response.success && response.imp_uid) {
            try {
              // 서버에서 결제 검증
              const result = await paymentService.verifyPayment(response.imp_uid)
              
              if (result.success) {
                options.onSuccess?.(result)
                resolve(result)
              } else {
                const error = new Error(result.message || 'Payment verification failed')
                options.onError?.(error)
                reject(error)
              }
            } catch (err) {
              const error = err instanceof Error ? err : new Error('Payment verification failed')
              options.onError?.(error)
              reject(error)
            }
          } else {
            if (response.error_code === 'imp_user_cancel') {
              options.onCancel?.()
              reject(new Error('Payment was cancelled by user'))
            } else {
              const error = new Error(response.error_msg || 'Payment failed')
              setError(error.message)
              options.onError?.(error)
              reject(error)
            }
          }
        })
      })
    } catch (err) {
      setIsLoading(false)
      const errorMessage = err instanceof Error ? err.message : 'Payment execution failed'
      setError(errorMessage)
      options.onError?.(new Error(errorMessage))
      throw err
    }
  }, [options])

  // 원스톱 결제 함수
  const processPayment = useCallback(async (
    item: PaymentItem,
    quantity: number,
    buyerInfo: BuyerInfo,
    payMethod: IMPRequestData['pay_method'] = 'card'
  ) => {
    try {
      const session = await createPaymentSession(item, quantity, buyerInfo)
      return await executePayment(session, payMethod)
    } catch (err) {
      throw err
    }
  }, [createPaymentSession, executePayment])

  // 결제 취소
  const cancelPayment = useCallback(async (paymentId: string, reason: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await paymentService.cancelPayment(paymentId, reason)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel payment'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    // States
    isLoading,
    error,
    paymentSession,
    
    // Methods
    createPaymentSession,
    executePayment,
    processPayment,
    cancelPayment,
    
    // Utilities
    clearError: () => setError(null),
    clearSession: () => setPaymentSession(null)
  }
}