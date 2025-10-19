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

    // --- NEW: Strict Client-Side Validation Logic ---
    const { fullName, rollNumber, phoneNumber, email, password } = formData;
    
    // Rule 1: All fields must be filled
    if (!fullName || !rollNumber || !phoneNumber || !email || !password) {
      return setError('Please fill in all fields.');
    }
    // Rule 2: Roll Number must start with 1025 or 1024 and be 10 digits
    if ((!rollNumber.startsWith('1025') && !rollNumber.startsWith('1024')) || rollNumber.length !== 10 || !/^\d+$/.test(rollNumber)) {
      return setError('Invalid Roll Number. It must start with "1025" or "1024" and be 10 digits long.');
    }
    // Rule 3: Email must be a @thapar.edu address
    if (!email.endsWith('@thapar.edu')) {
      return setError('Invalid Email. You must use a "@thapar.edu" email address.');
    }
    // Rule 4: Phone number must be exactly 10 digits
    if (phoneNumber.length !== 10 || !/^\d+$/.test(phoneNumber)) {
      return setError('Invalid Phone Number. It must be exactly 10 digits.');
    }
    // Rule 5: Password must be at least 6 characters
    if (password.length < 6) {
      return setError('Password must be at least 6 characters long.');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
            <img className="h-20 mx-auto mb-4" src="/owasp_logo.png" alt="OWASP Logo"/>
            <h2 className="text-3xl font-bold text-gray-900">Create an Account</h2>
            <p className="mt-2 text-gray-600">Join the OWASP Student Chapter recruitment quiz.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {Object.keys(formData).map(key => {
              const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              return (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    id={key}
                    name={key}
                    type={key === 'password' ? 'password' : (key === 'email' ? 'email' : 'text')}
                    required
                    value={formData[key]}
                    onChange={handleChange}
                    placeholder={`Enter your ${label.toLowerCase()}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              );
            })}
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

