// Service Worker 注册封装
// vite-plugin-pwa 在 autoUpdate 模式下会自动注册 SW，
// 这里只监听 onNeedRefresh / onOfflineReady 事件，
// 把更新提示的扩展点预留好（目前仅在控制台输出日志）。
import { registerSW } from 'virtual:pwa-register';

if (typeof window !== 'undefined') {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // 新版本可用，预留扩展点（可在此显示 toast 提示用户刷新）
      console.info('[PWA] New content is available; refresh to update.');
    },
    onOfflineReady() {
      // 所有资源已就绪，可离线使用
      console.info('[PWA] App is ready to work offline.');
    },
    onRegisteredSW(swUrl) {
      console.info('[PWA] Service worker registered at:', swUrl);
    },
    onRegisterError(error) {
      console.error('[PWA] Service worker registration failed:', error);
    },
  });

  // 暴露给调试 / 未来手动触发更新
  (window as unknown as { __updateSW?: typeof updateSW }).__updateSW = updateSW;
}

export {};
