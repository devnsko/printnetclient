'use server';

import api from '@/lib/api';
import { cookies } from 'next/headers';

export async function getServerUser() {
  try {
    // Read the cookie from Next.js server context
    const token = (await cookies()).get('printnettoken')?.value;

    if (!token) return null;

    // Forward the cookie manually
    const { data } = await api.get('/auth/me', {
      headers: {
        Cookie: `printnettoken=${token}`,
      },
    });

    return data as { id: string; nickname: string };
  } catch (err) {
    console.error('Error fetching user data:', err);
    return null;
  }
}
