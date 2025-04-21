'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  XCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/20/solid';
import { Button } from '@heroui/react';
import './App.css';
import FilterComponent from './components/filterComponent';
import { useCategoryStore } from './store/categoryStore';
import SuccessComponent from './components/successComponent';
import AnswerComponent from './components/answerComponent';
import { motion } from 'framer-motion';

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
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [correctlyAnsweredIds, setCorrectlyAnsweredIds] = useState<Set<string>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Zustand storeからカテゴリ状態を取得
  const {
    categories,
    selectedCategories,
    toggleCategory,
    loadFromStorage,
  } = useCategoryStore();

  // useMemoで最新の値を計算
  const correctCount = useMemo(
    () => filteredQuestions.filter((q) => correctlyAnsweredIds.has(q.id)).length,
    [filteredQuestions, correctlyAnsweredIds]
  );
  const totalCount = useMemo(() => filteredQuestions.length, [filteredQuestions]);
  const displayIdx = useMemo(() => Math.min(currentIdx + 1, totalCount), [currentIdx, totalCount]);

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

  // 初期カテゴリ選択状態をlocalStorageから復元
  useEffect(() => {
    fetch('questions.json')
      .then((res) => {
        if (!res.ok) throw new Error('questions.jsonの取得に失敗');
        return res.json();
      })
      .then((data) => {
        setQuestions(data);
        const cats = [...new Set(data.map((q: { category: string; }) => q.category))].sort();
        // Zustand storeにカテゴリをセットし、localStorageから選択状態を復元
        loadFromStorage(cats as string[]);
        setLoading(false);
      })
      .catch(() => {
        setError(
          '問題データの読み込みに失敗しました。questions.jsonの配置・形式を確認してください。',
        );
        setLoading(false);
      });
  }, [setQuestions, loadFromStorage]);

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

  // 質問がない場合の処理 
  // 削除: filteredQuestions.length === 0 のときに状態を初期化する処理
  // if (filteredQuestions.length === 0) {
  //   setSelectedCategories(categories);
  //   setFilteredQuestions(shuffleArray([...questions]));
  //   setCurrentIdx(0);
  //   setShowResult(false);
  //   setUserAnswers({});
  // }

  // filteredQuestionsが空でなければqを取得
  const q = filteredQuestions.length > 0 ? filteredQuestions[currentIdx] : undefined;
  const isCorrect = q ? correctlyAnsweredIds.has(q.id) : false;
  const userAnswer = q ? userAnswers[q.id] : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 flex justify-center">
      {/* お祝いモーダル */}
      <SuccessComponent show={showCelebration} onClose={() => setShowCelebration(false)} />
      <div className="w-full max-w-5xl mx-auto p-2 sm:p-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4 sm:mb-6 text-center flex items-center justify-center gap-2 sm:gap-3 drop-shadow-sm">
          <img
            src="https://img.icons8.com/user"
            alt="logo"
            className="w-8 h-8 sm:w-10 sm:h-10 inline-block animate-spin-slow"
          />
          Google Cloud DevOps Engineer 練習問題
        </h2>
        <div className="flex flex-col md:flex-row md:justify-between items-stretch md:items-center bg-white dark:bg-gray-800 p-3 sm:p-5 rounded-2xl mb-4 sm:mb-6 shadow-lg backdrop-blur-sm w-full max-w-3xl mx-auto gap-4">
          <FilterComponent
            categories={categories}
            selectedCategories={selectedCategories}
            onCategoryChange={toggleCategory}
          />
          <div className="flex flex-row md:flex-col gap-2 md:mt-0 md:w-auto md:items-start w-full">
            <Button
              color="primary"
              onPress={handleShuffle}
              className="flex-1 flex items-center justify-center gap-2 border-solid border-2 border-gray-300 dark:border-gray-600 px-2 py-2 sm:px-4"
              style={{ color: '#2563eb', backgroundColor: '#fff', borderColor: '#d1d5db' }}
            >
              <ArrowPathIcon className="w-4 h-4" />
              シャッフル
            </Button>
            <Button
              color="danger"
              onPress={handleReset}
              className="flex-1 flex items-center justify-center gap-2 border-solid border-2 border-gray-300 dark:border-gray-600 px-2 py-2 sm:px-4"
              style={{ color: '#2563eb', backgroundColor: '#fff', borderColor: '#d1d5db' }}
            >
              <XCircleIcon className="w-4 h-4" />
              進捗リセット
            </Button>
          </div>
        </div>
        {/* フィルターが空 or 問題が0件の場合はメイン非表示 */}
        {selectedCategories.length === 0 || filteredQuestions.length === 0 ? (
          <div className="bg-white/90 dark:bg-gray-900 p-4 sm:p-8 rounded-2xl shadow-xl mb-4 sm:mb-6 border border-gray-100 dark:border-gray-700 text-center text-base sm:text-lg text-gray-500 dark:text-gray-300 w-full max-w-3xl mx-auto">
            フィルターの内容物がありません
          </div>
        ) : (
          <>
            <div className="bg-white/80 dark:bg-gray-800 p-2 sm:p-4 rounded-2xl shadow flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 w-full max-w-3xl mx-auto gap-2">
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                スコア: <span className="text-blue-600 dark:text-blue-400">{correctCount}</span> /{' '}
                {totalCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {displayIdx} / {totalCount} 問題
              </span>
            </div>
            {/* Add this after the score display div */}
            <div className="w-full max-w-3xl mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4 sm:mb-6 overflow-hidden">
              <motion.div
                className="bg-blue-600 h-2.5 rounded-full"
                animate={{
                  width:
                    totalCount > 1
                      ? `${(currentIdx / (totalCount - 1)) * 100}%`
                      : totalCount === 1
                      ? '100%'
                      : '0%',
                }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
            <div className="bg-white/90 dark:bg-gray-900 p-4 sm:p-8 rounded-2xl shadow-xl mb-4 sm:mb-6 animate-fade-in border border-gray-100 dark:border-gray-700 w-full max-w-3xl mx-auto">
              {/* qが存在する場合のみ表示 */}
              {q && (
                <AnswerComponent
                  question={q}
                  userAnswer={userAnswer}
                  isCorrect={isCorrect}
                  showResult={showResult}
                  onAnswer={handleAnswer}
                />
              )}
            </div>
          </>
        )}
      </div>
      {/* 下部固定ナビゲーション */}
      {selectedCategories.length > 0 && filteredQuestions.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full flex justify-center bg-white/90 dark:bg-gray-900 shadow-lg py-2 sm:py-4 z-10">
          <div className="flex flex-row justify-between items-center w-full max-w-5xl px-2 sm:px-4 gap-2">
            <Button
              onPress={handlePrev}
              disabled={currentIdx === 0}
              className={`flex-1 flex items-center justify-center gap-1 ${
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
              className={`flex-1 flex items-center justify-center gap-1 ${
                currentIdx === filteredQuestions.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              style={{ backgroundColor: '#2563eb', color: '#fff' }}
            >
              次の問題 <ArrowRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
      {/* 下部固定分の余白を追加 */}
      <div className="pb-24 sm:pb-28" />
    </div>
  );
}

export default App;
