import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: string;
  category: string;
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
}

interface AnswerComponentProps {
  question: Question;
  userAnswer?: string;
  isCorrect: boolean;
  showResult: boolean;
  onAnswer: (q: Question, answer: string) => void;
}

export default function AnswerComponent({
  question: q,
  userAnswer,
  isCorrect,
  showResult,
  onAnswer,
}: AnswerComponentProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  // 問題が切り替わったら解説表示状態をリセット
  useEffect(() => {
    setShowExplanation(false);
  }, [q.id]);

  // 解説を表示するかどうか
  const shouldShowExplanation = showResult || showExplanation;

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-xs font-bold tracking-wide shadow-sm">
          {q.category}
        </span>
        <span className="text-gray-400 dark:text-gray-500 text-xs">ID: {q.id}</span>
      </div>
      <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-start gap-2">
        <ArrowRightIcon className="w-6 h-6 text-blue-400 dark:text-blue-300 mt-1 flex-shrink-0" />
        <span>{q.question}</span>
      </p>
      <div className="mb-6 space-y-2 sm:space-y-3 w-full">
        {Object.entries(q.options).map(([key, val]) => (
          <motion.button
            key={key}
            type="button"
            onClick={() => {
              if (!isCorrect && !showResult) onAnswer(q, key);
            }}
            initial={false}
            animate={{
              scale: userAnswer === key ? 1.03 : 1,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`flex items-center p-2 sm:p-3 rounded-xl border transition-all duration-200 w-full text-base sm:text-lg ${
              isCorrect || showResult ? 'cursor-not-allowed' : 'cursor-pointer'
            } ${
              userAnswer === key && !(isCorrect && key === q.answer)
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
                : ''
            } ${
              isCorrect && key === q.answer
                ? ' border-green-400 bg-green-50 dark:bg-green-900'
                : 'border-gray-200 dark:border-gray-700'
            } ${!(isCorrect || showResult) ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''} ${
              isCorrect || showResult ? ' opacity-70' : ''
            }`}
            disabled={isCorrect || showResult}
          >
            <div
              className={`w-5 h-5 border-2 rounded-full flex items-center justify-center mr-3 flex-shrink-0 transition-colors ${
                userAnswer === key ? 'border-blue-500' : 'border-gray-400 dark:border-gray-500'
              }`}
            >
              {userAnswer === key && (
                <div className="w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
              )}
            </div>

            <span className="font-semibold mr-2 leading-tight">{key}:</span>
            <span className="flex-1 text-left leading-tight">{val}</span>
            <AnimatePresence>
              {showResult && userAnswer === key && userAnswer !== q.answer && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="ml-auto flex items-center"
                >
                  <XCircleIcon className="w-5 h-5 text-red-400" />
                </motion.span>
              )}
              {isCorrect && key === q.answer && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="ml-auto flex items-center"
                >
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
      {/* 解説ボタン */}
      {!shouldShowExplanation && (
        <div className="flex justify-end">
          <Button
            variant="solid"
            style={{ color: '#2563eb', backgroundColor: '#fff', borderColor: '#d1d5db' }}
            onPress={() => setShowExplanation(true)}
            className="mt-2"
          >
            解説を見る
          </Button>
        </div>
      )}
      {/* 正解・不正解 or 解説表示 */}
      {shouldShowExplanation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          {showResult && (
            <div className="flex items-center mb-2">
              {userAnswer === q.answer ? (
                <>
                  <CheckCircleIcon className="w-6 h-6 flex-shrink-0 mr-2" />
                  <span className="ml-1">正解！</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="w-6 h-6 flex-shrink-0 mr-2" />
                  <span>不正解 (正解: {q.answer})</span>
                </>
              )}
            </div>
          )}
          <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-200 text-base shadow-sm">
            <span className="font-bold">解説:</span> {q.explanation}
          </div>
        </motion.div>
      )}
    </>
  );
}
