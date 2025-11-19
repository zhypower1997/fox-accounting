'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Colors,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Colors,
);

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface CategorySummary {
  category: string;
  total: number;
  count: number;
  type: 'income' | 'expense';
}
export default function Analysis() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'month' | 'year'>('month');
  const [viewType, setViewType] = useState<'trend' | 'ranking' | 'dashboard'>(
    'trend',
  );
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([]);
  const [trendData, setTrendData] = useState<any>(null);
  const [pieData, setPieData] = useState<any>(null);
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [heatmapMode, setHeatmapMode] = useState<'amount' | 'count'>('amount');
  const [overview, setOverview] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionCount: 0,
  });

  useEffect(() => {
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      const parsedTransactions = JSON.parse(savedTransactions);
      setTransactions(parsedTransactions);
      calculateAnalysis(parsedTransactions);
    }
  }, [timeRange]);

  // 生成热力图数据
  useEffect(() => {
    if (transactions.length > 0) {
      generateHeatmapData(transactions);
    }
  }, [transactions, timeRange, heatmapMode]);

  const calculateAnalysis = (transactions: Transaction[]) => {
    // 过滤时间范围
    const filteredTransactions = filterByTimeRange(transactions);

    // 计算概览
    const totalIncome = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setOverview({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: filteredTransactions.length,
    });

    // 计算分类统计
    const categoryMap = new Map<string, CategorySummary>();

    filteredTransactions.forEach((transaction) => {
      if (!categoryMap.has(transaction.category)) {
        categoryMap.set(transaction.category, {
          category: transaction.category,
          total: 0,
          count: 0,
          type: transaction.type,
        });
      }

      const summary = categoryMap.get(transaction.category)!;
      summary.total += transaction.amount;
      summary.count += 1;
    });

    const sortedCategories = Array.from(categoryMap.values())
      .filter((cat) => cat.type === 'expense')
      .sort((a, b) => b.total - a.total);

    setCategoryData(sortedCategories);

    // 生成趋势图数据
    generateTrendData(filteredTransactions);

    // 生成饼图数据
    generatePieData(sortedCategories);
  };

  const filterByTimeRange = (transactions: Transaction[]): Transaction[] => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 最近30天
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1); // 最近12个月
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 4, 0, 1); // 最近5年
        break;
    }

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate;
    });
  };

  const generateTrendData = (transactions: Transaction[]) => {
    const expenseTransactions = transactions.filter(
      (t) => t.type === 'expense',
    );
    const dataMap = new Map<string, number>();

    // 根据时间范围生成不同的时间标签
    let labels: string[] = [];
    let format: (date: Date) => string;

    switch (timeRange) {
      case 'day':
        // 最近30天
        format = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}`;
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const key = format(date);
          labels.push(key);
          dataMap.set(key, 0);
        }
        break;
      case 'month':
        // 最近12个月
        format = (date: Date) =>
          `${date.getFullYear()}/${(date.getMonth() + 1)
            .toString()
            .padStart(2, '0')}`;
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i, 1);
          const key = format(date);
          labels.push(key);
          dataMap.set(key, 0);
        }
        break;
      case 'year':
        // 最近5年
        format = (date: Date) => date.getFullYear().toString();
        for (let i = 4; i >= 0; i--) {
          const year = new Date().getFullYear() - i;
          labels.push(year.toString());
          dataMap.set(year.toString(), 0);
        }
        break;
    }

    // 统计每个时间段的支出
    expenseTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const key = format(date);
      if (dataMap.has(key)) {
        dataMap.set(key, dataMap.get(key)! + transaction.amount);
      }
    });

    const data = labels.map((label) => dataMap.get(label) || 0);

    setTrendData({
      labels,
      datasets: [
        {
          label: '支出金额',
          data,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
          fill: true,
        },
      ],
    });
  };

  const generatePieData = (categories: CategorySummary[]) => {
    if (categories.length === 0) {
      setPieData(null);
      return;
    }

    const colors = [
      '#ef4444',
      '#f97316',
      '#eab308',
      '#22c55e',
      '#06b6d4',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#f59e0b',
      '#10b981',
    ];

    setPieData({
      labels: categories.map((c) => c.category),
      datasets: [
        {
          data: categories.map((c) => c.total),
          backgroundColor: colors.slice(0, categories.length),
          borderColor: colors.slice(0, categories.length),
          borderWidth: 2,
        },
      ],
    });
  };
  // 生成热力图数据 - 根据时间范围动态生成
  const generateHeatmapData = (transactions: Transaction[]) => {
    if (transactions.length === 0) {
      setHeatmapData(null);
      return;
    }

    // 按日期分组计算每天的消费金额和笔数
    const dateMap = new Map<string, { amount: number; count: number }>();

    let year: number,
      month: number,
      daysInMonth: number,
      firstDayOfMonth: number;

    // 根据timeRange决定显示哪个时间段
    if (timeRange === 'day') {
      // 显示最近30天
      const now = new Date();
      const startDate = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

      // 初始化30天
      for (let i = 0; i < 30; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        dateMap.set(dateKey, { amount: 0, count: 0 });
      }

      year = now.getFullYear();
      month = now.getMonth();
      daysInMonth = 30;
      firstDayOfMonth = startDate.getDay();
    } else {
      // 显示当前月份（原有逻辑）
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
      daysInMonth = new Date(year, month + 1, 0).getDate();
      firstDayOfMonth = new Date(year, month, 1).getDay();

      // 初始化当月每一天
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(
          day,
        ).padStart(2, '0')}`;
        dateMap.set(dateKey, { amount: 0, count: 0 });
      }
    }

    // 填充实际数据
    transactions.forEach((transaction) => {
      const txDate = new Date(transaction.date);
      let dateKey: string;

      if (timeRange === 'day') {
        // 最近30天模式
        dateKey = `${txDate.getFullYear()}-${String(
          txDate.getMonth() + 1,
        ).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`;
      } else {
        // 当月模式
        if (txDate.getMonth() === month && txDate.getFullYear() === year) {
          dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(
            txDate.getDate(),
          ).padStart(2, '0')}`;
        } else {
          return; // 不是当月的数据，跳过
        }
      }

      if (dateMap.has(dateKey)) {
        const data = dateMap.get(dateKey)!;
        if (transaction.type === 'expense') {
          data.amount += transaction.amount;
        }
        data.count += 1;
        dateMap.set(dateKey, data);
      }
    });

    // 计算最大消费金额和笔数（用于颜色渐变）
    const allAmounts = Array.from(dateMap.values()).map((data) => data.amount);
    const allCounts = Array.from(dateMap.values()).map((data) => data.count);
    const maxAmount = Math.max(...allAmounts, 1);
    const maxCount = Math.max(...allCounts, 1);

    // 计算每天的强度值（0-1之间）
    const intensities = new Map<string, number>();
    dateMap.forEach((data, date) => {
      const intensity =
        heatmapMode === 'amount'
          ? data.amount / maxAmount
          : data.count / maxCount;
      intensities.set(date, intensity);
    });

    // 生成日历网格数据
    const calendarData = {
      dateMap: dateMap,
      intensities: intensities,
      firstDayOfMonth: firstDayOfMonth,
      daysInMonth: daysInMonth,
      year: year,
      month: month,
      timeRange: timeRange,
    };

    setHeatmapData(calendarData);
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return '¥' + value.toFixed(0);
          },
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ¥${context.parsed.toFixed(
              2,
            )} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2">
            <BackButton variant="minimal" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900">
            消费分析
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {/* 视图类型选择和时间范围 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex justify-between mb-3">
            <div className="flex gap-2 flex-1">
              <button
                onClick={() => setTimeRange('day')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                  timeRange === 'day'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                按日
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                  timeRange === 'month'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                按月
              </button>
              <button
                onClick={() => setTimeRange('year')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                  timeRange === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                按年
              </button>
            </div>

            <div className="border-l mx-2 my-1 border-gray-200"></div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewType('trend')}
                className={`py-2 px-3 rounded-lg text-sm font-medium ${
                  viewType === 'trend'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                趋势
              </button>
              <button
                onClick={() => setViewType('ranking')}
                className={`py-2 px-3 rounded-lg text-sm font-medium ${
                  viewType === 'ranking'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                排行
              </button>
              <button
                onClick={() => setViewType('dashboard')}
                className={`py-2 px-3 rounded-lg text-sm font-medium ${
                  viewType === 'dashboard'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                仪表盘
              </button>
            </div>
          </div>
        </div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-green-50 p-4 rounded-xl text-center">
            <div className="text-sm text-green-600 mb-1">总收入</div>
            <div className="text-xl font-bold text-green-700">
              ¥{overview.totalIncome.toFixed(2)}
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-xl text-center">
            <div className="text-sm text-red-600 mb-1">总支出</div>
            <div className="text-xl font-bold text-red-700">
              ¥{overview.totalExpense.toFixed(2)}
            </div>
          </div>
          <div
            className={`p-4 rounded-xl text-center col-span-2 ${
              overview.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
            }`}
          >
            <div
              className={`text-sm ${
                overview.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
              } mb-1`}
            >
              结余
            </div>
            <div
              className={`text-xl font-bold ${
                overview.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}
            >
              {overview.balance >= 0 ? '+' : ''}¥{overview.balance.toFixed(2)}
            </div>
          </div>
        </div>

        {transactions.length > 0 ? (
          <div className="space-y-6">
            {/* 趋势视图 */}
            {viewType === 'trend' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">花费趋势</h2>
                {trendData ? (
                  <div className="h-64">
                    <Line data={trendData} options={chartOptions} />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    暂无数据
                  </div>
                )}
              </div>
            )}

            {/* 排行视图 */}
            {viewType === 'ranking' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-4">支出分类占比</h2>
                {pieData ? (
                  <div className="h-80">
                    <Pie data={pieData} options={pieOptions} />
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    暂无支出数据
                  </div>
                )}

                {/* 排行榜列表 */}
                {categoryData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-md font-semibold mb-3">支出分类排行</h3>
                    <div className="space-y-3">
                      {categoryData.map((category, index) => (
                        <div
                          key={category.category}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-700">
                              {index + 1}
                            </div>
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{
                                backgroundColor: [
                                  '#ef4444',
                                  '#f97316',
                                  '#eab308',
                                  '#22c55e',
                                  '#06b6d4',
                                  '#3b82f6',
                                  '#8b5cf6',
                                  '#ec4899',
                                  '#f59e0b',
                                  '#10b981',
                                ][index % 10],
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {category.category}
                              </div>
                              <div className="text-sm text-gray-500">
                                {category.count}笔交易
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">
                              ¥{category.total.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {overview.totalExpense > 0
                                ? (
                                    (category.total / overview.totalExpense) *
                                    100
                                  ).toFixed(1)
                                : '0'}
                              %
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* 仪表盘视图 */}
            {viewType === 'dashboard' && (
              <div className="space-y-6">
                {/* 消费热力图 */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">消费热力图</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setHeatmapMode('amount')}
                        className={`py-1 px-3 text-xs rounded-full ${
                          heatmapMode === 'amount'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        按金额
                      </button>
                      <button
                        onClick={() => setHeatmapMode('count')}
                        className={`py-1 px-3 text-xs rounded-full ${
                          heatmapMode === 'count'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        按笔数
                      </button>
                    </div>
                  </div>
                  {/* 日历热力图网格 */}
                  <div className="bg-white p-2 rounded-lg mb-4">
                    {heatmapData ? (
                      <>
                        <div className="mb-2 grid grid-cols-7 gap-1 text-xs text-center text-gray-500">
                          <div>日</div>
                          <div>一</div>
                          <div>二</div>
                          <div>三</div>
                          <div>四</div>
                          <div>五</div>
                          <div>六</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {/* 前置空白格子（本月1号之前的日期） */}
                          {Array.from({
                            length: heatmapData.firstDayOfMonth,
                          }).map((_, index) => (
                            <div
                              key={`empty-${index}`}
                              className="aspect-square"
                            />
                          ))}

                          {/* 实际日期格子 */}
                          {Array.from({ length: heatmapData.daysInMonth }).map(
                            (_, index) => {
                              const day = index + 1;
                              const dateKey = `${heatmapData.year}-${String(
                                heatmapData.month + 1,
                              ).padStart(2, '0')}-${String(day).padStart(
                                2,
                                '0',
                              )}`;
                              const dayData = heatmapData.dateMap.get(dateKey);
                              const intensity =
                                heatmapData.intensities.get(dateKey) || 0;

                              const value =
                                heatmapMode === 'amount'
                                  ? dayData?.amount
                                  : dayData?.count;

                              // 计算颜色强度
                              const now = new Date();
                              const isToday =
                                day === now.getDate() &&
                                heatmapData.month === now.getMonth() &&
                                heatmapData.year === now.getFullYear();
                              const isSelected = dateKey === selectedDate;

                              // 颜色计算逻辑 - 使用蓝色系深浅
                              let backgroundColor = '#f8fafc'; // 默认很浅的灰色（无数据）

                              if (value && value > 0) {
                                // 使用蓝色系的深浅来表示数据量
                                if (intensity <= 0.2) {
                                  // 很少：很浅的蓝色
                                  backgroundColor = '#e0f2fe';
                                } else if (intensity <= 0.4) {
                                  // 少：浅蓝色
                                  backgroundColor = '#bae6fd';
                                } else if (intensity <= 0.6) {
                                  // 中等：中等蓝色
                                  backgroundColor = '#7dd3fc';
                                } else if (intensity <= 0.8) {
                                  // 多：深蓝色
                                  backgroundColor = '#38bdf8';
                                } else {
                                  // 很多：最深蓝色
                                  backgroundColor = '#0ea5e9';
                                }
                              }

                              return (
                                <div
                                  key={dateKey}
                                  onClick={() => setSelectedDate(dateKey)}
                                  className={`aspect-square rounded cursor-pointer transition-all hover:scale-110 ${
                                    isSelected || (isToday && !selectedDate)
                                      ? 'ring-2 ring-blue-500'
                                      : ''
                                  }`}
                                  style={{
                                    backgroundColor:
                                      isSelected || (isToday && !selectedDate)
                                        ? '#3b82f6' // 选中或今天使用鲜明的蓝色
                                        : backgroundColor,
                                  }}
                                />
                              );
                            },
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="h-32 flex items-center justify-center text-gray-500">
                        暂无消费记录
                      </div>
                    )}
                  </div>
                  {/* 日期和笔数统计 */}
                  <div className="flex justify-between items-center mb-3 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="text-xs flex items-center">
                        <span
                          className="inline-block w-3 h-3 mr-1 rounded"
                          style={{ backgroundColor: '#f8fafc' }}
                        ></span>
                        <span>无数据</span>
                      </div>
                      <div className="text-xs flex items-center">
                        <span
                          className="inline-block w-3 h-3 mr-1 rounded"
                          style={{ backgroundColor: '#e0f2fe' }}
                        ></span>
                        <span>很少</span>
                      </div>
                      <div className="text-xs flex items-center">
                        <span
                          className="inline-block w-3 h-3 mr-1 rounded"
                          style={{ backgroundColor: '#7dd3fc' }}
                        ></span>
                        <span>中等</span>
                      </div>
                      <div className="text-xs flex items-center">
                        <span
                          className="inline-block w-3 h-3 mr-1 rounded"
                          style={{ backgroundColor: '#38bdf8' }}
                        ></span>
                        <span>较多</span>
                      </div>
                      <div className="text-xs flex items-center">
                        <span
                          className="inline-block w-3 h-3 mr-1 rounded"
                          style={{ backgroundColor: '#0ea5e9' }}
                        ></span>
                        <span>很多</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-2">
                    {(() => {
                      const displayDate =
                        selectedDate ||
                        `${new Date().getFullYear()}-${String(
                          new Date().getMonth() + 1,
                        ).padStart(2, '0')}-${String(
                          new Date().getDate(),
                        ).padStart(2, '0')}`;

                      const [year, month, day] = displayDate
                        .split('-')
                        .map(Number);

                      const dayTransactions = transactions.filter((t) => {
                        const txDate = new Date(t.date);
                        return (
                          txDate.getDate() === day &&
                          txDate.getMonth() === month - 1 &&
                          txDate.getFullYear() === year
                        );
                      });

                      return (
                        <>
                          <div className="text-sm font-medium text-gray-800 mb-1">
                            {year}.{String(month).padStart(2, '0')}.
                            {String(day).padStart(2, '0')}
                          </div>
                          <div className="text-xs text-gray-600 mb-3">
                            共计{dayTransactions.length}笔
                          </div>

                          <div className="space-y-2">
                            {dayTransactions.length > 0 ? (
                              dayTransactions.map((tx, i) => (
                                <div
                                  key={i}
                                  className="flex justify-between items-center"
                                >
                                  <div className="flex-1">
                                    <div className="text-sm font-medium">
                                      {tx.category}
                                    </div>
                                  </div>
                                  <div className="text-right mr-4">
                                    <div className="text-sm text-gray-600">
                                      1
                                    </div>
                                  </div>
                                  <div className="w-24 text-right">
                                    <div
                                      className={`text-sm font-medium ${
                                        tx.type === 'income'
                                          ? 'text-green-600'
                                          : 'text-red-600'
                                      }`}
                                    >
                                      {tx.type === 'income' ? '+' : '-'}¥
                                      {tx.amount.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-sm text-gray-400 py-4">
                                该日无交易记录
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                {/* 移除了概览卡片组，因为已经集成到热力图卡片中 */}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">📊</div>
            <p>暂无消费数据</p>
            <Link
              href="/add"
              className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              去记账
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
