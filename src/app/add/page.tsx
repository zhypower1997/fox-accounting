'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { categories } from '@/constants/categories';
import QuickEntryPanel from '@/components/QuickEntryPanel';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

export default function AddTransaction() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>(
    'expense',
  );
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowQuickEntry(true);
  };

  const handleQuickEntrySubmit = (
    amount: number,
    description: string,
    category: string,
    type: 'income' | 'expense',
  ) => {
    // 获取现有交易记录
    const savedTransactions = localStorage.getItem('transactions');
    const transactions: Transaction[] = savedTransactions
      ? JSON.parse(savedTransactions)
      : [];

    // 创建新交易
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount,
      category,
      description,
      date: formatDateForStorage(new Date()),
    };

    // 保存到本地存储
    const updatedTransactions = [newTransaction, ...transactions];
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

    // 返回首页
    router.push('/');
  };

  const formatDateForStorage = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 获取所有分类名称用于分类选择器
  const categoryNames = categories.map((cat) => cat.name);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <BackButton variant="minimal" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900">
            选择分类
          </h1>
        </div>
      </div>

      {/* 类型选择 */}
      <div className="max-w-md mx-auto p-4">
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setSelectedType('expense')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedType === 'expense'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            支出
          </button>
          <button
            onClick={() => setSelectedType('income')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              selectedType === 'income'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            收入
          </button>
        </div>

        {/* 分类网格 */}
        <div className="grid grid-cols-3 gap-3">
          {categories
            .filter((cat) => cat.type === selectedType)
            .map((category) => (
              <button
                key={category.name}
                onClick={() => handleCategorySelect(category.name)}
                className={`p-4 rounded-xl flex flex-col items-center justify-center transition-all hover:scale-105 ${category.color}`}
              >
                <img src={category.icon} alt="" className="w-10 h-10 mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  {category.name}
                </span>
              </button>
            ))}
        </div>

        {/* 快速记账面板 */}
        <QuickEntryPanel
          isOpen={showQuickEntry}
          onClose={() => setShowQuickEntry(false)}
          selectedCategory={selectedCategory}
          initialType={selectedType}
          onSubmit={handleQuickEntrySubmit}
          categories={categoryNames}
        />
      </div>
    </div>
  );
}
