'use client';
import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Props {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

      try {
        const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
        const payload =
        mode === 'register'
          ? { email, password, nickname }
          : { email, password };

        // The server sets an httpOnly cookie (token). Make sure the request
        // includes credentials so the browser stores the cookie.
        // If `api` is an axios instance use `withCredentials: true`.
        // If it's a fetch wrapper use `credentials: 'include'`.
        await api.post(endpoint, payload, { withCredentials: true });

        // token is httpOnly — you can't read it from JS. Just navigate (or
        // fetch protected data which will send the cookie automatically).
        router.push('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Something went wrong');
      }
      }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 p-6 bg-white shadow rounded max-w-sm mx-auto mt-16"
    >
      <h2 className="text-xl font-semibold text-center">
        {mode === 'register' ? 'Register' : 'Login'}
      </h2>

      <input
        className="border p-2 rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="border p-2 rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {mode === 'register' && (
        <input
          className="border p-2 rounded"
          type="text"
          placeholder="Nickname (optional)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
      >
        {mode === 'register' ? 'Create Account' : 'Login'}
      </button>
    </form>
  );
}
