import React from "react";

function StatsCard({ icon, title, value, gradient, iconBg }) {
  return (
    <div className={`group relative overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-34px_rgba(15,23,42,0.55)]`}>
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-80 blur-sm`} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-4 truncate text-xs font-black uppercase tracking-[0.12em] text-slate-500">{title}</p>
          <p className="text-3xl font-black tracking-tight text-slate-950">{value}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full w-2/3 rounded-full bg-gradient-to-r ${iconBg.replace("bg-gradient-to-br", "")}`} />
          </div>
        </div>
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${iconBg} text-xl text-white shadow-lg shadow-slate-200/80`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
