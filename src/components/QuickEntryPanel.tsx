'use client';

import React, { useState, useEffect } from 'react';
import { getCategoryIcon } from '@/constants/categories';

interface QuickEntryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  initialAmount?: number;
  initialDescription?: string;
  initialType?: 'income' | 'expense';
  transactionId?: string;
  onSubmit: (
    amount: number,
    description: string,
    category: string,
    type: 'income' | 'expense',
    transactionId?: string,
  ) => void;
  onDelete?: (transactionId: string) => void;
  categories: string[];
}

const QuickEntryPanel: React.FC<QuickEntryPanelProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  initialAmount,
  initialDescription,
  initialType,
  transactionId,
  onSubmit,
  onDelete,
  categories,
}) => {
  const [amount, setAmount] = useState(
    initialAmount ? initialAmount.toString() : '',
  );
  const [description, setDescription] = useState(initialDescription || '');
  const [type, setType] = useState<'income' | 'expense'>(
    initialType || 'expense',
  );
  const [category, setCategory] = useState(selectedCategory);
  const [isVisible, setIsVisible] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [calculatorExpression, setCalculatorExpression] = useState('');

  // 重置状态当面板关闭时，或者当初始值改变时
  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setDescription('');
      setType('expense');
      setCategory(selectedCategory);
      setIsVisible(false);
      setShowCategorySelector(false);
      setCalculatorExpression('');
    } else {
      if (initialAmount !== undefined) {
        setAmount(initialAmount.toString());
        setDescription(initialDescription || '');
        setCalculatorExpression(initialAmount.toString());
      }
      if (initialType) {
        setType(initialType);
      }
      setCategory(selectedCategory);
      // 添加延迟来触发动画
      setTimeout(() => setIsVisible(true), 10);
    }
  }, [
    isOpen,
    initialAmount,
    initialDescription,
    initialType,
    selectedCategory,
  ]);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNumberClick = (num: string) => {
    if (num === '.' && amount.includes('.')) return;

    let newAmount;
    if (amount === '0' && num !== '.') {
      newAmount = num;
    } else {
      newAmount = amount + num;
    }

    setAmount(newAmount);

    // 更新表达式显示
    if (calculatorExpression === '') {
      setCalculatorExpression(newAmount);
    } else {
      // 如果表达式已存在，更新最后一个数字部分
      const parts = calculatorExpression.split(/([+\-])/);
      if (parts.length > 1) {
        parts[parts.length - 1] = newAmount;
        setCalculatorExpression(parts.join(''));
      } else {
        setCalculatorExpression(newAmount);
      }
    }
  };

  const handleDeleteInput = () => {
    const newAmount = amount.slice(0, -1);
    setAmount(newAmount);

    // 更新表达式显示
    if (calculatorExpression !== '') {
      const parts = calculatorExpression.split(/([+\-])/);
      if (parts.length > 1) {
        parts[parts.length - 1] = newAmount;
        setCalculatorExpression(parts.join(''));
      } else {
        setCalculatorExpression(newAmount);
      }
    }
  };

  const handleCalculatorOperation = (operation: '+' | '-') => {
    if (amount === '') return;

    // 添加操作符到表达式
    setCalculatorExpression((prev) => prev + operation);

    // 清空当前输入，准备输入下一个数字
    setAmount('');
  };

  const handleSubmit = () => {
    let finalAmount = 0;

    // 如果有表达式，计算结果
    if (calculatorExpression !== '') {
      try {
        // 简单的表达式计算
        const expression = calculatorExpression;
        const parts = expression.split(/([+\-])/);

        if (parts.length === 1) {
          // 只有一个数字
          finalAmount = parseFloat(parts[0]) || 0;
        } else {
          // 有运算符的表达式
          finalAmount = parseFloat(parts[0]) || 0;
          for (let i = 1; i < parts.length; i += 2) {
            const operator = parts[i];
            const value = parseFloat(parts[i + 1]) || 0;

            if (operator === '+') {
              finalAmount += value;
            } else if (operator === '-') {
              finalAmount -= value;
            }
          }
        }
      } catch (error) {
        console.error('计算错误:', error);
        finalAmount = parseFloat(amount) || 0;
      }
    } else {
      finalAmount = parseFloat(amount) || 0;
    }

    if (!isNaN(finalAmount) && finalAmount > 0) {
      onSubmit(finalAmount, description, category, type, transactionId);
      onClose();
    }
  };

  const handleDeleteTransaction = () => {
    if (transactionId && onDelete) {
      onDelete(transactionId);
      onClose();
    }
  };

  const handleQuickReentry = () => {
    // 计算表达式结果
    let finalAmount = 0;
    if (calculatorExpression !== '') {
      try {
        const parts = calculatorExpression.split(/([+\-])/);
        if (parts.length === 1) {
          finalAmount = parseFloat(parts[0]) || 0;
        } else {
          finalAmount = parseFloat(parts[0]) || 0;
          for (let i = 1; i < parts.length; i += 2) {
            const operator = parts[i];
            const value = parseFloat(parts[i + 1]) || 0;
            if (operator === '+') {
              finalAmount += value;
            } else if (operator === '-') {
              finalAmount -= value;
            }
          }
        }
      } catch (error) {
        finalAmount = parseFloat(amount) || 0;
      }
    } else {
      finalAmount = parseFloat(amount) || 0;
    }

    if (!isNaN(finalAmount) && finalAmount > 0) {
      onSubmit(finalAmount, description, category, type);
      setAmount('');
      setDescription('');
      setCalculatorExpression('');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // 等待动画完成
  };

  const handleCancel = () => {
    setAmount('');
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  const displayAmount = calculatorExpression
    ? `${type === 'income' ? '+' : '-'}¥${calculatorExpression}`
    : '¥0.00';

  return (
    <>
      {/* 遮罩层 */}
      <div
        className={`fixed inset-0 bg-[rgba(0,0,0,0.8)] z-40 transition-opacity duration-300 ${
          isVisible ? 'bg-opacity-20' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* 浮层面板 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl shadow-xl transition-transform duration-300 ease-out ${
          isVisible ? 'transform translate-y-0' : 'transform translate-y-full'
        }`}
      >
        {/* 顶部选中的分类 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 flex items-center justify-center mr-3">
              {getCategoryIcon(category)}
            </div>
            <div className="flex flex-col">
              <button
                className="text-lg font-medium text-gray-800 text-left hover:text-blue-600 transition-colors"
                onClick={() => setShowCategorySelector(true)}
              >
                {category} ▼
              </button>
              <span className="text-xs text-gray-500">
                {transactionId ? '编辑' : '新增'} ·{' '}
                {type === 'income' ? '收入' : '支出'}
              </span>
            </div>
            {/* 类型切换按钮 */}
            <div className="flex justify-center ml-4">
              <div className="flex bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setType('expense')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    type === 'expense'
                      ? 'bg-red-500 text-white'
                      : 'text-gray-600 hover:text-red-500'
                  }`}
                >
                  支出
                </button>
                <button
                  onClick={() => setType('income')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    type === 'income'
                      ? 'bg-green-500 text-white'
                      : 'text-gray-600 hover:text-green-500'
                  }`}
                >
                  收入
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* 金额显示 */}
        <div className="px-4 py-6 bg-gray-50">
          <div className="text-right">
            <div
              className={`text-3xl font-bold mb-2 ${
                type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {displayAmount}
            </div>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="在这里输入备注"
              className="w-full text-right text-gray-600 bg-transparent border-none outline-none placeholder-gray-400"
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>

        {/* 数字键盘 */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-4 gap-3 mb-4">
            {/* 第一行 */}
            <button
              onClick={() => handleNumberClick('1')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              1
            </button>
            <button
              onClick={() => handleNumberClick('2')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              2
            </button>
            <button
              onClick={() => handleNumberClick('3')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              3
            </button>
            <button
              onClick={handleDeleteInput}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center"
            >
              X
            </button>

            {/* 第二行 */}
            <button
              onClick={() => handleNumberClick('4')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              4
            </button>
            <button
              onClick={() => handleNumberClick('5')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              5
            </button>
            <button
              onClick={() => handleNumberClick('6')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              6
            </button>
            <button
              onClick={() => handleCalculatorOperation('+')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center"
            >
              +
            </button>

            {/* 第三行 */}
            <button
              onClick={() => handleNumberClick('7')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              7
            </button>
            <button
              onClick={() => handleNumberClick('8')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              8
            </button>
            <button
              onClick={() => handleNumberClick('9')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              9
            </button>
            <button
              onClick={() => handleCalculatorOperation('-')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center"
            >
              -
            </button>

            {/* 第四行 */}
            <button
              onClick={() => handleNumberClick('.')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              .
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="aspect-square bg-gray-100 rounded-xl text-xl font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              0
            </button>
            <button
              onClick={handleQuickReentry}
              className="aspect-square bg-gray-100 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center justify-center"
            >
              再记
            </button>
            <button
              onClick={handleSubmit}
              className="aspect-square bg-[#f66e4e] rounded-xl text-lg font-medium text-white hover:bg-[#e55e3e] active:bg-[#d54e2e] transition-colors flex items-center justify-center"
              disabled={!amount || amount === '0'}
            >
              完成
            </button>
          </div>
        </div>
        {transactionId && (
          <div className="px-4 pb-4">
            <button
              onClick={handleDeleteTransaction}
              className="w-full py-2 bg-red-500 text-white rounded-xl text-lg font-medium hover:bg-red-600 active:bg-red-700 transition-colors"
            >
              删除
            </button>
          </div>
        )}
      </div>

      {/* 分类选择器 */}
      {showCategorySelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 w-80 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">选择分类</h3>
            <div className="grid grid-cols-2 gap-2">
              {categories?.map?.((cat) => (
                <button
                  key={cat}
                  className={`w-full text-left py-3 px-4 rounded-md transition-colors ${
                    cat === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                  onClick={() => {
                    setCategory(cat);
                    setShowCategorySelector(false);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              className="w-full mt-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              onClick={() => setShowCategorySelector(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickEntryPanel;
