'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/20/solid';
import { Checkbox, Button, Alert, cn } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

// 質問データ型
interface Question {
  id: string;
  category: string;
  question: string;
  options: Record<string, string>;
  answer: string;
  explanation: string;
}

function shuffleArray<T>(array: T[]): T[] {
  // Fisher-Yates (Knuth) シャッフルアルゴリズム
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const STORAGE_KEY = 'gcpDevOpsQuizProgress';

function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [correctlyAnsweredIds, setCorrectlyAnsweredIds] = useState<Set<string>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // スコア計算はuseEffectより前に定義
  const correctCount = filteredQuestions.filter((q) => correctlyAnsweredIds.has(q.id)).length;
  const totalCount = filteredQuestions.length;

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCorrectlyAnsweredIds(new Set(JSON.parse(saved)));
      } catch {
        setCorrectlyAnsweredIds(new Set());
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    fetch('questions.json')
      .then((res) => {
        if (!res.ok) throw new Error('questions.jsonの取得に失敗');
        return res.json();
      })
      .then((data) => {
        setQuestions(data);
        const cats = [...new Set(data.map((q: { category: string; }) => q.category))].sort();
        setCategories(cats as string[]);
        setSelectedCategories(cats as string[]);
        setLoading(false);
      })
      .catch(() => {
        setError(
          '問題データの読み込みに失敗しました。questions.jsonの配置・形式を確認してください。',
        );
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (questions.length === 0) return;
    const filtered = questions.filter((q) => selectedCategories.includes(q.category));
    setFilteredQuestions(shuffleArray([...filtered]));
    setCurrentIdx(0);
    setShowResult(false);
    setUserAnswers({});
  }, [questions, selectedCategories]);

  useEffect(() => {
    if (totalCount > 0 && correctCount === totalCount) {
      setShowCelebration(true);
    }
  }, [correctCount, totalCount]);

  const saveProgress = useCallback((ids: Set<string>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  }, []);

  const handleReset = useCallback(() => {
    if (window.confirm('本当に進捗をリセットしますか？保存された正解状況がすべて削除されます。')) {
      setCorrectlyAnsweredIds(new Set());
      localStorage.removeItem(STORAGE_KEY);
      setUserAnswers({});
      setShowResult(false);
    }
  }, [setCorrectlyAnsweredIds, setUserAnswers, setShowResult]);

  const handleAnswer = useCallback(
    (q: Question, userAnswer: string) => {
      setUserAnswers((prev) => ({ ...prev, [q.id]: userAnswer }));
      setShowResult(true);
      if (userAnswer === q.answer && !correctlyAnsweredIds.has(q.id)) {
        const newSet = new Set(correctlyAnsweredIds);
        newSet.add(q.id);
        setCorrectlyAnsweredIds(newSet);
        saveProgress(newSet);
      }
    },
    [correctlyAnsweredIds, setCorrectlyAnsweredIds, setUserAnswers, setShowResult, saveProgress],
  );

  const handleNext = useCallback(() => {
    setShowResult(false);
    setCurrentIdx((idx) => Math.min(idx + 1, filteredQuestions.length - 1));
  }, [filteredQuestions.length, setCurrentIdx, setShowResult]);

  const handlePrev = useCallback(() => {
    setShowResult(false);
    setCurrentIdx((idx) => Math.max(idx - 1, 0));
  }, [setCurrentIdx, setShowResult]);

  const handleShuffle = useCallback(() => {
    setFilteredQuestions(shuffleArray([...filteredQuestions]));
    setCurrentIdx(0);
    setShowResult(false);
    setUserAnswers({});
  }, [filteredQuestions, setFilteredQuestions, setCurrentIdx, setShowResult, setUserAnswers]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6 mx-auto w-3/4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl mb-6"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
      </div>
    );
  }
  if (error) {
    return <p className="text-red-500 text-center font-semibold">{error}</p>;
  }

  if (filteredQuestions.length === 0) {
    return <p className="text-center text-gray-600 mt-4">選択された分野の問題はありません。</p>;
  }

  const q = filteredQuestions[currentIdx];
  const isCorrect = correctlyAnsweredIds.has(q.id);
  const userAnswer = userAnswers[q.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
      {/* お祝いモーダル */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {/* 簡易紙吹雪 */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                  />
                ))}
              </motion.div>
              <h3 className="text-2xl font-bold text-blue-600 mb-2">おめでとうございます！</h3>
              <p className="text-lg text-gray-700 dark:text-gray-200 mb-4">
                全問正解です！素晴らしい！
              </p>
              <Button
                variant="solid"
                onPress={() => setShowCelebration(false)}
                className="mt-2"
                style={{ color: '#2563eb', backgroundColor: '#fff', borderColor: '#d1d5db' }}
              >
                閉じる
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="max-w-5xl mx-auto p-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 text-center flex items-center justify-center gap-3 drop-shadow-sm">
          <img
            src="https://img.icons8.com/user"
            alt="logo"
            className="w-10 h-10 inline-block animate-spin-slow"
          />
          Google Cloud DevOps Engineer 練習問題
        </h2>
        <div className="flex md:flex-row md:justify-between items-center bg-white dark:bg-gray-800 p-5 rounded-2xl mb-6 shadow-lg backdrop-blur-sm">
          <div className="w-[75%]">
            <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
              分野を選択
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Checkbox
                  key={cat}
                  value={cat}
                  checked={selectedCategories.includes(cat)}
                  onChange={(e) => {
                    const isSelected = e.target.checked;
                    setSelectedCategories((prev) =>
                      isSelected ? [...prev, cat] : prev.filter((c) => c !== cat),
                    );
                  }}
                  className={cn(
                    'inline-flex w-full max-w-md items-center justify-start',
                    'cursor-pointer rounded-lg p-3 border-2',
                    'transition-colors duration-150',
                    'bg-white dark:bg-gray-700',
                    'border-gray-300 dark:border-gray-600',
                    'hover:bg-gray-50 dark:hover:bg-gray-600',
                    'data-[selected=true]:border-blue-500 dark:data-[selected=true]:border-blue-700',
                    'data-[selected=true]:bg-blue-50 dark:data-[selected=true]:bg-blue-900',
                  )}
                >
                  {cat}
                </Checkbox>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-4 md:mt-0 md:w-auto md:items-start ">
            <Button
              color="primary"
              onPress={handleShuffle}
              className="w-full flex items-center gap-4 border-solid border-2 border-gray-300 dark:border-gray-600 px-4 py-2"
              style={{ color: '#2563eb', backgroundColor: '#fff', borderColor: '#d1d5db' }}
            >
              <ArrowPathIcon className="w-4 h-4" />
              シャッフル
            </Button>
            <Button
              color="danger"
              onPress={handleReset}
              className="w-full flex items-center gap-4 border-solid border-2 border-gray-300 dark:border-gray-600 px-4 py-2"
              style={{ color: '#2563eb', backgroundColor: '#fff', borderColor: '#d1d5db' }}
            >
              <XCircleIcon className="w-4 h-4" />
              進捗リセット
            </Button>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-gray-800 p-4 rounded-2xl shadow flex items-center justify-between mb-6">
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            スコア: <span className="text-blue-600 dark:text-blue-400">{correctCount}</span> /{' '}
            {totalCount}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentIdx + 1} / {totalCount} 問題
          </span>
        </div>
        {/* Add this after the score display div */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6 overflow-hidden">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{
              width:
                totalCount > 1
                  ? `${(currentIdx / (totalCount - 1)) * 100}%`
                  : totalCount === 1
                  ? '100%'
                  : '0%',
            }}
          ></div>
        </div>
        <div className="bg-white/90 dark:bg-gray-900 p-8 rounded-2xl shadow-xl mb-6 animate-fade-in border border-gray-100 dark:border-gray-700">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-full text-xs font-bold tracking-wide shadow-sm">
              {q.category}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-xs">ID: {q.id}</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-start gap-2">
            <ArrowRightIcon className="w-6 h-6 text-blue-400 dark:text-blue-300 mt-1 flex-shrink-0" />
            <span>{q.question}</span>
          </p>
          <div className="mb-6 space-y-3 w-full">
            {Object.entries(q.options).map(([key, val]) => (
              <label
                key={key}
                className={`flex items-center p-3 rounded-xl cursor-pointer border transition-all duration-200 w-full ${
                  userAnswer === key
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }${
                  isCorrect && key === q.answer
                    ? ' border-green-400 bg-green-50 dark:bg-green-900'
                    : ''
                }`}
              >
                <input
                  type="radio"
                  name={`question-${q.id}`}
                  value={key}
                  checked={userAnswer === key}
                  disabled={isCorrect || showResult}
                  onChange={() => handleAnswer(q, key)}
                  className="mr-2 accent-blue-500"
                />
                <span className="font-semibold mr-2">{key}:</span> {val}
                {isCorrect && key === q.answer && (
                  <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                )}
                {showResult && userAnswer === key && userAnswer !== q.answer && (
                  <XCircleIcon className="w-5 h-5 text-red-400 ml-2" />
                )}
              </label>
            ))}
          </div>
          {showResult && (
            <div className="mt-4">
              {userAnswer === q.answer ? (
                <Alert icon={<CheckCircleIcon className="w-6 h-6" />}>
                  正解！
                </Alert>
              ) : (
                <Alert icon={<XCircleIcon className="w-6 h-6" />}>
                  不正解 (正解: {q.answer})
                </Alert>
              )}
              <div className="mt-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-200 text-base shadow-sm">
                <span className="font-bold">解説:</span> {q.explanation}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 下部固定ナビゲーション */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 dark:bg-gray-900 shadow-lg py-4 z-10 flex justify-center">
        <div className="flex justify-between items-center w-full max-w-5xl px-4">
          <Button
            onPress={handlePrev}
            disabled={currentIdx === 0}
            className={`flex items-center gap-1 ${
              currentIdx === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            style={{ color: '#2563eb', backgroundColor: '#fff', borderColor: '#d1d5db' }}
          >
            <ArrowLeftIcon className="w-5 h-5" /> 前の問題
          </Button>
          <Button
            variant="solid"
            color="primary"
            onPress={handleNext}
            disabled={currentIdx === filteredQuestions.length - 1}
            className={`flex items-center gap-1 ${
              currentIdx === filteredQuestions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            style={{ backgroundColor: '#2563eb', color: '#fff' }}
          >
            次の問題 <ArrowRightIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {/* 下部固定分の余白を追加 */}
      <div className="pb-28" />
    </div>
  );
}

export default App;
