"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function SignupPage() {
  const [formData, setFormData] = useState({ fullName: '', rollNumber: '', phoneNumber: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (Object.values(formData).some(val => val === '')) {
      return setError('Please fill in all fields.');
    }
    setLoading(true);
    const result = await signup(formData);
    if (result.success) {
      router.push('/quiz/instructions');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
            <img className="h-20 mx-auto mb-4" src="/owasp_logo.png" alt="OWASP Logo"/>
            <h2 className="text-3xl font-bold text-gray-900">Create an Account</h2>
            <p className="mt-2 text-gray-600">Join the OWASP Student Chapter recruitment quiz.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input fields for fullName, rollNumber, phoneNumber, email, password */}
            {Object.keys(formData).map(key => (
              <div key={key}>
                <label htmlFor={key} className="block text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                <input
                  id={key}
                  name={key}
                  type={key === 'password' ? 'password' : (key === 'email' ? 'email' : 'text')}
                  required
                  value={formData[key]}
                  onChange={handleChange}
                  placeholder={`Enter your ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            ))}
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            <div className="text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">Sign in here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
