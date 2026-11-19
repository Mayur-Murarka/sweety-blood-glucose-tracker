import React, { useState, useEffect } from 'react';
import { doctorApi, reminderApi } from '../services/api';
import ReportCard from '../components/ReportCard';
import GlucoseChart from '../components/GlucoseChart';
import Alert from '../components/Alert';
import {
  Users,
  UserPlus,
  Stethoscope,
  Calendar,
  Activity,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function DoctorPortalPage() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [patientReportData, setPatientReportData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [assignEmail, setAssignEmail] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isTriggeringReminder, setIsTriggeringReminder] = useState(false);
  const [alert, setAlert] = useState(null);
  const [reminderResult, setReminderResult] = useState(null);

  // Load assigned patients
  const fetchPatients = async () => {
    setIsLoadingPatients(true);
    try {
      const data = await doctorApi.getAssignedPatients();
      setPatients(data.patients);
      if (data.patients.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data.patients[0].id);
      }
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to load assigned patients.' });
    } finally {
      setIsLoadingPatients(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Load selected patient reports
  useEffect(() => {
    if (!selectedPatientId) return;

    async function loadReports() {
      setIsLoadingReports(true);
      try {
        const data = await doctorApi.getPatientReports(selectedPatientId, selectedDate);
        setPatientReportData(data);
      } catch (err) {
        setAlert({ type: 'error', message: err.message || 'Failed to fetch patient reports.' });
      } finally {
        setIsLoadingReports(false);
      }
    }

    loadReports();
  }, [selectedPatientId, selectedDate]);

  const handleAssignPatient = async (e) => {
    e.preventDefault();
    if (!assignEmail.trim()) return;

    setIsAssigning(true);
    setAlert(null);
    try {
      const res = await doctorApi.assignPatient(assignEmail.trim());
      setAlert({ type: 'success', message: res.message });
      setAssignEmail('');
      await fetchPatients();
      setSelectedPatientId(res.patient.id);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to assign patient.' });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTriggerReminders = async () => {
    setIsTriggeringReminder(true);
    setReminderResult(null);
    try {
      const res = await reminderApi.triggerReminders(selectedDate);
      setReminderResult(res);
      setAlert({
        type: 'success',
        message: 'BullMQ Daily Compliance Check triggered and executed successfully!',
      });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to trigger reminder queue.' });
    } finally {
      setIsTriggeringReminder(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-3xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <Stethoscope className="w-8 h-8 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold">Doctor Clinician Portal</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-400 text-emerald-950 rounded-full">
                  RBAC Active
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1">
                Monitor assigned diabetes patients, review glycemic history, and enforce daily compliance
              </p>
            </div>
          </div>

          {/* BullMQ Job Trigger Button */}
          <button
            onClick={handleTriggerReminders}
            disabled={isTriggeringReminder}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white text-emerald-900 rounded-xl text-xs font-semibold shadow hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            <BellRing className={`w-4 h-4 ${isTriggeringReminder ? 'animate-spin' : ''}`} />
            <span>
              {isTriggeringReminder ? 'Running BullMQ Job...' : 'Run BullMQ Compliance Reminder Job'}
            </span>
          </button>
        </div>
      </div>

      {alert && (
        <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* BullMQ Job Results Banner */}
      {reminderResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>BullMQ Queue Execution Report ({reminderResult.status})</span>
            </div>
            {reminderResult.result && (
              <p className="text-slate-600">
                Evaluated <strong>{reminderResult.result.totalPatientsEvaluated}</strong> total patient(s). Dispatched <strong>{reminderResult.result.remindersCount}</strong> reminder notification(s) for patients with &lt;4 readings today.
              </p>
            )}
          </div>
          <button
            onClick={() => setReminderResult(null)}
            className="text-slate-400 hover:text-slate-600 font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Patient List & Patient Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Assigned Patients List & Link Form */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Assigned Patients</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                {patients.length}
              </span>
            </div>

            {isLoadingPatients ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading patients...</div>
            ) : patients.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No patients assigned yet. Use the form below to assign a patient.
              </div>
            ) : (
              <div className="space-y-2">
                {patients.map((p) => {
                  const isSelected = p.id === selectedPatientId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-300 shadow-sm'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[150px]">
                          {p.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-1.5 text-[10px]">
                          <span className="text-emerald-700 font-medium bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            {p.today_readings}/4 today
                          </span>
                          <span className="text-slate-400">
                            Total: {p.total_readings}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Assign Patient by Email Form */}
            <form onSubmit={handleAssignPatient} className="mt-4 pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assign Patient by Email
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="email"
                  required
                  placeholder="patient@example.com"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center space-x-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAssigning ? '...' : 'Add'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Selected Patient Reports & Trends */}
        <div className="lg:col-span-3 space-y-4">
          {/* Patient Overview Bar & Date Picker */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-bold text-slate-900 text-base">
                  {selectedPatient ? selectedPatient.name : 'Select a Patient'}
                </h2>
                {selectedPatient && (
                  <span className="text-xs text-slate-500 font-mono">
                    ({selectedPatient.email})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Viewing clinical reports and glycemic patterns for this patient
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="doctor-date" className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>Date:</span>
              </label>
              <input
                id="doctor-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {isLoadingReports ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading patient clinical data...
            </div>
          ) : patientReportData ? (
            <>
              {/* Reports Grid (Daily, MTD, Monthly) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ReportCard
                  title="Daily Report"
                  rangeLabel={patientReportData.daily.label}
                  stats={patientReportData.daily}
                  isDaily={true}
                />
                <ReportCard
                  title="Month-to-Date"
                  rangeLabel={patientReportData.monthToDate.label}
                  stats={patientReportData.monthToDate}
                />
                <ReportCard
                  title={`Monthly (${patientReportData.monthly.monthName || 'Previous Month'})`}
                  rangeLabel={patientReportData.monthly.label}
                  stats={patientReportData.monthly}
                />
              </div>

              {/* Patient Glucose Trend Chart */}
              {patientReportData.chartReadings && patientReportData.chartReadings.length > 0 && (
                <div className="mt-4">
                  <GlucoseChart
                    readings={patientReportData.chartReadings}
                    title={`${selectedPatient?.name}'s Glycemic Progression (${patientReportData.monthToDate.label})`}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-sm">
              Select an assigned patient from the list on the left to inspect their glycemic reports.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
