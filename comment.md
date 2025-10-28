/**
 * Frontend: Smart 3D Printing Queue System (React / Next.js)
 * =========================================================
 * Purpose
 * -------
 * The frontend is a single-page web application (comunicating with backend server) that lets team members monitor printers,
 * create and manage print jobs, upload models, and observe real-time telemetry and events.
 *
 * UX Goals
 * --------
 * - Provide a clear Dashboard with printer cards showing status, progress, temps, ETA.
 * - Offer simple job creation flow: upload model → choose printer → set job settings → queue.
 * - Provide a Printer Detail view: live progress, temp chart, queue, and controls (start/pause/cancel).
 * - Job History: sortable/filterable list with owner, printer, duration, and status.
 * - Responsive layout for mobile checks.
 * 
 * Functional overview:
 *  ------------------------------------------------------------------------
 *  1. **Authentication** — users log in via API (auth table).
 *  2. **Dashboard View** — displays all printers with status indicators:
 *        - Printer name and model
 *        - Queue length
 *        - Current job progress (%)
 *        - Temperatures (nozzle/bed)
 *  3. **Queue Management**
 *        - Show job list for each printer
 *        - Create new job (select model, filament, settings)
 *        - Cancel, reorder, or pause jobs
 *  4. **Model Uploads**
 *        - Upload .stl or .gcode files → stored in backend + DB `models`.
 *        - Metadata (author, size, creation date) visible in model list.
 *  5. **Job Settings**
 *        - Optional temperature/speed overrides per job (for OctoPrint printers)
 *        - For BambuLab, display planned settings but no live modification.
 *  6. **Real-time updates**
 *        - WebSocket connection to backend to reflect live progress,
 *          queue changes, and temperature fluctuations.
 *
 * Tech stack:
 *  - Next.js or React + TypeScript
 *  - TailwindCSS + Shadcn UI for interface
 *  - Zustand/Redux for local state management
 *  - WebSocket and REST API integration with backend
 *
 * Data relationships shown in UI:
 *  - Printer → Queue → Jobs → Model → User
 *  - Each job references one filament profile
 *
 * Future Enhancements:
 *  - 3D viewer for uploaded models (.stl preview)
 *  - Mobile dashboard for monitoring prints
 *  - Notifications via Telegram or PWA
 *  - Filament inventory management (track remaining material)
 *
 * REST calls & sample flows
 * -------------------------
 * Auth:
 * - POST /auth/login -> store JWT, attach to axios header
 * - POST /auth/register -> redirect to login or auto-login
 *
 * Dashboard:
 * - GET /printers -> show tiles
 * - On connect, open WebSocket, subscribe to events:
 *    ws.on('printer.status', payload => updatePrinterState(payload))
 *    ws.on('job.progress', payload => updateJobProgress(payload))
 *
 * Job creation flow:
 * 1. User opens JobForm, uploads STL/GCODE (FileUploader sends to /models/upload).
 * 2. Upload returns modelId and fileUrl.
 * 3. User picks printer and optional job settings (nozzle_temp, bed_temp, speed).
 * 4. POST /jobs with model_id + printer_id + job_settings.
 * 5. Server returns created job and queue position.
 * 6. UI shows "queued" and displays estimated position in queue.
 *
 * Printer detail:
 * - Real-time chart (TempGraph) fed by ws events (printer.status) and historical /printer/:id/temperatures
 * - Controls (start/pause/stop) call REST endpoints that trigger backend -> adapter commands.
 *
 * WebSocket event handling & UX updates
 * ------------------------------------
 * - job.started: set local job.status = 'printing', set started_at
 * - job.progress: update progress UI and ETA
 * - job.finished: move job to history list, show toast/notification
 * - printer.status/error: display banner, disable controls for that printer
 *
 * UI components expectations (for Copilot)
 * ---------------------------------------
 * - PrinterCard: small component with name, state badge, progress bar, current job name, quick controls
 * - JobForm: file upload + select printer + settings inputs + submit button
 * - PrinterDetail: large progress + temp graph + queue list (draggable reorder)
 * - TempGraph: time-series line chart (x=time, y=temp) with nozzle and bed series
 *
 * UX decision & limitations
 * -------------------------
 * - For Bambu printers, job control buttons should be disabled if adapter reports unsupported operations (e.g., live temp change).
 * - Show filament info coming from printer if available; otherwise show manual field and a quick "update filament" action.
 * - Avoid heavy client-side slicing: server or desktop slicer remains source of truth for GCODE parameters.
 *
 * Security & tokens
 * -----------------
 * - Store JWT in memory (Zustand) or httpOnly cookie if using next-auth or server sessions.
 * - Attach token to axios default headers: Authorization: Bearer <token>.
 *
 * Offline handling & reconnection
 * -------------------------------
 * - If WebSocket disconnects, show "connection lost" and fallback to periodic REST polling every 10s.
 * - On reconnect, fetch full state snapshot: GET /printers + GET /jobs to ensure consistency.
 *
 * Accessibility & design
 * ----------------------
 * - Use clear status colors (green/amber/red) and text labels.
 * - Ensure keyboard navigation for job actions and forms.
 * - Provide small tooltips explaining each printer capability (why some buttons disabled).
 *
 * Testing & development shortcuts
 * ------------------------------
 * - Provide a "mock mode" that uses mocked adapters and canned events to simulate printing.
 * - Mock mode should expose a UI button "simulate print" to run through a job lifecycle for demo.
 *
 * Deployment notes
 * ----------------
 * - Host frontend on Vercel / Netlify (free).
 * - Configure environment variables for API base URL.
 * - Ensure CORS configured on backend to allow frontend origin.
 *
 * How Copilot should use this
 * ---------------------------
 * - When suggesting components, prefer explicit prop types for all components listed above.
 * - Autogenerate API helper functions matching backend endpoints (auth, printers, jobs, models).
 * - Provide typed hooks (useJobs, usePrinters) that interact with WebSocket and REST fallback.
 *
 * Author: Denys (devnsko) — for BioAddMed 3D Printing Lab prototype
 */
