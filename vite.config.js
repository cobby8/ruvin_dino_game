import { defineConfig } from 'vite';

export default defineConfig({
  // Capacitor 빌드 시 상대경로가 필요하므로 './'로 설정
  base: './',

  build: {
    // Capacitor의 webDir 설정과 일치시킴
    outDir: 'dist',
  },

  server: {
    // 개발서버 포트 (다른 프로젝트와 충돌 방지)
    port: 5173,
  },
});
