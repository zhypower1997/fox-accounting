'use client';

import { useState, useEffect } from 'react';

export default function PWAFeatures() {
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // 监听网络状态
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听PWA安装提示
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener(
      'beforeinstallprompt',
      handleBeforeInstallPrompt as EventListener,
    );

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt as EventListener,
      );
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {/* 离线状态提示 */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-md shadow-md">
          ⚡ 离线模式
        </div>
      )}

      {/* 安装提示 */}
      {showInstallPrompt && (
        <div className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-md">
          <div className="flex items-center gap-2">
            <span>安装逗逗狐记账APP</span>
            <button
              onClick={handleInstallClick}
              className="bg-white text-blue-600 px-2 py-1 rounded text-sm font-semibold hover:bg-gray-100"
            >
              安装
            </button>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="text-white hover:text-gray-200 text-sm"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
