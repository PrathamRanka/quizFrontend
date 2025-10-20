"use client";

import React, { useState } from 'react';
import api from '../services/api';
import AdminRoute from '../contexts/AdminRoute'; 

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/export-results', {
        responseType: 'blob',
      });

      
      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'quiz-results.csv');

      document.body.appendChild(link);
      link.click();
      
      
      window.URL.revokeObjectURL(url);
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }

    } catch (err) {
      setError("Failed to download results. You may not have permission, or there are no results to export.");
      console.error("Download error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-lg text-gray-600 mt-2">Manage your quiz and export results.</p>
          </header>

          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800">Export Quiz Results</h2>
            <p className="text-gray-500 mt-2 mb-6">
              Click the button below to download a CSV file containing the name, roll number, email, phone number, and score for all completed quiz sessions.
            </p>

            {error && <p className="text-red-600 bg-red-50 p-3 rounded-md mb-4">{error}</p>}
            
            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                'Download Results CSV'
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}
