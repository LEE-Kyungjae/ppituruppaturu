// frontend/src/pages/payment/success.tsx
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import paymentService from '@/services/paymentService'
import type { PaymentResult } from '@/types/payment'

export default function PaymentSuccess() {
  const router = useRouter()
  const [isConfirming, setIsConfirming] = useState(true)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyPayment = async () => {
      const { imp_uid, merchant_uid } = router.query

      if (!imp_uid || typeof imp_uid !== 'string') {
        setError('결제 정보가 없습니다.')
        setIsConfirming(false)
        return
      }

      try {
        const result = await paymentService.verifyPayment(imp_uid)
        setPaymentResult(result)
        
        if (!result.success) {
          setError(result.message || '결제 검증에 실패했습니다.')
        }
      } catch (err) {
        console.error('Payment verification failed:', err)
        setError('결제 검증 중 오류가 발생했습니다.')
      } finally {
        setIsConfirming(false)
      }
    }

    if (router.isReady) {
      verifyPayment()
    }
  }, [router.isReady, router.query])

  const handleGoToShop = () => {
    router.push('/shop')
  }

  const handleGoToHome = () => {
    router.push('/')
  }

  const handleGoToInventory = () => {
    router.push('/inventory')
  }

  if (isConfirming) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-flutter-blue-50 to-flutter-purple-50 flex items-center justify-center">
        <motion.div
          className="text-center bg-white rounded-3xl shadow-2xl p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-flutter-blue-500 border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-2xl font-bold text-flutter-gray-800 mb-4">결제 확인 중...</h2>
          <p className="text-flutter-gray-600">잠시만 기다려주세요.</p>
        </motion.div>
      </div>
    )
  }

  if (error || !paymentResult?.success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <motion.div
          className="text-center bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-flutter-gray-800 mb-4">결제 확인 실패</h2>
          <p className="text-flutter-gray-600 mb-6">{error || '결제 정보를 확인할 수 없습니다.'}</p>
          <motion.button
            onClick={handleGoToHome}
            className="w-full bg-flutter-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-flutter-blue-600 transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            홈으로 돌아가기
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-flutter-blue-50 flex items-center justify-center p-4">
      <motion.div
        className="text-center bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <span className="text-4xl">🎉</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-flutter-gray-800 mb-4"
        >
          결제가 완료되었습니다!
        </motion.h1>

        {/* Payment Details */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-flutter-gray-50 rounded-2xl p-6 mb-8"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-flutter-gray-600">결제 금액</span>
              <span className="font-semibold text-flutter-gray-800">
                {paymentResult.amount.toLocaleString()}원
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-flutter-gray-600">결제 번호</span>
              <span className="text-xs text-flutter-gray-500 font-mono">
                {paymentResult.merchant_uid}
              </span>
            </div>
            {paymentResult.paid_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-flutter-gray-600">결제 일시</span>
                <span className="text-sm text-flutter-gray-500">
                  {new Date(paymentResult.paid_at).toLocaleString('ko-KR')}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <button
            onClick={handleGoToInventory}
            className="w-full bg-gradient-to-r from-flutter-blue-500 to-flutter-purple-500 text-white py-4 rounded-xl font-semibold hover:from-flutter-blue-600 hover:to-flutter-purple-600 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <span className="text-xl">📦</span>
            내 아이템 확인하기
          </button>
          
          <button
            onClick={handleGoToHome}
            className="w-full bg-flutter-gray-100 text-flutter-gray-700 py-3 rounded-xl font-medium hover:bg-flutter-gray-200 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span className="text-lg">🏠</span>
            홈으로 돌아가기
          </button>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-flutter-gray-400 mt-6"
        >
          결제 내역은 마이페이지에서 확인하실 수 있습니다.
        </motion.p>
      </motion.div>
    </div>
  )
}