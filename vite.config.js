import { defineConfig } from 'vite';

export default defineConfig({
  base '/mc/',
  server: {
    watch: {
      // Windows 上部分编辑方式不会发出文件变化通知。轮询保证保存后能更新页面。
      usePolling: true,
      interval: 300,
      ignored: ['**/.tools/**', '**/docs/**', '**/tests/**'],
    },
  },
});
