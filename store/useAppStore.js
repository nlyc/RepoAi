// store/useAppStore.js - Zustand 全局状态（客户端）
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set) => ({
      // 用户信息
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, quota: null, currentReport: null }),

      // 额度信息
      quota: null,
      setQuota: (quota) => set({ quota }),

      // 当前生成的汇报
      currentReport: null,
      setCurrentReport: (report) => set({ currentReport: report }),
      clearCurrentReport: () => set({ currentReport: null }),
    }),
    {
      name: 'repoai-store',
      // 只持久化用户认证信息
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAppStore;
