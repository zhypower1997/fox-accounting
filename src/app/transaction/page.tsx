'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import BackButton from '@/components/BackButton';
import { categories, getCategoryIcon } from '@/constants/categories';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

function TransactionDetailContent() {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  // 日期格式化和转换的辅助函数
  const normalizeDate = (dateStr: string): string => {
    // 将 2025/11/18 和 2025-11-18 都转换为标准格式进行比较
    if (dateStr.includes('/')) {
      return dateStr.replace(/\//g, '-');
    }
    return dateStr;
  };

  const formatDateForStorage = (dateStr: string): string => {
    // 确保日期格式为 yyyy-MM-dd
    return normalizeDate(dateStr);
  };

  useEffect(() => {
    if (!id) {
      router.push('/');
      return;
    }

    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      const parsedTransactions: Transaction[] = JSON.parse(savedTransactions);
      const foundTransaction = parsedTransactions.find((t) => t.id === id);
      if (foundTransaction) {
        setTransaction(foundTransaction);
      } else {
        // 如果找不到交易记录，返回首页
        router.push('/');
      }
    }
  }, [id, router]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (transaction) {
      // 确保日期格式一致性
      const updatedTransaction = {
        ...transaction,
        date: formatDateForStorage(transaction.date),
      };

      const savedTransactions = localStorage.getItem('transactions');
      if (savedTransactions) {
        const parsedTransactions: Transaction[] = JSON.parse(savedTransactions);
        const updatedTransactions = parsedTransactions.map((t) =>
          t.id === transaction.id ? updatedTransaction : t,
        );
        localStorage.setItem(
          'transactions',
          JSON.stringify(updatedTransactions),
        );
      }
      setTransaction(updatedTransaction);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (transaction && window.confirm('确定要删除这条记录吗？')) {
      const savedTransactions = localStorage.getItem('transactions');
      if (savedTransactions) {
        const parsedTransactions: Transaction[] = JSON.parse(savedTransactions);
        const updatedTransactions = parsedTransactions.filter(
          (t) => t.id !== transaction.id,
        );
        localStorage.setItem(
          'transactions',
          JSON.stringify(updatedTransactions),
        );
      }
      router.push('/');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    if (transaction) {
      let value = e.target.value;
      // 处理amount字段为数字类型
      if (e.target.name === 'amount' && typeof value === 'string') {
        value = parseFloat(value).toString();
      }

      setTransaction({
        ...transaction,
        [e.target.name]: value,
      });
    }
  };

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="animate-pulse text-gray-500">载入中...</div>
        </div>
      </div>
    );
  }

  // 使用从常量导入的 getCategoryIcon 函数

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* 头部 */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-md mx-auto relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <BackButton variant="minimal" />
          </div>
          <h1 className="text-xl font-bold text-center text-gray-900">
            {isEditing ? '编辑交易' : '交易详情'}
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* 分类和金额 */}
          <div className="mb-6">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 flex items-center justify-center mr-3">
                {getCategoryIcon(transaction.category)}
              </div>
              {isEditing ? (
                <select
                  name="category"
                  value={transaction.category}
                  onChange={handleChange}
                  className="flex-1 border rounded-lg p-2 text-lg"
                >
                  {categories
                    .filter((cat) => cat.type === transaction.type)
                    .map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              ) : (
                <span className="text-xl font-medium">
                  {transaction.category}
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-1">金额</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={transaction.amount}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-3 text-xl font-bold"
                />
              </div>
            ) : (
              <div
                className={`text-2xl font-bold mt-3 ${
                  transaction.type === 'income'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}¥
                {transaction.amount.toFixed(2)}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* 交易类型 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                交易类型
              </label>
              {isEditing ? (
                <div className="flex gap-3 mb-2">
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      transaction.type === 'expense'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() =>
                      setTransaction({ ...transaction, type: 'expense' })
                    }
                  >
                    支出
                  </button>
                  <button
                    className={`flex-1 py-2 px-4 rounded-lg ${
                      transaction.type === 'income'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                    onClick={() =>
                      setTransaction({ ...transaction, type: 'income' })
                    }
                  >
                    收入
                  </button>
                </div>
              ) : (
                <div className="py-2 px-3 bg-gray-100 rounded-lg">
                  {transaction.type === 'income' ? (
                    <span className="text-green-600">收入</span>
                  ) : (
                    <span className="text-red-600">支出</span>
                  )}
                </div>
              )}
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">备注</label>
              {isEditing ? (
                <textarea
                  name="description"
                  value={transaction.description}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-3 min-h-[80px]"
                  placeholder="添加备注..."
                />
              ) : (
                <div className="py-2 px-3 bg-gray-100 rounded-lg min-h-[40px]">
                  {transaction.description || (
                    <span className="text-gray-400">无备注</span>
                  )}
                </div>
              )}
            </div>

            {/* 日期 */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">日期</label>
              {isEditing ? (
                <input
                  type="date"
                  name="date"
                  value={transaction.date}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-3"
                />
              ) : (
                <div className="py-2 px-3 bg-gray-100 rounded-lg">
                  {transaction.date}
                </div>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mt-8 flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium"
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium"
                >
                  编辑
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium"
                >
                  删除
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionDetail() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="animate-pulse text-gray-500">载入中...</div>
          </div>
        </div>
      }
    >
      <TransactionDetailContent />
    </Suspense>
  );
}
