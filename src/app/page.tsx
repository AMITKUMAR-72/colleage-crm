'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F5EEE6]/80 backdrop-blur-sm transition-all min-h-screen">
      <img src="/raffles-logo.png" alt="Loading" className="h-32 w-auto object-contain animate-spin-y-ease-in" />
    </div>
  );
}
