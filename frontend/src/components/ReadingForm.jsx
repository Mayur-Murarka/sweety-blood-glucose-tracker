import React, { useState, useEffect } from 'react';
import { PlusCircle, Edit3, X, Calendar, Clock, Activity } from 'lucide-react';
import Alert from './Alert';

const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

export default function ReadingForm({
  onSubmit,
  editingReading = null,
  onCancelEdit = null,
  isSubmitting = false,
  apiError = null,
}) {
  const getTodayStr = () => {
    const today = new Date();
    return [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
  };

  const [date, setDate] = useState(editingReading ? editingReading.reading_date : getTodayStr());
  const [slot, setSlot] = useState(editingReading ? editingReading.slot : SLOTS[0]);
  const [value, setValue] = useState(editingReading ? String(editingReading.glucose_value) : '');
  const [validationError, setValidationError] = useState('');

  // Sync state if editing reading changes
  useEffect(() => {
    if (editingReading) {
      setDate(editingReading.reading_date);
      setSlot(editingReading.slot);
      setValue(String(editingReading.glucose_value));
      setValidationError('');
    } else {
      setDate(getTodayStr());
      setSlot(SLOTS[0]);
      setValue('');
      setValidationError('');
    }
  }, [editingReading]);

  // Validation according to specification
  const validateForm = () => {
    // 1. Value is required: "Please enter a glucose value."
    if (value === undefined || value === null || String(value).trim() === '') {
      return 'Please enter a glucose value.';
    }

    // 2. Value must be a whole number between 40 and 600: "Value must be between 40 and 600 mg/dl."
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num) || num < 40 || num > 600) {
      return 'Value must be between 40 and 600 mg/dl.';
    }

    // 3. Date cannot be in the future: "Date cannot be in the future."
    const todayStr = getTodayStr();
    if (!date) {
      return 'Please select a date.';
    }
    if (date > todayStr) {
      return 'Date cannot be in the future.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }

    const payload = {
      date,
      slot,
      value: parseInt(value, 10),
    };

    try {
      await onSubmit(payload);
      if (!editingReading) {
        // Reset value for next entry on same day
        setValue('');
      }
    } catch (err) {
      // Backend error (e.g. duplicate slot or max 4 readings)
      setValidationError(err.message || 'An error occurred while saving reading.');
    }
  };

  const activeError = validationError || apiError;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          {editingReading ? (
            <>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Edit Reading</h3>
                <p className="text-xs text-slate-500">Update recorded glucose reading</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Record New Reading</h3>
                <p className="text-xs text-slate-500">Log up to 4 glucose readings per day</p>
              </div>
            </>
          )}
        </div>

        {editingReading && onCancelEdit && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Error alert banner */}
      {activeError && (
        <div className="mb-4">
          <Alert
            type="error"
            message={activeError}
            onClose={() => setValidationError('')}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4" data-testid="reading-form">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Date Picker */}
          <div>
            <label htmlFor="reading-date" className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date</span>
            </label>
            <input
              id="reading-date"
              data-testid="reading-date-input"
              type="date"
              max={getTodayStr()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setValidationError('');
              }}
              required
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Time Slot Selector */}
          <div>
            <label htmlFor="reading-slot" className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Time Slot</span>
            </label>
            <select
              id="reading-slot"
              data-testid="reading-slot-select"
              value={slot}
              onChange={(e) => {
                setSlot(e.target.value);
                setValidationError('');
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Glucose Value Input */}
          <div>
            <label htmlFor="reading-value" className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 mb-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-400" />
              <span>Glucose (mg/dl)</span>
            </label>
            <div className="relative">
              <input
                id="reading-value"
                data-testid="reading-value-input"
                type="number"
                placeholder="e.g. 115"
                min="40"
                max="600"
                step="1"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setValidationError('');
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors pr-14"
              />
              <span className="absolute right-3 top-2.5 text-xs font-medium text-slate-400 pointer-events-none">
                mg/dl
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="submit-reading-button"
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {editingReading ? (
              <>
                <Edit3 className="w-4 h-4" />
                <span>{isSubmitting ? 'Updating...' : 'Update Reading'}</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Add Reading'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
