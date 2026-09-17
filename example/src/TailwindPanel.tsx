export function TailwindPanel() {
  return (
    <aside className="rounded-3xl border border-slate-700 bg-slate-900/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Tailwind sample</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-50">Utility-class component</h2>
        </div>
        <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-300">
          Beta
        </span>
      </div>

      <p className="mt-4 max-w-prose text-sm leading-6 text-slate-300">
        Tailwind classes live here so the example folder contains a realistic React component styled through utilities.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <button className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-400">
          Accept
        </button>
        <button className="rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-400 hover:bg-slate-800">
          Dismiss
        </button>
      </div>
    </aside>
  );
}