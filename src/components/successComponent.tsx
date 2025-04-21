import { Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessComponentProps {
  show: boolean;
  onClose: () => void;
}

export default function SuccessComponent({ show, onClose }: SuccessComponentProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center relative"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            {/* 簡易紙吹雪 */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  animate={{
                    y: [0, 400 + Math.random() * 100],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    delay: Math.random(),
                  }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    background: `hsl(${Math.random() * 360}, 80%, 60%)`,
                  } as React.CSSProperties}
                />
              ))}
            </motion.div>
            <h3 className="text-2xl font-bold text-blue-600 mb-2">おめでとうございます！</h3>
            <p className="text-lg text-gray-700 dark:text-gray-200 mb-4">
              全問正解です！素晴らしい！
            </p>
            <Button
              variant="solid"
              onPress={onClose}
              className="mt-2"
              style={{ color: '#2563eb', backgroundColor: '#fff', borderColor: '#d1d5db' }}
            >
              閉じる
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
