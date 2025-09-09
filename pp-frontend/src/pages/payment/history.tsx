// frontend/src/pages/payment/history.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import paymentService from '@/services/paymentService'
import type { PaymentHistoryItem } from '@/types/payment'
import { ArrowLeft, Calendar, CreditCard, Package } from 'lucide-react'

export default function PaymentHistory() {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState({
    period: '30days',
    status: 'all'
  })

  // 결제 내역 로드
  useEffect(() => {
    const loadPaymentHistory = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const history = await paymentService.getPaymentHistory(50, 0)
        setPayments(history)
      } catch (err) {
        console.error('Failed to load payment history:', err)
        setError('결제 내역을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadPaymentHistory()
  }, [filter])

  // 상태별 스타일
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-700 bg-green-100 border-green-200'
      case 'ready':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'failed':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'cancelled':
        return 'text-gray-700 bg-gray-100 border-gray-200'
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return '결제완료'
      case 'ready': return '결제대기'
      case 'failed': return '결제실패'
      case 'cancelled': return '결제취소'
      default: return status
    }
  }

  const filteredPayments = payments.filter(payment => {
    if (filter.status !== 'all' && payment.status !== filter.status) {
      return false
    }
    // TODO: period filtering based on created_at
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-flutter-blue-50 to-flutter-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-flutter-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-flutter-gray-600">결제 내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-flutter-blue-50 to-flutter-purple-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-flutter-gray-800 mb-2">오류 발생</h2>
          <p className="text-flutter-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-flutter-blue-500 text-white py-3 rounded-xl font-semibold hover:bg-flutter-blue-600 transition-colors duration-200"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-flutter-blue-50 to-flutter-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-flutter-gray-800">결제 내역</h1>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white text-flutter-gray-700 px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </button>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-flutter-gray-700 text-sm font-medium mb-2">기간</label>
              <select
                value={filter.period}
                onChange={(e) => setFilter(prev => ({ ...prev, period: e.target.value }))}
                className="w-full border border-flutter-gray-300 rounded-xl px-4 py-3 text-flutter-gray-800 focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
              >
                <option value="7days">최근 7일</option>
                <option value="30days">최근 30일</option>
                <option value="90days">최근 3개월</option>
                <option value="1year">최근 1년</option>
                <option value="all">전체</option>
              </select>
            </div>
            
            <div>
              <label className="block text-flutter-gray-700 text-sm font-medium mb-2">상태</label>
              <select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-flutter-gray-300 rounded-xl px-4 py-3 text-flutter-gray-800 focus:ring-2 focus:ring-flutter-blue-500 focus:border-transparent"
              >
                <option value="all">전체</option>
                <option value="paid">결제완료</option>
                <option value="ready">결제대기</option>
                <option value="failed">결제실패</option>
                <option value="cancelled">결제취소</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-lg">
              <div className="w-20 h-20 bg-flutter-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-flutter-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-flutter-gray-800 mb-2">결제 내역이 없습니다</h3>
              <p className="text-flutter-gray-600">첫 결제를 진행해보세요!</p>
            </div>
          ) : (
            filteredPayments.map((payment, index) => (
              <motion.div
                key={payment.payment_id}
                className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-flutter-blue-100 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-flutter-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-flutter-gray-800 mb-1">
                        {payment.item_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-flutter-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(payment.created_at).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyle(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-flutter-gray-50 rounded-2xl p-4">
                  <div>
                    <span className="block text-flutter-gray-600 text-sm mb-1">결제 금액</span>
                    <div className="text-flutter-gray-800 font-bold text-lg">
                      {payment.amount.toLocaleString()}원
                    </div>
                  </div>
                  
                  <div>
                    <span className="block text-flutter-gray-600 text-sm mb-1">결제 번호</span>
                    <div className="text-flutter-gray-500 font-mono text-xs">
                      {payment.merchant_uid}
                    </div>
                  </div>
                  
                  {payment.paid_at && (
                    <div>
                      <span className="block text-flutter-gray-600 text-sm mb-1">결제 일시</span>
                      <div className="text-flutter-gray-500 text-sm">
                        {new Date(payment.paid_at).toLocaleString('ko-KR')}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}