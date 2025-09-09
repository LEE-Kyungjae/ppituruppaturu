// frontend/src/components/payment/PaymentModal.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CreditCard, Smartphone, Building2, Phone } from 'lucide-react'
import { usePortOnePayment } from '@/hooks/usePortOnePayment'
import type { PaymentItem, BuyerInfo, IMPRequestData } from '@/types/payment'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  item: PaymentItem
  quantity?: number
  onSuccess?: (result: any) => void
  onError?: (error: Error) => void
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  item,
  quantity = 1,
  onSuccess,
  onError
}) => {
  const [selectedPayMethod, setSelectedPayMethod] = useState<IMPRequestData['pay_method']>('card')
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    name: '',
    email: '',
    tel: '',
    addr: '',
    postcode: ''
  })
  const [isFormValid, setIsFormValid] = useState(false)

  const { processPayment, isLoading, error } = usePortOnePayment({
    onSuccess: (result) => {
      onSuccess?.(result)
      onClose()
    },
    onError: (error) => {
      onError?.(error)
    },
    onCancel: () => {
      console.log('Payment cancelled by user')
    }
  })

  // 폼 검증
  React.useEffect(() => {
    const isValid = buyerInfo.name && buyerInfo.email && buyerInfo.tel
    setIsFormValid(!!isValid)
  }, [buyerInfo])

  const handleInputChange = (field: keyof BuyerInfo, value: string) => {
    setBuyerInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePayment = async () => {
    if (!isFormValid) return

    try {
      await processPayment(item, quantity, buyerInfo, selectedPayMethod)
    } catch (err) {
      console.error('Payment failed:', err)
    }
  }

  const paymentMethods = [
    { id: 'card', name: '신용/체크카드', icon: CreditCard, description: '모든 카드사 지원' },
    { id: 'kakaopay', name: '카카오페이', icon: Smartphone, description: '간편결제' },
    { id: 'trans', name: '실시간 계좌이체', icon: Building2, description: '모든 은행 지원' },
    { id: 'vbank', name: '가상계좌', icon: Building2, description: '입금 후 자동승인' },
    { id: 'phone', name: '휴대폰', icon: Phone, description: '통신사 결제' }
  ]

  const totalAmount = item.price_cash * quantity

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-flutter-gray-200">
            <h2 className="text-xl font-bold text-flutter-gray-800">결제하기</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-flutter-gray-100 rounded-full transition-colors duration-200"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-flutter-gray-600" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            {/* 상품 정보 */}
            <div className="p-6 border-b border-flutter-gray-200">
              <div className="flex items-center gap-4">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-flutter-gray-800">{item.name}</h3>
                  <p className="text-sm text-flutter-gray-600 mt-1">{item.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-flutter-gray-600">수량: {quantity}개</span>
                    <span className="text-lg font-bold text-flutter-blue-600">
                      {totalAmount.toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 구매자 정보 */}
            <div className="p-6 border-b border-flutter-gray-200">
              <h4 className="font-semibold text-flutter-gray-800 mb-4">구매자 정보</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-flutter-gray-700 mb-1">
                    이름 *
                  </label>
                  <input
                    type="text"
                    value={buyerInfo.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-flutter-gray-300 rounded-lg focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
                    placeholder="구매자 이름을 입력하세요"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-flutter-gray-700 mb-1">
                    이메일 *
                  </label>
                  <input
                    type="email"
                    value={buyerInfo.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-2 border border-flutter-gray-300 rounded-lg focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
                    placeholder="이메일 주소를 입력하세요"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-flutter-gray-700 mb-1">
                    연락처 *
                  </label>
                  <input
                    type="tel"
                    value={buyerInfo.tel}
                    onChange={(e) => handleInputChange('tel', e.target.value)}
                    className="w-full px-4 py-2 border border-flutter-gray-300 rounded-lg focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
                    placeholder="휴대폰 번호를 입력하세요"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* 결제수단 선택 */}
            <div className="p-6">
              <h4 className="font-semibold text-flutter-gray-800 mb-4">결제수단</h4>
              <div className="space-y-2">
                {paymentMethods.map((method) => {
                  const IconComponent = method.icon
                  return (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedPayMethod === method.id
                          ? 'border-flutter-blue-500 bg-flutter-blue-50'
                          : 'border-flutter-gray-300 hover:border-flutter-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        value={method.id}
                        checked={selectedPayMethod === method.id}
                        onChange={(e) => setSelectedPayMethod(e.target.value as IMPRequestData['pay_method'])}
                        className="sr-only"
                        disabled={isLoading}
                      />
                      <IconComponent className="w-6 h-6 text-flutter-gray-600 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-flutter-gray-800">{method.name}</div>
                        <div className="text-sm text-flutter-gray-600">{method.description}</div>
                      </div>
                      {selectedPayMethod === method.id && (
                        <div className="w-4 h-4 bg-flutter-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* 결제 버튼 */}
            <div className="p-6 border-t border-flutter-gray-200">
              <button
                onClick={handlePayment}
                disabled={!isFormValid || isLoading}
                className="w-full bg-gradient-to-r from-flutter-blue-500 to-flutter-purple-500 text-white py-4 rounded-xl font-semibold text-lg hover:from-flutter-blue-600 hover:to-flutter-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    결제 진행 중...
                  </div>
                ) : (
                  `${totalAmount.toLocaleString()}원 결제하기`
                )}
              </button>
              <p className="text-xs text-flutter-gray-500 text-center mt-2">
                결제 정보는 안전하게 암호화되어 처리됩니다.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PaymentModal