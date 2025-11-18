'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BackButton from '@/components/BackButton';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function AddDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const category = searchParams.get('category');
  const type = searchParams.get('type') as 'income' | 'expense';

  useEffect(() => {
    if (!category || !type) {
      router.push('/add');
    }
  }, [category, type, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category) return;

    // 获取现有交易记录
    const savedTransactions = localStorage.getItem('transactions');
    const existingTransactions = savedTransactions
      ? JSON.parse(savedTransactions)
      : [];

    // 创建新交易
    const formatDateForStorage = (date: Date): string => {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`; // 使用 2025-11-18 格式存储
    };

    const newTransaction = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category,
      description,
      date: formatDateForStorage(selectedDate),
    };

    // 保存交易
    const updatedTransactions = [...existingTransactions, newTransaction];
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

    // 返回首页
    router.push('/');
  };

  if (!category || !type) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <BackButton variant="minimal" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900">
            记账详情
          </h1>
          <p className="text-center text-gray-600 mt-1">
            {type === 'income' ? '收入' : '支出'} - {category}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          {/* 金额输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              金额
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">
                ¥
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-2xl border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
                autoFocus
              />
            </div>
          </div>

          {/* 描述输入 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述（可选）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="添加备注..."
              rows={3}
            />
          </div>

          {/* 日期选择 */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日期
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                if (date) setSelectedDate(date);
              }}
              dateFormat="yyyy-MM-dd"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!amount}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                amount
                  ? type === 'income'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              保存
            </button>
          </div>
        </form>

        {/* 快捷金额按钮 */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">快捷金额</h3>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 50, 100, 200, 500, 1000, 2000].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value.toString())}
                className="py-2 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                ¥{value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddDetails() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">加载中...</div>
        </div>
      }
    >
      <AddDetailsContent />
    </Suspense>
  );
}
