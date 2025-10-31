'use client';

import { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import api from "@/lib/api";
import PrinterCard from '@/components/PrintersList';
import { Printer } from "@/types/printer";
 

export default function DashboardPage() {

  const router = useRouter();

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [testingIds, setTestingIds] = useState<string[]>([]);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const notifTimerRef = useRef<number | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string, timeout = 5000) => {
    setNotification({ type, message });
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current);
    notifTimerRef.current = window.setTimeout(() => setNotification(null), timeout);
  };

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
      <div className="flex items-start mb-6">
        <h1 className="text-2xl p-3 font-bold">3D Printer Dashboard</h1>

        {notification && (
          <div
        className={`ml-4 p-3 rounded ${
          notification.type === 'success'
            ? 'bg-green-50 text-green-800'
            : notification.type === 'error'
            ? 'bg-red-50 text-red-800'
            : 'bg-blue-50 text-blue-800'
        }`}
        role="status"
          >
        {notification.message}
          </div>
        )}
      </div>

      {loading ? (
      <p>Loading printers...</p>
      ) : error ? (
      <p className="text-red-600">Error: {error}</p>
      ) 
      // : printers.length === 0 ? (
      // <p>No printers found.</p>
      // ) 
      : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {printers.map((printer) => (
          <PrinterCard
            key={printer.id}
            printer={printer}
            testing={testingIds.includes(printer.id)}
            onView={(p) => router.push(`/dashboard/printer/${encodeURIComponent(p.id)}`)}
            onTest={async (p) => {
              if (testingIds.includes(p.id)) return;
              setTestingIds((s) => [...s, p.id]);
              try {
                const axiosRes = await api.post(`/printers/${encodeURIComponent(p.id)}/test-connection`);
                const ok = axiosRes.status >= 200 && axiosRes.status < 300;
                if (!ok) throw new Error(`Test failed: ${axiosRes.status} ${axiosRes.statusText}`);
                const data: any = axiosRes.data;

                const newStatus = data?.status;
                if (newStatus) {
                  setPrinters((prev) => prev.map((pr) => (pr.id === p.id ? { ...pr, status: newStatus } : pr)));
                }

                showNotification('success', data?.message ?? 'Test connection succeeded');
              } catch (err: any) {
                showNotification('error', err?.message ?? 'Test connection failed');
              } finally {
                setTestingIds((s) => s.filter((id) => id !== p.id));
              }
            }}
          />
        ))}
        <div
          key="add-printer"
          className={`bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg shadow hover:shadow-lg transition p-6 flex items-center justify-center cursor-pointer ${
            creating ? 'opacity-60 pointer-events-none' : ''
          }`}
          onClick={async () => {
            if (creating) return;
            let name = '';
            let model = '';
            let iface = '';

            // show a small modal dialog to collect name, model and interface
            const result = await new Promise<{ name: string; model: string; iface: string } | null>((resolve) => {
              const dlg = document.createElement('dialog');
              dlg.style.padding = '0';
                dlg.innerHTML = `
                <form method="dialog" style="padding:16px; min-width:320px; max-width:90vw; font-family:inherit; background:#fff; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.15);">
                <h3 style="margin:0 0 12px">Create Printer</h3>
                <label style="display:block; margin-bottom:8px">
                Name<br/><input name="name" required style="width:100%; padding:6px; box-sizing:border-box;" />
                </label>
                <label style="display:block; margin-bottom:12px">
                Model<br/>
                <input name="model" style="width:100%; padding:6px; box-sizing:border-box;" />
                </label>
                <label style="display:block; margin-bottom:8px">
                Interface<br/>
                <select name="interface" style="width:100%; padding:6px; box-sizing:border-box;">
                  <option value="lan">BambuLab LAN</option>
                  <option value="octoprint">OctoPrint</option>
                  <option value="test-errors">Test with Errors</option>
                </select>
                </label>
                <div style="display:flex; gap:8px; justify-content:flex-end;">
                <button value="cancel" type="reset" style="padding:6px 10px;">Cancel</button>
                <button value="default" type="submit" style="padding:6px 10px;">Create</button>
                </div>
                </form>
                `;

                // center the dialog on screen and give it a subtle style
                Object.assign(dlg.style, {
                position: 'fixed',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                padding: '0',
                border: 'none',
                background: 'transparent',
                zIndex: '2147483647', // ensure on top
                });
              document.body.appendChild(dlg);
              (dlg as HTMLDialogElement).showModal();

              const form = dlg.querySelector('form')!;
              const onClose = () => {
              if (document.body.contains(dlg)) dlg.remove();
              };

              form.addEventListener('submit', (e) => {
              e.preventDefault();
              const f = e.currentTarget as HTMLFormElement;
              const fn = (f.elements.namedItem('name') as HTMLInputElement).value.trim();
              const fi = (f.elements.namedItem('interface') as HTMLSelectElement).value;
              const fm = (f.elements.namedItem('model') as HTMLInputElement).value.trim();
              onClose();
              resolve({ name: fn, model: fm, iface: fi });
              });

              form.addEventListener('reset', () => {
              onClose();
              resolve(null);
              });

              // close on outside click / Esc
              dlg.addEventListener('cancel', () => {
              onClose();
              resolve(null);
              });
            });

            if (!result) {
              // user cancelled
              name = '';
            } else {
              name = result.name;
              model = result.model;
              switch (result.iface) {
                case 'lan':
                  iface = 'LAN';
                  break;
                case 'octoprint':
                  iface = 'OCTOPRINT';
                  break;
                case 'test-errors':
                  iface = 'TROUBLES';
                  break;
                default:
                  iface = result.iface;
              }

              if (!name) {
              // nothing to create
              name = '';
              } else {
              setCreating(true);
              try {
                // create printer including model and interface
                const axiosRes = await api.post('/printers', { name, model, interface: iface });
                const resOk = axiosRes.status >= 200 && axiosRes.status < 300;
                if (!resOk) throw new Error(`Failed to create printer: ${axiosRes.status} ${axiosRes.statusText}`);

                const data: any = axiosRes.data;
                const created = data?.printer ?? data;
                const newPrinter = {
                id: created?.id ?? created?._id ?? `local-${Date.now()}`,
                name: created?.name ?? name,
                status: created?.status ?? 'offline',
                } as Printer;

                setPrinters((prev) => [newPrinter, ...prev]);
                showNotification('success', data?.message ?? 'Printer created');
              } catch (err: any) {
                showNotification('error', err?.message ?? 'Failed to create printer');
              } finally {
                setCreating(false);
              }

              // ensure the outer creation flow is skipped (outer code checks `if (!name) return;`)
              name = '';
              }
            }
            
            if (!name) return;

            setCreating(true);
            try {
              const axiosRes = await api.post('/printers', { name });
              const resOk = axiosRes.status >= 200 && axiosRes.status < 300;
              if (!resOk) throw new Error(`Failed to create printer: ${axiosRes.status} ${axiosRes.statusText}`);

              const data: any = axiosRes.data;
              // normalize returned shape
              const created = data?.printer ?? data;
              const newPrinter = {
                id: created?.id ?? created?._id ?? `local-${Date.now()}`,
                name: created?.name ?? name,
                status: created?.status ?? 'offline',
              } as Printer;

                setPrinters((prev) => [newPrinter, ...prev]);
              } catch (err: any) {
                showNotification('error', err?.message ?? 'Failed to create printer');
              } finally {
                setCreating(false);
              }
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
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">{creating ? 'Creating...' : 'Add Printer'}</p>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}