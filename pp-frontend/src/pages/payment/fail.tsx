// frontend/src/pages/payment/fail.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'

export default function PaymentFail() {
  const router = useRouter()
  const [errorInfo, setErrorInfo] = useState<{
    code?: string
    message?: string
  }>({})

  useEffect(() => {
    if (router.isReady) {
      const { code, message } = router.query
      setErrorInfo({
        code: code as string,
        message: message as string
      })
    }
  }, [router.isReady, router.query])

  const handleRetry = () => {
    router.push('/shop')
  }

  const handleGoToHome = () => {
    router.push('/')
  }

  const getErrorMessage = (code?: string) => {
    switch (code) {
      case 'imp_user_cancel':
        return '사용자가 결제를 취소했습니다.'
      case 'PAY_PROCESS_CANCELED':
        return '사용자가 결제를 취소했습니다.'
      case 'PAY_PROCESS_ABORTED':
        return '결제 과정에서 오류가 발생했습니다.'
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다.'
      case 'INVALID_CARD_COMPANY':
        return '유효하지 않은 카드입니다.'
      case 'NOT_SUPPORTED_INSTALLMENT':
        return '지원하지 않는 할부 개월입니다.'
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return '일일 결제 한도를 초과했습니다.'
      case 'EXCEED_MAX_PAYMENT_AMOUNT':
        return '결제 금액 한도를 초과했습니다.'
      case 'INSUFFICIENT_BALANCE':
        return '잔액이 부족합니다.'
      default:
        return errorInfo.message || '결제 처리 중 오류가 발생했습니다.'
    }
  }

  const getErrorIcon = (code?: string) => {
    switch (code) {
      case 'imp_user_cancel':
      case 'PAY_PROCESS_CANCELED':
        return '⏸️'
      case 'INSUFFICIENT_BALANCE':
        return '💳'
      case 'REJECT_CARD_COMPANY':
      case 'INVALID_CARD_COMPANY':
        return '🚫'
      default:
        return '❌'
    }
  }

  const getSolution = (code?: string) => {
    switch (code) {
      case 'imp_user_cancel':
      case 'PAY_PROCESS_CANCELED':
        return '결제를 다시 시도해보세요.'
      case 'INSUFFICIENT_BALANCE':
        return '잔액을 확인하시거나 다른 결제 수단을 이용해보세요.'
      case 'REJECT_CARD_COMPANY':
      case 'INVALID_CARD_COMPANY':
        return '다른 카드로 시도하시거나 카드사에 문의해보세요.'
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
      case 'EXCEED_MAX_PAYMENT_AMOUNT':
        return '내일 다시 시도하시거나 카드사에 한도 상향을 문의해보세요.'
      default:
        return '문제가 지속되면 고객센터에 문의해주세요.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <motion.div
        className="text-center bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 10,
            delay: 0.2 
          }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-4xl">{getErrorIcon(errorInfo.code)}</span>
        </motion.div>
        
        {/* Title */}
        <motion.h2
          className="text-2xl font-bold text-flutter-gray-800 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          결제 실패
        </motion.h2>
        
        {/* Error Message */}
        <motion.div
          className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-red-700 font-medium">
            {getErrorMessage(errorInfo.code)}
          </p>
        </motion.div>

        {/* Solution */}
        <motion.div
          className="bg-flutter-blue-50 border border-flutter-blue-200 rounded-2xl p-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-flutter-blue-700 text-sm">
            💡 {getSolution(errorInfo.code)}
          </p>
        </motion.div>

        {/* Error Code */}
        {errorInfo.code && (
          <motion.div
            className="bg-flutter-gray-50 border border-flutter-gray-200 rounded-lg p-3 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <p className="text-flutter-gray-500 text-xs">
              오류 코드: {errorInfo.code}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-flutter-blue-500 to-flutter-purple-500 text-white py-4 rounded-xl font-semibold hover:from-flutter-blue-600 hover:to-flutter-purple-600 transition-all duration-300"
          >
            다시 시도
          </button>
          <button
            onClick={handleGoToHome}
            className="w-full bg-flutter-gray-100 text-flutter-gray-700 py-3 rounded-xl font-medium hover:bg-flutter-gray-200 transition-colors duration-200"
          >
            홈으로 돌아가기
          </button>
        </motion.div>

        {/* Customer Service */}
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <div className="text-flutter-gray-500 text-sm mb-2">
            문제가 계속 발생하면
          </div>
          <button className="text-flutter-blue-500 hover:text-flutter-blue-600 text-sm underline transition-colors">
            고객센터 문의하기
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}