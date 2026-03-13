// store/useAppStore.js - Zustand 全局状态
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create(
  persist(
    (set) => ({
      // 用户信息
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, quota: null }),

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
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAppStore;
