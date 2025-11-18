'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

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
  const startY = useRef(0);
  const scrollContainer = useRef<HTMLDivElement>(null);

  // 从localStorage加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      const parsedTransactions = JSON.parse(savedTransactions);
      setTransactions(parsedTransactions);
      calculateBalance(parsedTransactions);
      filterTodayTransactions(parsedTransactions);
    }
  };

  const filterTodayTransactions = (transactions: Transaction[]) => {
    const today = new Date().toLocaleDateString('zh-CN');
    const todayTrans = transactions.filter((t) => t.date === today);
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
        // 进一步减小最大下拉距离和触发刷新的阈值
        setPullDistance(Math.min(distance * 0.4, 40));
        if (distance > 35) {
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
    return { day, monthDay: `${month}/${day}` };
  };

  const { day, monthDay } = formatDate();
  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="max-w-md mx-auto p-6">
        {/* 日期显示 - 左上角 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 w-32">
          <div className="text-5xl font-bold text-gray-900 text-center leading-tight">
            {day}
          </div>
          <div className="text-lg text-gray-600 text-center mt-1">
            {monthDay}
          </div>
        </div>

        {/* 小票风格的交易记录卡片容器 */}
        <div
          className="relative"
          style={{
            transform: `translateY(${pullDistance}px)`,
            transition: isPulling ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {pullDistance > 0 && (
            <div
              className="flex justify-center items-center bg-gray-100 rounded-t-lg"
              style={{
                height: `${Math.min(pullDistance, 30)}px`,
                marginBottom: '0px',
              }}
            >
              <div className="text-gray-400 text-xs">
                {isPulling ? '🔄 松开刷新' : '↓ 下拉刷新'}
              </div>
            </div>
          )}

          <div
            ref={scrollContainer}
            className="bg-white rounded-lg shadow-md overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="p-6">
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
                      className="flex justify-between items-center py-2"
                    >
                      <div className="flex-1 font-medium text-gray-900">
                        {transaction.category}
                      </div>
                      <div className="text-gray-600 mx-4">1</div>
                      <div
                        className={`font-medium ${
                          transaction.type === 'income'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}¥
                        {transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 虚线分隔 */}
              <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

              {/* 今日支出 */}
              <div className="flex justify-between items-center py-2 mb-2">
                <div className="font-medium text-gray-900">今日支出</div>
                <div className="font-bold text-gray-900">
                  ¥{todaySummary.expense.toFixed(2)}
                </div>
              </div>

              {/* 虚线分隔 */}
              <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

              {/* 今日结余 */}
              <div className="flex justify-between items-center py-3">
                <div className="text-lg font-medium text-gray-900">
                  今日结余
                </div>
                <div
                  className={`text-2xl font-bold ${
                    todaySummary.income - todaySummary.expense >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {todaySummary.income - todaySummary.expense >= 0 ? '' : '-'}¥
                  {Math.abs(todaySummary.income - todaySummary.expense).toFixed(
                    2,
                  )}
                </div>
              </div>
              {/* 底部装饰 */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-center text-gray-400 text-sm">
                  小票时光机
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部导航按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {/* 账单按钮 */}
          <Link href="/records" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-1">
              <span className="text-2xl">📋</span>
            </div>
            <span className="text-xs text-gray-600">账单</span>
          </Link>

          {/* 记账按钮 - 最大 */}
          <Link href="/add" className="flex flex-col items-center -mt-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-2">
              <span className="text-3xl text-white">➕</span>
            </div>
            <span className="text-sm font-medium text-gray-900">记账</span>
          </Link>

          {/* 分析按钮 */}
          <Link href="/analysis" className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-1">
              <span className="text-2xl">📊</span>
            </div>
            <span className="text-xs text-gray-600">分析</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
