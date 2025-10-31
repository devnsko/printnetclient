'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Printer } from '@/types/printer';

export default function PrinterPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const [printer, setPrinter] = useState<Printer | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const notifTimerRef = useRef<number | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', message: string, timeout = 5000) => {
    setNotification({ type, message });
    if (notifTimerRef.current) window.clearTimeout(notifTimerRef.current);
    notifTimerRef.current = window.setTimeout(() => setNotification(null), timeout);
  };

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    const fetchPrinter = async () => {
      try {
        setLoading(true);
        setError(null);

        const axiosRes = await api.get(`/printers/${encodeURIComponent(id)}`);
        const res = {
          ok: axiosRes.status >= 200 && axiosRes.status < 300,
          status: axiosRes.status,
          statusText: axiosRes.statusText,
          json: async () => axiosRes.data,
        };

        if (!res.ok) throw new Error(`Failed to fetch printer: ${res.status} ${res.statusText}`);

        const data: any = await res.json();
        if (!mounted) return;

        // Normalize to Printer shape as best as possible
        if (data && (data.id || data._id)) {
          const p = {
            id: data.id ?? data._id,
            name: data.name ?? data.displayName ?? `Printer ${data.id ?? data._id}`,
            model: data.model ?? 'Unknown',
            status: data.status,
            interface: data.interface,
            is_active: data.is_active,
            current_job_id: data.current_job_id,
            queue_id: data.queue_id,
            last_updated: data.last_updated,
          } as Printer;
          setPrinter(p);
        } else {
          // maybe API returns wrapper
          const d = Array.isArray(data) ? data[0] : data?.printer ?? data;
          if (d && (d.id || d._id)) {
            const p = {
              id: d.id ?? d._id,
              name: d.name ?? d.displayName ?? `Printer ${d.id ?? d._id}`,
              model: d.model ?? 'Unknown',
              status: d.status,
              interface: d.interface,
              is_active: d.is_active,
              current_job_id: d.current_job_id,
              queue_id: d.queue_id,
              last_updated: d.last_updated,
            } as Printer;
            setPrinter(p);
          } else {
            setPrinter(null);
          }
        }

        const jobsRes = await api.get(`/printers/${encodeURIComponent(id)}/queue/list`);
        const jobsData = jobsRes.data;
        if (Array.isArray(jobsData)) {
          setJobs(jobsData);
          // select first job by default
          if (jobsData.length > 0) setSelectedJobId(jobsData[0].id ?? jobsData[0]._id ?? String(0));
        } else {
          setJobs([]);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message ?? 'Unknown error');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPrinter();

    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div className="p-6">
      <button
        className="mb-4 inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        onClick={() => router.push('/dashboard')}
      >
        ← Back
      </button>

      {loading ? (
        <p>Loading printer...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
      ) : !printer ? (
        <p className="text-gray-600">Printer not found.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-6">
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
            <h1 className="text-2xl font-bold mb-2">{printer.name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">model: {printer.model}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">interface: {printer.interface}</p>

            <p className="mb-4">
              <strong>Status:</strong>{' '}
              <span className={`px-2 py-1 rounded text-sm ${
                (printer.status ?? 'unknown').toLowerCase() === 'online'
                  ? 'bg-green-100 text-green-800'
                  : (printer.status ?? 'unknown').toLowerCase() === 'offline'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
              >
                {printer.status ?? 'Unknown'}
              </span>
            </p>

            <div className="mt-4">
              <h2 className="text-lg font-medium mb-2">Raw details</h2>
              <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(printer, null, 2)}
              </pre>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                onClick={async () => {
                  if (!id) {
                    showNotification('error', 'Printer ID is missing');
                    return;
                  }
                  try {
                    setLoading(true);
                    const res = await api.put(`/printers/${encodeURIComponent(id)}/status`, { status: 'READY' });
                    if (res.status >= 200 && res.status < 300) {
                      setPrinter((p) => (p ? { ...p, status: 'READY' } : p));
                      showNotification('success', 'Printer status set to READY');
                    } else {
                      showNotification('error', `Failed to set status: ${res.status} ${res.statusText ?? ''}`);
                    }
                  } catch (err: any) {
                    showNotification('error', err?.message ?? 'Unknown error');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Start
              </button>
              <button
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                onClick={() =>
                  id
                    ? router.push(`/dashboard/printer/${encodeURIComponent(id)}/jobs/new`)
                    : showNotification('error', 'Printer ID is missing')
                }
              >
                Send new Job
              </button>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-3">Jobs</h3>
              {jobs.length === 0 ? (
                <p className="text-sm text-gray-500">No jobs found for this printer.</p>
              ) : (
                <ul className="space-y-2">
                  {jobs.map((job, idx) => {
                    const jid = job.id ?? job._id ?? String(idx);
                    const isSelected = jid === selectedJobId;
                    const jobStatus = (job.status ?? 'unknown').toLowerCase();
                    const jobStatusClasses =
                      jobStatus === 'running'
                        ? 'bg-green-100 text-green-800'
                        : jobStatus === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : jobStatus === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800';

                    return (
                      <li
                        key={jid}
                        onClick={() => setSelectedJobId(jid)}
                        className={`p-3 rounded cursor-pointer border ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-900'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="text-sm font-medium">{job.name ?? `Job ${jid}`}</div>
                          {job.status === 'SCHEDULED' && job.scheduled_time && (
                            <p className="text-xs text-gray-500 mb-2">Scheduled Time: {new Date(job.scheduled_time).toLocaleString()}</p>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${jobStatusClasses}`}>{job.status ?? 'Unknown'}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">ID: {jid}</div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Selected Job</h4>
                {selectedJobId ? (
                  (() => {
                    const sel = jobs.find((j) => (j.id ?? j._id ?? String(j)) === selectedJobId);
                    if (!sel) return <p className="text-sm text-gray-500">Job not found.</p>;

                    const steps = sel.steps ?? sel.status_history ?? sel.stages ?? [];

                    return (
                      <div>
                        <p className="text-sm font-medium mb-1">{sel.name ?? selectedJobId}</p>
                        <p className="text-xs text-gray-500 mb-2">Status: {sel.status ?? 'Unknown'}</p>

                        {Array.isArray(steps) && steps.length > 0 ? (
                          <ol className="list-decimal list-inside text-sm space-y-1">
                            {steps.map((s: any, i: number) => (
                              <li key={i} className="flex items-center justify-between">
                                <span>{s.name ?? s.step ?? `Step ${i + 1}`}</span>
                                <span className="text-xs text-gray-500">{s.status ?? s.state ?? ''}</span>
                              </li>
                            ))}
                          </ol>
                        ) : (
                          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-48 overflow-auto">{JSON.stringify(sel, null, 2)}</pre>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-sm text-gray-500">No job selected.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
