'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: number;
  nickname: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api.get<{ user: User }>('/auth/me')
      .then(res => setUser(res.data.user))
    //   .catch(() => router.push('/auth/login'));
  }, [router]);

  async function handleLogout() {
    await api.post('/auth/logout');
    router.push('/auth/login');
  }

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Welcome, {user.nickname}</h1>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white p-2 rounded"
      >
        Logout
      </button>
    </div>
  );
}
