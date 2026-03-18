'use client';
// app/(protected)/layout.jsx - 受保护路由布局（客户端鉴权）
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAppStore from '@/store/useAppStore';
import AppShell from '@/components/layout/AppShell';

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const token = useAppStore(s => s.token);

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  if (!token) return null;

  return <AppShell>{children}</AppShell>;
}
