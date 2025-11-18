'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // 开发环境完全禁用Service Worker
    if (process.env.NODE_ENV === 'development') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
            console.log('开发环境: Service Worker 已禁用');
          });
        });
      }
      return;
    }

    // 生产环境启用Service Worker
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          // 先清理所有旧的Service Worker
          const registrations =
            await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            await registration.unregister();
          }

          // 注册新的Service Worker
          const registration = await navigator.serviceWorker.register(
            '/sw.js',
            {
              updateViaCache: 'none',
            },
          );

          console.log('Service Worker 注册成功');

          // 监听更新
          registration.addEventListener('updatefound', () => {
            console.log('检测到Service Worker更新');
          });
        } catch (error) {
          console.log('Service Worker 注册失败:', error);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }
  }, []);

  return null;
}
