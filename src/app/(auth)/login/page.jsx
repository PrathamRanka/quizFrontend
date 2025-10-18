"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext'; 
import Link from 'next/link';

export default function LoginPage() {
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth(); 
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!rollNumber || !password) {
      return setError('Please fill in all fields.');
    }
    setLoading(true);
    const result = await login({ rollNumber, password });
    if (result.success) {
      router.push('/quiz/instructions');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
            <img className="h-20 mx-auto mb-4" src="/owasp_logo.png" alt="OWASP Logo"/>
            <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
            <p className="mt-2 text-gray-600">Enter your credentials to access the quiz portal.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="rollNumber" className="block text-sm font-medium text-gray-700 mb-1">Roll Number or Email</label>
              <input id="rollNumber" name="rollNumber" type="text" required value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="e.g., 21BCS..." className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"/>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"/>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">Sign up here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
