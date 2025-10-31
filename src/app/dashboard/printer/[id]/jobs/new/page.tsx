'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NewJobPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [modelId, setModelId] = useState('');
  const [name, setName] = useState('');
  const [filamentMaterial, setFilamentMaterial] = useState('');
  const [filamentColor, setFilamentColor] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | null>(null);
  const [printersList, setPrintersList] = useState<Array<{id:string;name:string}>>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | undefined>(id);
  const [uploading, setUploading] = useState(false);
  

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const notifTimerRef = useRef<number | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string, timeout = 5000) => {
    setNotification({ type, message });
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current);
    notifTimerRef.current = window.setTimeout(() => setNotification(null), timeout);
  };

  const uuidRegex = /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/;

  const validate = () => {
    const e: Record<string, string> = {};
    // a model must have been uploaded (we will create the model server-side)
    if (!modelId) e.model = 'Please upload a model file';

  const targetPrinter = selectedPrinterId ?? id;
  if (!targetPrinter) e.printer = 'Printer id is missing';
  else if (!uuidRegex.test(targetPrinter)) e.printer = 'Printer id is not a valid UUID';

    // if scheduled, ensure scheduledTime is valid
    if (isScheduled && !scheduledTime) e.scheduledTime = 'Scheduled time is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);

    try {
      // ensure we have a model_id which must come from the upload/sign response
      const finalModelId = modelId;
      if (!finalModelId) throw new Error('Model ID is required. Upload a model file so the server can create the model and return its id.');

      const body: any = {
        name: name || null,
        model_id: finalModelId,
        // send filament as an object with material and color; null if neither provided
        filament_material: filamentMaterial || null,
        filament_color: filamentColor || null,
        scheduled_time: scheduledTime ? scheduledTime.toISOString() : null,
      };

      const targetPrinterId = selectedPrinterId ?? id;
      const axiosRes = await api.post(`/printers/${encodeURIComponent(targetPrinterId ?? '')}/queue/add`, body);
      const ok = axiosRes.status >= 200 && axiosRes.status < 300;
      if (!ok) throw new Error(`${axiosRes.status} ${axiosRes.statusText}`);

        setName('');
        setModelId('');
        setFilamentMaterial('');
        setFilamentColor('');
        setIsScheduled(false);
        setScheduledTime(null);
        

      showNotification('success', 'Job created and added to the queue');
      // navigate back to printer page
      setTimeout(() => router.push(`/dashboard/printer/${encodeURIComponent(targetPrinterId ?? '')}`), 800);
    } catch (err: any) {
      showNotification('error', err?.response?.data?.error ?? err?.message ?? 'Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  // fetch printers list and current user on mount
  useEffect(() => {
    (async () => {
      try {
      const res = await api.get<any>('/printers');
      const data = res.data as any;
      const list = Array.isArray(data) ? data : data?.printers ?? [];
      setPrintersList(list.map((p: any) => ({ id: p.id ?? p._id, name: p.name })));
      } catch (e) {
        // ignore
      }

      // do not fetch user — server will take user from cookies; client should not show user input
    })();
  }, []);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      // request signed URL from backend
    const contentType =
        file.type ||
        (file.name.toLowerCase().endsWith('.gcode') ? 'text/x-gcode' : 'application/octet-stream');
    const signRes = await api.post<any>('/upload/sign', { filename: file.name, contentType });
      const signData = signRes?.data as { url?: string; key?: string; modelId?: string; };
      if (signData?.url) {
        // upload directly to signed URL
        await fetch(signData.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        // if sign endpoint returns a modelId directly, use it. We DO NOT create models client-side.
        if (signData.modelId) setModelId(signData.modelId);
        showNotification('success', 'File uploaded');
      } 
    //   else {
    //     // fallback: upload file to backend which should forward to R2
    //     const fd = new FormData();
    //     fd.append('file', file);
    //     const up = await api.post<any>('/uploads/r2', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    //     const upData = up?.data as any;
    //     if (upData?.model_id) {
    //       setModelId(upData.model_id);
    //     }
    //     showNotification('success', 'File uploaded');
    //   }
    } catch (err: any) {
      showNotification('error', err?.response?.data?.error ?? err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <button
        className="mb-4 inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        onClick={() => router.push(`/dashboard/printer/${encodeURIComponent(id ?? '')}`)}
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-4">Create New Job</h1>

      {notification && (
        <div
          className={`mb-4 p-3 rounded ${
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

      <form onSubmit={handleSubmit} className="max-w-xl">
        <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Job Name (optional)</label>
            <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 'Print Job 1'"
                className="w-full px-3 py-2 border rounded"
            />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Printer</label>
          <select
            value={selectedPrinterId ?? ''}
            onChange={(e) => setSelectedPrinterId(e.target.value || undefined)}
            disabled={Boolean(id)}
            className={`w-full px-3 py-2 border rounded ${Boolean(id) ? 'bg-gray-100 text-gray-600 cursor-not-allowed dark:bg-gray-700 dark:text-gray-300' : ''}`}
          >
            <option value="">Select a printer</option>
            {printersList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {id ? <p className="text-xs text-gray-500 mt-1">Printer locked from URL</p> : null}
        </div>

        {/* modelId is created automatically after upload; no manual input shown */}

        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">Upload Model (G-code)</label>
          <div className="border-dashed border-2 border-gray-200 p-4 rounded text-center">
            <input
              type="file"
              accept=".gcode,text/x-gcode,text/plain,application/octet-stream"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">Upload a G-code file (.gcode)</p>
            {uploading ? <p className="text-sm text-gray-500 mt-2">Uploading...</p> : null}
            {modelId ? (
              <p className="text-sm text-green-700 mt-2">Uploaded G-code: <span className="underline">{modelId}</span></p>
            ) : null}
            {modelId ? <p className="text-sm text-gray-600 mt-1">G-code processed (hidden id)</p> : null}
            {errors.model && <p className="text-xs text-red-600 mt-1">{errors.model}</p>}
          </div>
        </div>

        {/* user is taken from cookies on the server; no user input */}

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Filament material (optional)</label>
            <input value={filamentMaterial} onChange={(e) => setFilamentMaterial(e.target.value)} placeholder="e.g. PLA" className="w-full px-3 py-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Filament color (optional)</label>
            <input value={filamentColor} onChange={(e) => setFilamentColor(e.target.value)} placeholder="e.g. White" className="w-full px-3 py-2 border rounded" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Schedule</label>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center text-sm">
              <input
            type="radio"
            name="schedule"
            checked={!isScheduled}
            onChange={() => {
              setIsScheduled(false);
              setScheduledTime(null);
            }}
            className="mr-2"
              />
              Start now
            </label>

            <label className="inline-flex items-center text-sm">
              <input
            type="radio"
            name="schedule"
            checked={isScheduled}
            onChange={() => {
              setIsScheduled(true);
              if (!scheduledTime) setScheduledTime(new Date(Date.now() + 60 * 60000));
            }}
            className="mr-2"
              />
              Schedule (date & time)
            </label>
          </div>

          {isScheduled ? (
            <div className="mt-2">
              <input
            type="datetime-local"
            value={
              scheduledTime
                ? (() => {
                const d = scheduledTime;
                const pad = (n: number) => n.toString().padStart(2, '0');
                const year = d.getFullYear();
                const month = pad(d.getMonth() + 1);
                const day = pad(d.getDate());
                const hours = pad(d.getHours());
                const minutes = pad(d.getMinutes());
                return `${year}-${month}-${day}T${hours}:${minutes}`;
                  })()
                : ''
            }
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                setScheduledTime(null);
                setIsScheduled(false);
              } else {
                // "YYYY-MM-DDTHH:MM" parses as local time
                setScheduledTime(new Date(v));
                setIsScheduled(true);
              }
            }}
            className="w-full px-3 py-2 border rounded"
            placeholder="Select date & time"
              />
              {errors.scheduledTime && <p className="text-xs text-red-600 mt-1">{errors.scheduledTime}</p>}
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-2">Job will be queued immediately.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${submitting ? 'opacity-60 pointer-events-none' : ''}`}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
                Creating...
              </>
            ) : (
              'Create Job'
            )}
          </button>

          <button type="button" className="px-3 py-2 border rounded" onClick={() => router.push(`/dashboard/printer/${encodeURIComponent(id ?? '')}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
