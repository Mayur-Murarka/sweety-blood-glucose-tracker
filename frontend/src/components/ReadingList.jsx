import React, { useState } from 'react';
import { Edit2, Trash2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

export default function ReadingList({
  readings = [],
  pagination = { total: 0, page: 1, limit: 20, totalPages: 1 },
  onPageChange,
  onEdit,
  onDelete,
  isLoading = false,
}) {
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Glucose level classification according to standard diabetes guidelines:
  // < 70 mg/dl: Hypoglycemia / Low
  // 70 - 140 mg/dl: In Target / Normal
  // 141 - 180 mg/dl: Elevated
  // > 180 mg/dl: High
  const getBadge = (val) => {
    if (val < 70) {
      return {
        label: 'Low',
        classes: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    }
    if (val <= 140) {
      return {
        label: 'Normal',
        classes: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      };
    }
    if (val <= 180) {
      return {
        label: 'Elevated',
        classes: 'bg-orange-100 text-orange-800 border-orange-200',
      };
    }
    return {
      label: 'High',
      classes: 'bg-rose-100 text-rose-800 border-rose-200',
    };
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = async (id) => {
    try {
      await onDelete(id);
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err.message || 'Failed to delete reading');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Recorded Readings</h3>
          <p className="text-xs text-slate-500">
            Total of {pagination.total} entries recorded
          </p>
        </div>

        {/* Rows indicator */}
        <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
          20 per page
        </span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Loading readings...
        </div>
      ) : readings.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No readings found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You have not recorded any blood glucose readings yet. Use the form above to add your first reading.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50/75 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Time Slot</th>
                  <th className="px-6 py-3.5">Glucose Level</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {readings.map((reading) => {
                  const badge = getBadge(reading.glucose_value);
                  const isConfirming = deleteConfirmId === reading.id;

                  return (
                    <tr
                      key={reading.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                        {reading.reading_date}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700">
                          {reading.slot}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-base font-bold text-slate-900">
                          {reading.glucose_value}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">mg/dl</span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border font-medium ${badge.classes}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                        {isConfirming ? (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="text-rose-600 font-medium">Delete?</span>
                            <button
                              onClick={() => handleConfirmDelete(reading.id)}
                              className="px-2 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-medium hover:bg-slate-300"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => onEdit(reading)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Reading"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteClick(reading.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Reading"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing{' '}
                <span className="font-medium text-slate-700">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium text-slate-700">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium text-slate-700">{pagination.total}</span>{' '}
                results
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => onPageChange(pagination.page - 1)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="px-2 text-slate-600 font-medium">
                  {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => onPageChange(pagination.page + 1)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
