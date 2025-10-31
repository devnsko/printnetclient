'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import api from "@/lib/api";

type User = { id: string; nickname: string; role: string } | null;

export default function Header() {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const fetchUser = async () => {
            try {
                setLoading(true);
                setError(null);

                const axiosRes = await api.get("/auth/me");
                const res = {
                    ok: axiosRes.status >= 200 && axiosRes.status < 300,
                    status: axiosRes.status,
                    statusText: axiosRes.statusText,
                    json: async () => axiosRes.data,
                };

                if (!res.ok) throw new Error(`Failed to fetch user: ${res.status} ${res.statusText}`);
                const data: any = await res.json();

                if (!mounted) return;

                // 💡 The FIX: Check if the data *is* the user object, or if it's nested
                const payload: any = data?.user ?? data;

                if (!mounted) return;

                console.log('User Data being set:', payload, typeof payload);

                if (payload && typeof payload === "object" && payload.id && payload.nickname) {
                    setUser({ id: payload.id, nickname: payload.nickname, role: payload.role ?? "" });
                } else {
                    setUser(null);
                }
            } catch (err: any) {
                if (mounted) setError(err?.message ?? "Unknown error");
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchUser();
        return () => {
            mounted = false;
        };
    }, []);


    return (
        <header className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="flex items-center space-x-3">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold">
                                P
                            </span>
                            <span className="text-lg font-semibold text-gray-900">PrintNet</span>
                        </Link>

                        <nav className="hidden sm:flex space-x-4">
                            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                                Home
                            </Link>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-4">
                        {loading ? (
                            <p>Loading...</p>
                        ) : error ? (
                            <p>Error: {error}</p>
                        ) : user ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                                    <Link href="/profile">
                                        {user.nickname?.charAt(0).toUpperCase() ?? "U"}
                                    </Link>
                                </div>
                                <div className="hidden sm:block text-sm text-gray-700 truncate max-w-xs">
                                    <Link href="/profile">
                                        {user.nickname}
                                    </Link>
                                </div>
                                <Link href="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700">
                                    Dashboard
                                </Link>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link
                                    href="/auth/login"
                                    className="px-3 py-1.5 border border-indigo-600 text-indigo-600 rounded-md text-sm hover:bg-indigo-50"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                                >
                                    Get started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}