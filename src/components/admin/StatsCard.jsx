import React from "react";
import { FaArrowRight } from "react-icons/fa";

function StatsCard({
  icon,
  iconColor = "text-slate-400",
  title,
  value,
  total,
  badge,
  badgeColor = "text-slate-400",
  barColor = "bg-blue-500",
  progress,
  footer,
}) {
  const totalNum = total !== undefined && total !== null ? Number(total) : null;
  const valueNum = Number(value);
  const progressPct =
    totalNum && totalNum > 0
      ? Math.min((valueNum / totalNum) * 100, 100)
      : progress !== undefined
      ? progress
      : 60;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex-1 p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className={`text-xl ${iconColor}`}>{icon}</div>
          {badge && (
            <span className={`text-[11px] font-semibold italic ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>

        <div className="mb-1.5 flex items-baseline gap-1">
          <span className="text-[2.6rem] font-black leading-none tracking-tight text-slate-900">
            {value}
          </span>
          {totalNum !== null && (
            <span className="ml-0.5 text-base font-semibold text-slate-400">
              / {total}
            </span>
          )}
        </div>

        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.11em] text-slate-500">
          {title}
        </p>
      </div>

      <div className="h-[3px] w-full bg-slate-100">
        <div
          className={`h-full rounded-r-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {footer !== undefined && (
        <div className="flex items-center gap-1.5 border-t border-slate-50 px-5 py-2.5 text-[11px] text-slate-400">
          {footer || (
            <>
              <FaArrowRight className="text-[9px]" />
              <span>Ko'rish</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default StatsCard;
