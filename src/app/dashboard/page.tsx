'use client';

import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function DashboardPage() {

  const [printers, setPrinters] = useState<Array<{ id: string; name: string; status?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPrinters = async () => {
      try {
        setLoading(true);
        setError(null);

        // dynamically import the axios instance so no top-level import changes are needed

        const axiosRes = await api.get('/printers');
        // adapt axios response to the fetch-like shape expected below
        const res = {
          ok: axiosRes.status >= 200 && axiosRes.status < 300,
          status: axiosRes.status,
          statusText: axiosRes.statusText,
          json: async () => axiosRes.data,
        };
        if (!res.ok) throw new Error(`Failed to fetch printers: ${res.status} ${res.statusText}`);

        const data: any = await res.json();
        if (!mounted) return;

        // Normalize expected shape if needed
        if (Array.isArray(data)) {
          setPrinters(data);
        } else if (data?.printers && Array.isArray(data.printers)) {
          setPrinters(data.printers);
        } else {
          setPrinters([]);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPrinters();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">3D Printer Dashboard</h1>

      {loading ? (
      <p>Loading printers...</p>
      ) : error ? (
      <p className="text-red-600">Error: {error}</p>
      ) : printers.length === 0 ? (
      <p>No printers found.</p>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {printers.map((printer) => {
        const status = (printer.status ?? 'Unknown').toLowerCase();
        const statusClasses =
          status === 'online'
          ? 'bg-green-100 text-green-800'
          : status === 'offline'
          ? 'bg-red-100 text-red-800'
          : 'bg-gray-100 text-gray-800';

        return (
          <div
          key={printer.id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col"
          >
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-lg font-semibold">{printer.name}</h2>
            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusClasses}`}>
            {printer.status ?? 'Unknown'}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">ID: {printer.id}</p>

          <div className="mt-auto flex gap-2">
            <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition">
            View
            </button>
            <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            Actions
            </button>
          </div>
          </div>
        );
        })}
        <div
          key="add-printer"
          className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-lg transition p-6 flex items-center justify-center cursor-pointer"
          onClick={() => {
            const name = window.prompt('Enter new printer name:');
            if (!name) return;
            const newPrinter = { id: `local-${Date.now()}`, name, status: 'offline' };
            setPrinters((prev) => [newPrinter, ...prev]);
          }}
          role="button"
          aria-label="Add printer"
        >
          <div className="text-center">
            <svg
              className="h-10 w-10 text-gray-400 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">Add Printer</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}