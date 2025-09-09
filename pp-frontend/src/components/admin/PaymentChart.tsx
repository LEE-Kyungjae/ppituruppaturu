// frontend/src/components/admin/PaymentChart.tsx
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign } from 'lucide-react'

export default function PaymentChart() {
  // TODO: 실제 차트 라이브러리 구현 (예: recharts, chart.js)
  const mockData = [
    { day: '월', amount: 1200000 },
    { day: '화', amount: 1800000 },
    { day: '수', amount: 2100000 },
    { day: '목', amount: 1900000 },
    { day: '금', amount: 2500000 },
    { day: '토', amount: 3200000 },
    { day: '일', amount: 2800000 }
  ]

  const maxAmount = Math.max(...mockData.map(d => d.amount))

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          주간 매출 현황
        </h3>
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+12.5%</span>
        </div>
      </div>

      <div className="space-y-3">
        {mockData.map((item, index) => (
          <motion.div
            key={item.day}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3"
          >
            <span className="w-8 text-sm text-gray-600 font-medium">{item.day}</span>
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.amount / maxAmount) * 100}%` }}
                transition={{ delay: index * 0.1 + 0.2, duration: 1 }}
                className="h-full bg-gradient-to-r from-flutter-blue-500 to-flutter-purple-500"
              />
            </div>
            <span className="w-20 text-sm text-gray-900 font-medium text-right">
              {(item.amount / 10000).toFixed(0)}만원
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">총 주간 매출</span>
          <span className="font-bold text-lg text-green-600">
            {(mockData.reduce((sum, item) => sum + item.amount, 0) / 10000).toFixed(0)}만원
          </span>
        </div>
      </div>
    </div>
  )
}