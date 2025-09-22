// frontend/src/components/admin/MaintenanceBanner.tsx
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

const MaintenanceBanner = () => {
  const [announcement, setAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    const socket: Socket = io(`${WS_URL}/ws/chat`, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket for maintenance announcements');
    });

    socket.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'maintenance') {
          setAnnouncement(message.message);
        }
      } catch (error) {
        // Not a JSON message, ignore
      }
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <AnimatePresence>
      {announcement && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 bg-yellow-500 text-black p-4 text-center z-50 flex items-center justify-center gap-4"
        >
          <AlertTriangle className="w-6 h-6" />
          <p className="font-semibold">{announcement}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MaintenanceBanner;
