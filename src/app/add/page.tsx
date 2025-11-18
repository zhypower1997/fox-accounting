'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { categories } from '@/constants/categories';

export default function AddTransaction() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>(
    'expense',
  );

  const handleCategorySelect = (category: string) => {
    router.push(
      `/add/details?category=${encodeURIComponent(
        category,
      )}&type=${selectedType}`,
    );
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
      </div>
    </div>
  );
}
