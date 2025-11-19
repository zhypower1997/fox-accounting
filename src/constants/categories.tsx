import React from 'react';

export interface Category {
  type: 'income' | 'expense';
  name: string;
  icon: string;
  color: string;
}

export const categories: Category[] = [
  {
    type: 'expense',
    name: '餐饮',
    icon: '/images/icons/番茄.png',
    color: 'bg-red-100',
  },
  {
    type: 'expense',
    name: '交通',
    icon: '/images/icons/交通.png',
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
  {
    type: 'income',
    name: '奖金',
    icon: '/images/icons/鸡蛋.png',
    color: 'bg-blue-100',
  },
  {
    type: 'income',
    name: '投资',
    icon: '📈',
    color: 'bg-purple-100',
  },
  {
    type: 'income',
    name: '其他收入',
    icon: '💸',
    color: 'bg-gray-100',
  },
];

// 根据分类名称获取图标的辅助函数
export const getCategoryIcon = (categoryName: string) => {
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
      return <span className="text-xl"> {category.icon} </span>;
    }
  }

  // 默认图标
  return <span className="text-xl">💸</span>;
};
