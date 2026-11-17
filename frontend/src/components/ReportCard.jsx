import React from 'react';
import { ArrowUp, ArrowDown, Activity, FileText, Calendar } from 'lucide-react';

export default function ReportCard({
  title,
  rangeLabel,
  stats,
  isDaily = false,
}) {
  const hasData = stats && stats.count > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
              <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Report
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{rangeLabel}</span>
            </div>
          </div>

          <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold">
            {stats ? stats.count : 0} {stats?.count === 1 ? 'Reading' : 'Readings'}
          </div>
        </div>

        {/* Stats Grid or Friendly Empty State */}
        {!hasData ? (
          <div className="py-8 px-4 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200 my-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No readings recorded</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              No glucose readings found for this date range. Record daily readings to see trends and reports.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 mb-4">
            {/* Highest */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center space-x-1 text-slate-500 text-xs font-medium mb-1">
                <ArrowUp className="w-3.5 h-3.5 text-rose-500" />
                <span>Highest</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold text-slate-900">{stats.highest}</span>
                <span className="text-[11px] text-slate-400">mg/dl</span>
              </div>
            </div>

            {/* Lowest */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center space-x-1 text-slate-500 text-xs font-medium mb-1">
                <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                <span>Lowest</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold text-slate-900">{stats.lowest}</span>
                <span className="text-[11px] text-slate-400">mg/dl</span>
              </div>
            </div>

            {/* Average */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center space-x-1 text-emerald-700 text-xs font-medium mb-1">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>Average</span>
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold text-emerald-900">
                  {stats.average !== null ? Number(stats.average).toFixed(1) : '-'}
                </span>
                <span className="text-[11px] text-emerald-600">mg/dl</span>
              </div>
            </div>
          </div>
        )}

        {/* Daily Report: Slot breakdown list */}
        {isDaily && hasData && stats.readings && stats.readings.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
              Readings by Time Slot
            </h4>
            <div className="space-y-2">
              {stats.readings.map((r) => (
                <div
                  key={r.id || r.slot}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <span className="font-medium text-slate-800">{r.slot}</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-900 text-sm">{r.glucose_value}</span>
                    <span className="text-slate-400 text-[11px]">mg/dl</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
