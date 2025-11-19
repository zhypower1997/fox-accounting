'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCategoryIcon } from '@/constants/categories';
import ReceiptPoster from '@/components/ReceiptPoster';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [todaySummary, setTodaySummary] = useState({ income: 0, expense: 0 });
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [printProgress, setPrintProgress] = useState(100);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const startY = useRef(0);
  const scrollContainer = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const router = useRouter();

  const handleTransactionClick = (transaction: Transaction) => {
    // 如果是长按，不触发跳转
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    router.push(`/transaction?id=${transaction.id}`);
  };

  // 长按事件处理
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setShowPoster(true);
      // 触发震动反馈（如果设备支持）
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms后触发长按
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  // 从localStorage加载数据
  useEffect(() => {
    loadData();

    // 预加载音频
    audioRef.current = new Audio('/sounds/print.mp3');
    audioRef.current.volume = 0.4;
    audioRef.current.preload = 'auto';

    // 尝试自动播放音效
    const playAudio = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .then(() => {
            setAudioEnabled(true);
          })
          .catch((error) => {
            console.log(
              'Auto-play blocked, waiting for user interaction:',
              error,
            );
            setAudioEnabled(false);
          });
      }
    };

    // 延迟播放音效
    setTimeout(() => {
      playAudio();
    }, 100);

    // 创建小票打印效果
    let progress = 100;
    const interval = setInterval(() => {
      if (progress <= 0) {
        clearInterval(interval);
      } else {
        progress -= 2;
        setPrintProgress(progress);
      }
    }, 20);
    return () => clearInterval(interval);
  }, []);

  // 用户交互时启用音频
  const enableAudio = () => {
    if (audioRef.current && !audioEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => {
          setAudioEnabled(true);
        })
        .catch((error) => {
          console.log('Audio playback failed:', error);
        });
    }
  };

  const loadData = () => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      const parsedTransactions = JSON.parse(savedTransactions);
      setTransactions(parsedTransactions);
      calculateBalance(parsedTransactions);
      filterTodayTransactions(parsedTransactions);
    }
  };

  // 日期格式化和比较的辅助函数
  const normalizeDate = (dateStr: string): string => {
    // 将 2025/11/18 和 2025-11-18 都转换为标准格式进行比较
    if (dateStr.includes('/')) {
      return dateStr.replace(/\//g, '-');
    }
    return dateStr;
  };

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('zh-CN'); // 保持 2025/11/18 格式用于显示
  };

  const formatDateForStorage = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // 使用 2025-11-18 格式存储
  };

  const isSameDate = (date1: string, date2: string): boolean => {
    return normalizeDate(date1) === normalizeDate(date2);
  };

  const filterTodayTransactions = (transactions: Transaction[]) => {
    const today = formatDateForStorage(new Date());
    const todayTrans = transactions.filter((t) => isSameDate(t.date, today));
    setTodayTransactions(todayTrans);

    const summary = todayTrans.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') {
          acc.income += transaction.amount;
        } else {
          acc.expense += transaction.amount;
        }
        return acc;
      },
      { income: 0, expense: 0 },
    );

    setTodaySummary(summary);
  };

  const calculateBalance = (transactions: Transaction[]) => {
    const total = transactions.reduce((sum, transaction) => {
      return transaction.type === 'income'
        ? sum + transaction.amount
        : sum - transaction.amount;
    }, 0);
    setBalance(total);
  };

  // 下拉刷新相关事件处理
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollContainer.current && scrollContainer.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      scrollContainer.current &&
      scrollContainer.current.scrollTop === 0 &&
      startY.current > 0
    ) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - startY.current;

      if (distance > 0) {
        e.preventDefault();
        // 减小最大下拉距离和触发刷新的阈值
        setPullDistance(Math.min(distance * 0.3, 5));
        if (distance > 80) {
          setIsPulling(true);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (isPulling) {
      // 执行刷新
      setTimeout(() => {
        loadData();
        setIsPulling(false);
        setPullDistance(0);
        startY.current = 0;
      }, 500);
    } else {
      setPullDistance(0);
      startY.current = 0;
    }
  };

  const formatDate = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    return { day, monthDay: `${year}/${month}` };
  };

  const { day, monthDay } = formatDate();
  return (
    <div className="min-h-screen bg-gray-100 pb-24" onClick={enableAudio}>
      {/* 音频提示 */}
      {/* {!audioEnabled && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm z-50 shadow-lg">
          🔊 点击屏幕启用音效
        </div>
      )} */}
      <div className="max-w-md mx-auto p-6">
        {/* 日期显示 - 左上角 */}
        <div className="relative z-2 bg-white rounded-lg shadow-sm p-4 mb-4 w-24">
          <div className="text-3xl font-bold text-gray-900 text-center leading-tight">
            {day}
          </div>
          <div className="text-lg text-gray-600 text-center mt-1">
            {monthDay}
          </div>
        </div>
        <div className="absolute mb-6 bg-gray-100 overflow-hidden w-full h-[140px] z-1 top-0 left-0 right-0"></div>

        {/* 小票风格的交易记录卡片容器 */}
        <div
          className="relative"
          style={{
            transform: `translateY(${pullDistance - printProgress}%)`,
            transition: isPulling ? 'none' : 'transform 0.2s linear',
          }}
        >
          {pullDistance > 0 && (
            <div
              className="flex justify-center items-center bg-gray-100 rounded-t-lg"
              style={{
                height: `${Math.min(pullDistance, 20)}px`,
                marginBottom: '15px',
              }}
            >
              <div className="text-gray-400 text-xs">
                {isPulling ? '🔄 松开刷新' : '↓ 下拉刷新'}
              </div>
            </div>
          )}

          <div
            ref={scrollContainer}
            className="bg-white rounded-lg shadow-md overflow-hidden relative"
            onTouchStart={(e) => {
              handleTouchStart(e);
              handleLongPressStart(e);
            }}
            onTouchMove={(e) => {
              handleTouchMove(e);
              handleLongPressEnd();
            }}
            onTouchEnd={(e) => {
              handleTouchEnd();
              handleLongPressEnd();
            }}
            onMouseDown={handleLongPressStart}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            style={{
              maxHeight: '60vh',
              overflowY: 'auto',
              clipPath:
                'polygon(0% 0%, 100% 0%, 100% calc(100% - 4px), 97.5% 100%, 95% calc(100% - 4px), 92.5% 100%, 90% calc(100% - 4px), 87.5% 100%, 85% calc(100% - 4px), 82.5% 100%, 80% calc(100% - 4px), 77.5% 100%, 75% calc(100% - 4px), 72.5% 100%, 70% calc(100% - 4px), 67.5% 100%, 65% calc(100% - 4px), 62.5% 100%, 60% calc(100% - 4px), 57.5% 100%, 55% calc(100% - 4px), 52.5% 100%, 50% calc(100% - 4px), 47.5% 100%, 45% calc(100% - 4px), 42.5% 100%, 40% calc(100% - 4px), 37.5% 100%, 35% calc(100% - 4px), 32.5% 100%, 30% calc(100% - 4px), 27.5% 100%, 25% calc(100% - 4px), 22.5% 100%, 20% calc(100% - 4px), 17.5% 100%, 15% calc(100% - 4px), 12.5% 100%, 10% calc(100% - 4px), 7.5% 100%, 5% calc(100% - 4px), 2.5% 100%, 0% calc(100% - 4px))',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div
              className="p-6 pt-6"
              style={{
                fontFamily: "'Courier New', monospace",
              }}
            >
              {/* 交易列表 */}
              <div className="space-y-3 mb-4">
                {todayTransactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p>今天还没有记账</p>
                  </div>
                ) : (
                  todayTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleTransactionClick(transaction)}
                      style={{
                        letterSpacing: '0.03em',
                        borderBottom: '1px dotted rgba(0,0,0,0.05)',
                      }}
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-8 h-8 flex items-center justify-center mr-3">
                          {getCategoryIcon(transaction.category)}
                        </div>
                        <div
                          className="font-medium text-gray-800"
                          style={{ fontFamily: "'Courier New', monospace" }}
                        >
                          {transaction.category}
                        </div>
                      </div>
                      <div
                        className="text-gray-600 mx-4"
                        style={{ fontFamily: "'Courier New', monospace" }}
                      >
                        x1
                      </div>
                      <div
                        className={`font-medium ${
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                        style={{
                          fontFamily: "'Courier New', monospace",
                          textAlign: 'right',
                          minWidth: '80px',
                        }}
                      >
                        {transaction.type === 'income' ? '+' : '-'}¥
                        {transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 今日支出 */}
              <div className="flex justify-between items-center mb-2">
                <div
                  className="font-medium text-gray-800"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  今日支出
                </div>
                <div
                  className="font-bold text-gray-900"
                  style={{
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: '0.05em',
                  }}
                >
                  ¥{todaySummary.expense.toFixed(2)}
                </div>
              </div>

              {/* 虚线分隔 */}
              <div
                className="my-4 text-center text-gray-300"
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: '8px',
                  letterSpacing: '2px',
                }}
              >
                - - - - - - - - - - - - - - - -
              </div>

              {/* 今日结余 */}
              <div className="flex justify-between items-center">
                <div
                  className="text-lg font-medium text-gray-800"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  今日结余
                </div>
                <div
                  className={`text-2xl font-bold ${
                    todaySummary.income - todaySummary.expense >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                  style={{
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: '0.05em',
                  }}
                >
                  {todaySummary.income - todaySummary.expense >= 0 ? '' : '-'}¥
                  {Math.abs(todaySummary.income - todaySummary.expense).toFixed(
                    2,
                  )}
                </div>
              </div>
              {/* 底部装饰 */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div
                  className="text-center text-gray-400 text-sm"
                  style={{
                    fontFamily: "'Courier New', monospace",
                    letterSpacing: '0.05em',
                  }}
                >
                  *** 小票时光机 ***
                </div>
                <div
                  className="mt-1 text-center text-gray-400 text-xs"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  {new Date().toLocaleDateString('zh-CN')}{' '}
                  {new Date().toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 海报弹窗 */}
      <ReceiptPoster
        isOpen={showPoster}
        onClose={() => setShowPoster(false)}
        transactions={todayTransactions}
        todaySummary={todaySummary}
        getCategoryIcon={getCategoryIcon}
      />

      {/* 底部导航按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 shadow-lg">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {/* 账单按钮 */}
          <Link href="/records" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
              <img src="/images/icons/账单.png" className="w-10" alt="" />
            </div>
            <span className="text-xs text-gray-600">账单</span>
          </Link>

          {/* 记账按钮 - 最大 */}
          <Link href="/add" className="flex flex-col items-center -mt-6">
            <div className="w-20 h-20 bg-[#f66e4e] rounded-full flex items-center justify-center shadow-lg mb-2">
              <span className="text-3xl text-white">+</span>
            </div>
          </Link>

          {/* 分析按钮 */}
          <Link href="/analysis" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
              <img src="/images/icons/分析.png" className="w-10" alt="" />
            </div>
            <span className="text-xs text-gray-600">分析</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
