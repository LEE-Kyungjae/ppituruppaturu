// frontend/src/pages/admin/maintenance/index.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import AdminLayout from '@/components/admin/AdminLayout';
import { Calendar, Clock, MessageSquare, Send, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

const adminApiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
});

adminApiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface MaintenanceSchedule {
  id: string;
  start_time: string;
  end_time: string;
  message: string;
  status: string;
}

const MaintenanceScheduler = () => {
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [message, setMessage] = useState('시스템 점검이 진행될 예정입니다. 이용에 불편을 드려 죄송합니다.');
  const [scheduled, setScheduled] = useState<MaintenanceSchedule | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchScheduled = async () => {
      try {
        const { data } = await adminApiClient.get<MaintenanceSchedule>('/api/v1/admin/maintenance');
        setScheduled(data);
      } catch (err) {
        // No scheduled maintenance
      }
    };
    fetchScheduled();
  }, []);

  const handleSchedule = async () => {
    if (!startTime) {
      setError('시작 시간을 선택해주세요.');
      return;
    }

    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    try {
      const { data } = await adminApiClient.post<MaintenanceSchedule>('/api/v1/admin/maintenance', {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        message,
      });
      setScheduled(data);
      setSuccess('점검이 성공적으로 예약되었습니다.');
      setError('');
    } catch (err) {
      setError('점검 예약에 실패했습니다.');
      setSuccess('');
    }
  };

  const handleCancel = async () => {
    if (!scheduled) return;

    try {
      await adminApiClient.delete(`/api/v1/admin/maintenance/${scheduled.id}`);
      setScheduled(null);
      setSuccess('예약된 점검이 취소되었습니다.');
      setError('');
    } catch (err) {
      setError('점검 취소에 실패했습니다.');
      setSuccess('');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">점검 예약</h2>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert"><AlertTriangle className="inline w-4 h-4 mr-2"/>{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert"><CheckCircle className="inline w-4 h-4 mr-2"/>{success}</div>}

      {scheduled ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">예약된 점검</h3>
          <p><span className="font-semibold">시작:</span> {new Date(scheduled.start_time).toLocaleString()}</p>
          <p><span className="font-semibold">종료:</span> {new Date(scheduled.end_time).toLocaleString()}</p>
          <p><span className="font-semibold">메시지:</span> {scheduled.message}</p>
          <p><span className="font-semibold">상태:</span> {scheduled.status}</p>
          <button
            onClick={handleCancel}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            예약 취소
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">지속 시간 (분)</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="number" value={duration} onChange={e => setDuration(parseInt(e.target.value, 10))} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">공지 메시지</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          <button
            onClick={handleSchedule}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            예약하기
          </button>
        </div>
      )}
    </div>
  );
};

export default function AdminMaintenancePage() {
  return (
    <AdminLayout>
      <MaintenanceScheduler />
    </AdminLayout>
  );
}
