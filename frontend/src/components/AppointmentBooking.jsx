import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AppointmentBooking = ({ onBookingSuccess }) => {
  const [formData, setFormData] = useState({
    doctor: '',
    patient: '',
    date: '',
    time: ''
  });
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      const [doctorsRes, patientsRes] = await Promise.all([
        api.get('/doctors/'),
        api.get('/patients/')
      ]);
      setDoctors(doctorsRes.data);
      setPatients(patientsRes.data);
    } catch (err) {
      console.error('Error fetching form data:', err);
      setError('Failed to load doctors and patients list.');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResponse(null);

    if (!formData.doctor || !formData.patient || !formData.date || !formData.time) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/appointments/', formData);
      setResponse(res.data);
      
      setFormData({
        doctor: '',
        patient: '',
        date: '',
        time: ''
      });
      
      if (onBookingSuccess) {
        onBookingSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create appointment. Please try again.');
      console.error('Appointment creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-white/60 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 -m-20 w-60 h-60 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 left-0 -m-20 w-60 h-60 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="relative z-10">
        <h2 className="text-2xl font-bold text-slate-800 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          </div>
          Book Appointment
        </h2>

        {/* Success Output Frame */}
        {response && (
          <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl shadow-sm transform transition-all duration-500 hover:scale-[1.02]">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-emerald-800 font-bold text-xl">Booking Confirmed!</h3>
                <p className="text-emerald-600 text-sm">Your appointment is locked in.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm text-center">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Generated Token</p>
                <p className="text-3xl font-extrabold text-emerald-600">#{response.token}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm text-center">
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Wait Time (Est.)</p>
                <div className="flex items-center justify-center gap-1 text-slate-700">
                  <p className="text-3xl font-extrabold">{response.wait_time}</p>
                  <span className="text-sm font-medium pt-2">mins</span>
                </div>
              </div>
            </div>
            <button onClick={() => setResponse(null)} className="mt-5 w-full bg-emerald-100 text-emerald-700 py-2 rounded-lg font-medium hover:bg-emerald-200 transition-colors">
              Book Another Appointment
            </button>
          </div>
        )}

        {!response && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3"><p className="text-sm text-rose-700">{error}</p></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Doctor Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Doctor</label>
                <div className="relative">
                  <select
                    name="doctor"
                    value={formData.doctor}
                    onChange={handleChange}
                    disabled={fetchLoading}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{fetchLoading ? 'Loading doctors...' : 'Choose a doctor'}</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialization}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Patient Dropdown */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Patient</label>
                <div className="relative">
                  <select
                    name="patient"
                    value={formData.patient}
                    onChange={handleChange}
                    disabled={fetchLoading}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{fetchLoading ? 'Loading patients...' : 'Choose a patient'}</option>
                    {patients.map(pat => (
                      <option key={pat.id} value={pat.id}>{pat.name} {pat.contact ? `(${pat.contact})` : ''}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Date Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-text"
                  />
                </div>
              </div>

              {/* Time Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Time</label>
                <div className="relative">
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-text"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || fetchLoading || !formData.doctor || !formData.patient || !formData.date || !formData.time}
                className="w-full relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-indigo-500/30 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AppointmentBooking;
