import React, { useState, useEffect } from 'react';
import ReadingForm from '../components/ReadingForm';
import ReadingList from '../components/ReadingList';
import Alert from '../components/Alert';
import { readingApi } from '../services/api';
import { Activity, CheckCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReading, setEditingReading] = useState(null);
  const [alert, setAlert] = useState(null);

  const fetchReadings = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await readingApi.getReadings({ page, limit: 20 });
      setReadings(data.readings);
      setPagination(data.pagination);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load readings' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings(1);
  }, []);

  const handleFormSubmit = async (readingData) => {
    setIsSubmitting(true);
    setAlert(null);

    try {
      if (editingReading) {
        await readingApi.updateReading(editingReading.id, readingData);
        setAlert({ type: 'success', message: 'Glucose reading updated successfully!' });
        setEditingReading(null);
      } else {
        await readingApi.createReading(readingData);
        setAlert({ type: 'success', message: 'Glucose reading recorded successfully!' });
      }

      // Refresh readings list
      await fetchReadings(pagination.page);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (reading) => {
    setEditingReading(reading);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingReading(null);
  };

  const handleDelete = async (id) => {
    try {
      await readingApi.deleteReading(id);
      setAlert({ type: 'success', message: 'Reading deleted successfully.' });
      if (editingReading?.id === id) {
        setEditingReading(null);
      }
      fetchReadings(pagination.page);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete reading.' });
    }
  };

  const handlePageChange = (newPage) => {
    fetchReadings(newPage);
  };

  // Quick summary counts for today
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayReadings = readings.filter((r) => r.reading_date === todayStr);
  const todayCount = todayReadings.length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Today's Entries</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">{todayCount}</span>
              <span className="text-xs text-slate-400">/ 4 max daily</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Latest Reading</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900">
                {readings.length > 0 ? readings[0].glucose_value : '-'}
              </span>
              <span className="text-xs text-slate-400">mg/dl</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Target Glucose Zone</p>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-lg font-bold text-slate-900">70 - 140</span>
              <span className="text-xs text-slate-400">mg/dl (ADA normal)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Alert Notification */}
      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      {/* Reading Entry Form */}
      <ReadingForm
        onSubmit={handleFormSubmit}
        editingReading={editingReading}
        onCancelEdit={handleCancelEdit}
        isSubmitting={isSubmitting}
      />

      {/* Readings Table with Pagination */}
      <ReadingList
        readings={readings}
        pagination={pagination}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
