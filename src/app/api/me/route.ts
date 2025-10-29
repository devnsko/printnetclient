import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  // Read the cookie from the incoming request
  const cookieStore = await cookies();
  const token = cookieStore.get('printnettoken')?.value;

  console.log('Token from cookies:', token);

  // If no token, return unauthorized immediately
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Forward the cookie to the backend
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      headers: {
        Cookie: `printnettoken=${token}`, // must forward cookie manually
      },
      credentials: 'include', // allow backend to read the cookie
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: res.status });
    }

    const user = await res.json();

    // Return the backend user object
    return NextResponse.json(user);
  } catch (err) {
    console.error('Error fetching user from backend:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
