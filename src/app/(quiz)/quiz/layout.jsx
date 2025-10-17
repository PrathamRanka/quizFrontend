"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthContext} from "../../../../contexts/AuthContext";

export default function PreQuizLayout({ children }) {
  const pathname = usePathname();
  const { user, logout } = AuthContext();

  const steps = [
    { label: "Instructions", path: "/quiz/instructions" },
    { label: "Permissions", path: "/quiz/permissions" },
    { label: "Camera Setup", path: "/quiz/camera" },
    { label: "Ready", path: "/quiz/ready" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.path === pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="px-6 py-3 bg-white shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/owasp_logo.png" alt="Logo" className="h-10"/>
          <h1 className="font-semibold text-xl text-gray-800 hidden sm:block">OWASP Quiz Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 hidden md:block">Welcome, {user?.fullName || 'Student'}</span>
          <button onClick={logout} className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">Logout</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto py-8 px-4">
        <h2 className="text-3xl font-bold text-gray-900">Pre-Quiz Setup</h2>
        <p className="text-gray-500 mb-8 mt-1">Let's ensure everything is working perfectly before you begin.</p>
        
        <div className="w-full max-w-3xl mx-auto mb-10">
            <div className="flex relative justify-between items-center">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
                {steps.map((step, index) => {
                    const isActive = index === currentStepIndex;
                    const isCompleted = index < currentStepIndex;
                    return (
                        <div key={index} className="flex flex-col items-center text-center z-10 bg-gray-50 px-2">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full border-2 font-bold transition-all duration-300 ${isActive ? "border-blue-500 bg-blue-500 text-white" : isCompleted ? "border-green-500 bg-green-500 text-white" : "border-gray-300 bg-white text-gray-400"}`}>
                                {isCompleted ? '✓' : index + 1}
                            </div>
                            <p className={`mt-2 text-xs sm:text-sm font-medium ${isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-500"}`}>{step.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>
        {children}
      </main>
    </div>
  );
};

