'use client';

import { Printer } from '@/types/printer';
import React from 'react';

interface PrinterCardProps {
  printer: Printer;
  onView?: (printer: Printer) => void;
  onTest?: (printer: Printer) => void;
  testing?: boolean;
}

export default function PrinterCard({ printer, onView, onTest, testing = false }: PrinterCardProps) {
  const statusText = testing ? 'Testing...' : printer.status ?? 'Unknown';
  const status = (statusText ?? 'Unknown').toLowerCase();
  const statusClasses = testing
    ? 'bg-yellow-100 text-yellow-800'
    : status === 'online'
    ? 'bg-green-100 text-green-800'
    : status === 'offline'
    ? 'bg-red-100 text-red-800'
    : 'bg-gray-100 text-gray-800';

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-lg font-semibold">{printer.name}</h2>
        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusClasses}`}>
          {statusText}
        </span>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">model: {printer.model}</p>

      <div className="mt-auto flex gap-2">
        <button
          onClick={() => onView?.(printer)}
          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
        >
          View
        </button>
        <button
          onClick={() => onTest?.(printer)}
          disabled={testing}
          className={`inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition ${
            testing ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {testing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </button>
      </div>
    </div>
  );
}
