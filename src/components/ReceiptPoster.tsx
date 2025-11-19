'use client';

import { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface ReceiptPosterProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  todaySummary: { income: number; expense: number };
  getCategoryIcon: (category: string) => React.ReactNode;
}

export default function ReceiptPoster({
  isOpen,
  onClose,
  transactions,
  todaySummary,
  getCategoryIcon,
}: ReceiptPosterProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 关闭弹窗的处理
  const handleClose = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 生成并保存海报
  const handleSavePoster = async () => {
    if (!posterRef.current) return;

    setIsGenerating(true);
    try {
      // 在生成前暂时移除可能有问题的样式
      const originalStyles = posterRef.current.style.cssText;

      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        ignoreElements: (element) => {
          // 忽略可能有问题的元素
          return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
        },
        onclone: (clonedDoc) => {
          // 在克隆的文档中移除可能导致问题的CSS
          const clonedElement = clonedDoc.querySelector(
            '[data-html2canvas-ignore]',
          );
          if (clonedElement) {
            clonedElement.remove();
          }

          // 强制使用基础颜色
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el: any) => {
            const style = el.style;
            if (style) {
              // 替换可能有问题的颜色函数
              ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
                if (
                  style[prop] &&
                  (style[prop].includes('lab(') ||
                    style[prop].includes('oklab('))
                ) {
                  // 使用备用颜色
                  if (prop === 'color') {
                    style[prop] = '#374151'; // gray-700
                  } else if (prop === 'backgroundColor') {
                    style[prop] = '#ffffff'; // white
                  } else if (prop === 'borderColor') {
                    style[prop] = '#d1d5db'; // gray-300
                  }
                }
              });
            }
          });
        },
      });

      // 恢复原始样式
      posterRef.current.style.cssText = originalStyles;

      // 创建下载链接
      const link = document.createElement('a');
      link.download = `小票_${new Date()
        .toLocaleDateString('zh-CN')
        .replace(/\//g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('生成海报失败:', error);

      // 提供更详细的错误信息
      let errorMessage = '生成海报失败，请重试';
      if (error instanceof Error) {
        if (error.message.includes('lab') || error.message.includes('color')) {
          errorMessage = '颜色解析错误，正在尝试备用方案...';

          // 尝试简化版本的海报生成
          try {
            await generateSimplifiedPoster();
            return;
          } catch (secondError) {
            errorMessage = '生成海报失败，请检查浏览器兼容性';
          }
        }
      }

      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // 简化版海报生成（备用方案）
  const generateSimplifiedPoster = async () => {
    if (!posterRef.current) return;

    const canvas = await html2canvas(posterRef.current, {
      backgroundColor: '#ffffff',
      scale: 1.5,
      useCORS: false,
      allowTaint: false,
      height: posterRef.current.scrollHeight,
      width: posterRef.current.scrollWidth,
      logging: false,
      removeContainer: true,
    });

    const link = document.createElement('a');
    link.download = `小票_简化版_${new Date()
      .toLocaleDateString('zh-CN')
      .replace(/\//g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!isOpen) return null;

  const formatDate = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    return { day, monthDay: `${year}/${month}` };
  };

  const { day, monthDay } = formatDate();

  return (
    <div
      style={{
        position: 'fixed',
        inset: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: '50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          maxWidth: '380px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* 海报内容 */}
          <div
            ref={posterRef}
            style={{
              fontFamily: "'Courier New', monospace",
              backgroundColor: '#ffffff',
              padding: '16px',
              color: '#1f2937',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* 顶部日期和标题 */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#111827',
                  marginBottom: '4px',
                }}
              >
                {day}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#4b5563',
                  marginBottom: '12px',
                }}
              >
                {monthDay}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#374151',
                  marginBottom: '6px',
                }}
              >
                *** 小票时光机 ***
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                }}
              >
                {new Date().toLocaleDateString('zh-CN')}{' '}
                {new Date().toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            {/* 分隔线 */}
            <div
              style={{
                borderTop: '1px dashed #d1d5db',
                margin: '12px 0',
              }}
            ></div>

            {/* 交易列表 */}
            <div
              style={{
                marginBottom: '24px',
              }}
            >
              {transactions.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    color: '#9ca3af',
                  }}
                >
                  <p>今天还没有记账</p>
                </div>
              ) : (
                transactions.map((transaction, index) => (
                  <div
                    key={transaction.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px dotted rgba(0,0,0,0.1)',
                      fontSize: '14px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flex: '1',
                      }}
                    >
                      <div
                        style={{
                          marginRight: '12px',
                        }}
                      >
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div
                        style={{
                          fontWeight: '500',
                          color: '#374151',
                        }}
                      >
                        {transaction.category}
                      </div>
                    </div>
                    <div
                      style={{
                        color: '#4b5563',
                        margin: '0 16px',
                        lineHeight: '28px',
                      }}
                    >
                      x1
                    </div>
                    <div
                      style={{
                        fontWeight: '500',
                        color:
                          transaction.type === 'income' ? '#059669' : '#dc2626',
                        textAlign: 'right',
                        minWidth: '80px',
                        lineHeight: '28px',
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontWeight: '500',
                  color: '#374151',
                }}
              >
                今日支出
              </div>
              <div
                style={{
                  fontWeight: 'bold',
                  color: '#111827',
                }}
              >
                ¥{todaySummary.expense.toFixed(2)}
              </div>
            </div>

            {/* 虚线分隔 */}
            <div
              style={{
                margin: '6px 0',
                textAlign: 'center',
                color: '#d1d5db',
                fontSize: '10px',
                letterSpacing: '2px',
              }}
            >
              - - - - - - - - - - - - - - - -
            </div>

            {/* 今日结余 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
              }}
            >
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#374151',
                }}
              >
                今日结余
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color:
                    todaySummary.income - todaySummary.expense >= 0
                      ? '#059669'
                      : '#dc2626',
                }}
              >
                {todaySummary.income - todaySummary.expense >= 0 ? '' : '-'}¥
                {Math.abs(todaySummary.income - todaySummary.expense).toFixed(
                  2,
                )}
              </div>
            </div>

            {/* 底部分隔线 */}
            <div
              style={{
                position: 'relative',
                borderTop: '1px dashed #d1d5db',
                margin: '6px 0',
              }}
            ></div>
            {/* 底部信息和二维码 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                height: '60px',
              }}
            >
              <div style={{ flex: '1', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                  感谢您使用小票时光机
                </div>
                <div style={{ fontSize: '10px' }}>记录美好生活的每一笔</div>
              </div>

              {/* 二维码 */}
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  flexShrink: 0,
                  position: 'absolute',
                  right: '16px',
                  bottom: '16px',
                }}
              >
                <QRCodeSVG
                  value={
                    typeof window !== 'undefined' ? window.location.href : ''
                  }
                  size={50}
                  level="L"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '16px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: '1',
              padding: '12px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSavePoster}
            disabled={isGenerating}
            style={{
              flex: '1',
              padding: '12px 16px',
              backgroundColor: isGenerating ? '#f66e4e80' : '#f66e4e',
              color: '#ffffff',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
            }}
          >
            {isGenerating ? '生成中...' : '保存海报'}
          </button>
        </div>
      </div>
    </div>
  );
}
