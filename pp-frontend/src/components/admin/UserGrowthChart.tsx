// frontend/src/components/admin/UserGrowthChart.tsx
import { motion } from 'framer-motion'
import { Users, TrendingUp } from 'lucide-react'

export default function UserGrowthChart() {
  // TODO: 실제 차트 라이브러리 구현
  const mockData = [
    { month: '1월', users: 8500 },
    { month: '2월', users: 9200 },
    { month: '3월', users: 10800 },
    { month: '4월', users: 11500 },
    { month: '5월', users: 12100 },
    { month: '6월', users: 12547 }
  ]

  const maxUsers = Math.max(...mockData.map(d => d.users))
  const growthRate = ((mockData[mockData.length - 1].users - mockData[0].users) / mockData[0].users * 100).toFixed(1)

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          회원 증가 추이
        </h3>
        <div className="flex items-center gap-1 text-green-600">
          <TrendingUp className="w-4 h-4" />
          <span className="text-sm font-medium">+{growthRate}%</span>
        </div>
      </div>

      {/* Simple Line Chart Representation */}
      <div className="h-40 flex items-end justify-between gap-2 mb-4">
        {mockData.map((item, index) => (
          <motion.div
            key={item.month}
            initial={{ height: 0 }}
            animate={{ height: `${(item.users / maxUsers) * 100}%` }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            className="flex-1 bg-gradient-to-t from-flutter-blue-500 to-flutter-blue-300 rounded-t-lg min-h-[20px] relative group"
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-xs px-2 py-1 rounded">
              {item.users.toLocaleString()}명
            </div>
          </motion.div>
        ))}
      </div>

      {/* Month Labels */}
      <div className="flex justify-between text-xs text-gray-600">
        {mockData.map(item => (
          <span key={item.month} className="flex-1 text-center">
            {item.month}
          </span>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">현재 회원수</span>
            <p className="font-bold text-lg text-flutter-blue-600">
              {mockData[mockData.length - 1].users.toLocaleString()}명
            </p>
          </div>
          <div>
            <span className="text-gray-600">월평균 증가</span>
            <p className="font-bold text-lg text-green-600">
              +{Math.floor((mockData[mockData.length - 1].users - mockData[0].users) / mockData.length)}명
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}