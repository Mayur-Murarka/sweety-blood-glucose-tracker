import React, { useState, useEffect } from 'react';
import ReportCard from '../components/ReportCard';
import GlucoseChart from '../components/GlucoseChart';
import Alert from '../components/Alert';
import { reportApi } from '../services/api';
import { Calendar, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const getTodayStr = () => {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async (date) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportApi.getReports(date);
      setReportData(data);
    } catch (err) {
      setError(err.message || 'Failed to generate glucose reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Date Picker Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Glucose Analytics & Reports</h2>
          <p className="text-xs text-slate-500">
            View clinical summaries for Daily, Month-to-date, and whole previous month periods
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label htmlFor="report-date" className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 whitespace-nowrap">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Selected Date:</span>
          </label>
          <input
            id="report-date"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            max={getTodayStr()}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          />
          <button
            onClick={() => fetchReports(selectedDate)}
            title="Refresh Reports"
            className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {isLoading && !reportData ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Generating reports...
        </div>
      ) : reportData ? (
        <>
          {/* Reports Grid (Daily, Month-to-date, Monthly) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Daily Report */}
            <ReportCard
              title="Daily Report"
              rangeLabel={reportData.daily.label}
              stats={{ ...reportData.daily, fromCache: reportData.fromCache }}
              isDaily={true}
            />

            {/* 2. Month-to-date Report */}
            <ReportCard
              title="Month-to-Date"
              rangeLabel={reportData.monthToDate.label}
              stats={{ ...reportData.monthToDate, fromCache: reportData.fromCache }}
            />

            {/* 3. Monthly Report (Whole Previous Month) */}
            <ReportCard
              title={`Monthly (${reportData.monthly.monthName || 'Previous Month'})`}
              rangeLabel={reportData.monthly.label}
              stats={{ ...reportData.monthly, fromCache: reportData.fromCache }}
            />
          </div>

          {/* Interactive Trend Chart (Bonus Recharts) */}
          {reportData.chartReadings && reportData.chartReadings.length > 0 && (
            <div className="mt-8">
              <GlucoseChart
                readings={reportData.chartReadings}
                title={`Month-to-Date Glucose Trend (${reportData.monthToDate.label})`}
              />
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
