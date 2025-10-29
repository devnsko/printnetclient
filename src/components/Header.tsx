import Link from "next/link";
import { getServerUser } from "@/lib/auth";

export default async function Header() {
    const user = null;
    // const user = await getServerUser();
    // TODO: fix auth to enable this

    console.log(user);

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
                        {user ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                                    {user.nickname?.charAt(0).toUpperCase() ?? "U"}
                                </div>
                                <div className="hidden sm:block text-sm text-gray-700 truncate max-w-xs">
                                    {user.nickname}
                                </div>
                                <Link
                                    href="/dashboard"
                                    className="text-sm text-indigo-600 hover:text-indigo-700"
                                >
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
