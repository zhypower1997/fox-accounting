'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BackButton from '@/components/BackButton';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

// 分类图标配置（与首页保持一致）
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
export default function Records() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  // 获取今天的日期字符串 (yyyy-mm-dd 格式)
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [filterType, setFilterType] = useState('all');

  // 日期格式化和比较的辅助函数
  const normalizeDate = (dateStr: string): string => {
    // 将 2025/11/18 和 2025-11-18 都转换为标准格式进行比较
    if (dateStr.includes('/')) {
      return dateStr.replace(/\//g, '-');
    }
    return dateStr;
  };

  const isSameDate = (date1: string, date2: string): boolean => {
    return normalizeDate(date1) === normalizeDate(date2);
  };

  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      const parsedTransactions = JSON.parse(savedTransactions);
      setTransactions(parsedTransactions);
      setFilteredTransactions(parsedTransactions);
    }
  }, []);

  useEffect(() => {
    let filtered = transactions;

    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (selectedDate) {
      filtered = filtered.filter((t) => isSameDate(t.date, selectedDate));
    }

    setFilteredTransactions(filtered);
  }, [transactions, filterType, selectedDate]);

  const deleteTransaction = (id: string) => {
    const newTransactions = transactions.filter((t) => t.id !== id);
    setTransactions(newTransactions);
    localStorage.setItem('transactions', JSON.stringify(newTransactions));
  };

  const getTotal = (type: 'income' | 'expense') => {
    return filteredTransactions
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + t.amount, 0);
  };
  const formatDate = (dateStr: string) => {
    try {
      // 处理不同的日期格式
      const normalizedDate = normalizeDate(dateStr);

      // 如果是 yyyy-mm-dd 格式，直接返回
      if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
        return normalizedDate;
      }

      const date = new Date(normalizedDate);

      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return dateStr; // 如果日期无效，返回原字符串
      }

      // 格式化为 yyyy-mm-dd
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      return dateStr; // 出错时返回原字符串
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <BackButton variant="minimal" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900">
            账单记录
          </h1>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="max-w-md mx-auto p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                filterType === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                filterType === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              收入
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                filterType === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              支出
            </button>
          </div>

          <div className="relative flex gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 text-sm font-medium"
              title="查看今天"
            >
              今天
            </button>
            {selectedDate !== getTodayDateString() && (
              <button
                onClick={() => setSelectedDate('')}
                className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium"
                title="查看全部"
              >
                全部
              </button>
            )}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-sm text-green-600">总收入</div>
            <div className="text-lg font-bold text-green-700">
              +¥{getTotal('income').toFixed(2)}
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center">
            <div className="text-sm text-red-600">总支出</div>
            <div className="text-lg font-bold text-red-700">
              -¥{getTotal('expense').toFixed(2)}
            </div>
          </div>
        </div>

        {/* 交易列表 */}
        <div className="space-y-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">📋</div>
              <p>暂无交易记录</p>
              <Link
                href="/add"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                去记账
              </Link>
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`p-4 rounded-xl border-l-4 ${
                  transaction.type === 'income'
                    ? 'border-green-400 bg-white'
                    : 'border-red-400 bg-white'
                } shadow-sm`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 flex items-center justify-center">
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <span className="font-medium text-gray-900">
                        {transaction.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {transaction.description || '无描述'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(transaction.date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div
                      className={`text-right ${
                        transaction.type === 'income'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      <div className="font-bold text-lg">
                        {transaction.type === 'income' ? '+' : '-'}¥
                        {transaction.amount.toFixed(2)}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTransaction(transaction.id)}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="删除"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
