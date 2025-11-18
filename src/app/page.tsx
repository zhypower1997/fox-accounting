'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

// 分类图标配置（与 add/page.tsx 保持一致）
const categories = [
  {
    type: 'expense',
    name: '餐饮',
    icon: '/images/icons/番茄.png',
    color: 'bg-red-100',
  },
  {
    type: 'expense',
    name: '交通',
    icon: '/images/icons/萝卜.png',
    color: 'bg-blue-100',
  },
  {
    type: 'expense',
    name: '购物',
    icon: '/images/icons/萝卜丝.png',
    color: 'bg-purple-100',
  },
  {
    type: 'expense',
    name: '娱乐',
    icon: '/images/icons/萝卜块.png',
    color: 'bg-pink-100',
  },
  {
    type: 'expense',
    name: '医疗',
    icon: '/images/icons/萝卜片.png',
    color: 'bg-green-100',
  },
  {
    type: 'expense',
    name: '教育',
    icon: '/images/icons/葱.png',
    color: 'bg-yellow-100',
  },
  {
    type: 'income',
    name: '工资',
    icon: '/images/icons/鸡蛋.png',
    color: 'bg-green-100',
  },
  { type: 'income', name: '奖金', icon: '🎁', color: 'bg-blue-100' },
  { type: 'income', name: '投资', icon: '📈', color: 'bg-purple-100' },
  { type: 'income', name: '其他收入', icon: '💸', color: 'bg-gray-100' },
];

// 根据分类名称获取图标
const getCategoryIcon = (categoryName: string) => {
  const category = categories.find((cat) => cat.name === categoryName);

  if (category) {
    // 判断是图片路径还是emoji
    if (category.icon.startsWith('/')) {
      return (
        <img
          src={category.icon}
          alt={categoryName}
          width={24}
          height={24}
          className="rounded-full"
        />
      );
    } else {
      return <span className="text-xl">{category.icon}</span>;
    }
  }

  // 默认图标
  return <span className="text-xl">💸</span>;
};

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [todaySummary, setTodaySummary] = useState({ income: 0, expense: 0 });
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const scrollContainer = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleTransactionClick = (transaction: Transaction) => {
    router.push(`/transaction?id=${transaction.id}`);
  };

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
    const year = now.getFullYear().toString().slice(-2);
    return { day, monthDay: `${year}/${month}` };
  };

  const { day, monthDay } = formatDate();
  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      <div className="max-w-md mx-auto p-6">
        {/* 日期显示 - 左上角 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 w-24">
          <div className="text-3xl font-bold text-gray-900 text-center leading-tight">
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
            className="bg-white rounded-lg shadow-md overflow-hidden relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
          >
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
              <span className="text-3xl text-white">+</span>
            </div>
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
