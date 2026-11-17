import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function GlucoseChart({ readings = [], title = 'Blood Glucose Trend' }) {
  if (!readings || readings.length === 0) {
    return null;
  }

  // Format data for chart
  const chartData = readings.map((r, index) => {
    // Abbreviate slot for clean axis
    const shortSlot = r.slot
      .replace('Morning (fasting)', 'Fast')
      .replace('After breakfast', 'Post-Brk')
      .replace('After lunch', 'Post-Lunch')
      .replace('After dinner', 'Post-Din');

    return {
      index: index + 1,
      date: r.reading_date,
      displayDate: `${r.reading_date.slice(5)} (${shortSlot})`,
      slot: r.slot,
      value: r.glucose_value,
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700">
          <p className="font-semibold text-emerald-400">{data.date}</p>
          <p className="text-slate-300 mt-0.5">{data.slot}</p>
          <div className="mt-2 pt-2 border-t border-slate-700 flex items-baseline space-x-1">
            <span className="text-lg font-bold text-white">{data.value}</span>
            <span className="text-slate-400 text-[10px]">mg/dl</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">Continuous blood glucose progression over time</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Recorded Glucose</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-400"></span>
            <span>Target Zone (70-140)</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="displayDate"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              angle={-25}
              textAnchor="end"
              height={40}
            />
            <YAxis
              domain={[40, 'auto']}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              unit=" mg"
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* ADA target ranges */}
            <ReferenceLine y={70} stroke="#10b981" strokeDasharray="4 4" label={{ value: '70 Target Min', fill: '#10b981', fontSize: 10, position: 'insideBottomLeft' }} />
            <ReferenceLine y={140} stroke="#10b981" strokeDasharray="4 4" label={{ value: '140 Target Max', fill: '#10b981', fontSize: 10, position: 'insideTopLeft' }} />
            
            <Line
              type="monotone"
              dataKey="value"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#059669', strokeWidth: 1.5, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#047857' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
