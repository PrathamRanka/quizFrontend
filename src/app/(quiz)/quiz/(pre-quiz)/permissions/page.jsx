"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PermissionsPage() {
  const router = useRouter();
  const [cameraGranted, setCameraGranted] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const [error, setError] = useState("");

  const requestPermissions = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraGranted(stream.getVideoTracks().length > 0);
      setMicGranted(stream.getAudioTracks().length > 0);
    
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      setError("Permissions denied. Please allow camera and microphone access in your browser settings to continue.");
      console.error("Permission error:", err);
    }
  };
  
  
  useEffect(() => {
    requestPermissions();
  }, []);

  const allPermissionsGranted = cameraGranted && micGranted;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">System Permissions</h3>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-6 rounded-lg space-y-4">
        <p className="font-semibold">For proctoring purposes, this quiz requires access to your camera and microphone.</p>
        <div className="space-y-3">
          <StatusItem label="Camera Access" granted={cameraGranted} />
          <StatusItem label="Microphone Access" granted={micGranted} />
        </div>
      </div>
      
      {error && <p className="text-red-600 text-center font-semibold mt-6">{error}</p>}
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <button onClick={requestPermissions} className="w-full sm:w-auto border border-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
          Re-check Permissions
        </button>
        <button
          onClick={() => router.push("/quiz/camera")}
          disabled={!allPermissionsGranted}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-lg shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

const StatusItem = ({ label, granted }) => (
  <div className="flex items-center justify-between bg-white/50 p-3 rounded-md">
    <span className="font-medium text-gray-800">{label}</span>
    <span className={`font-bold text-sm px-3 py-1 rounded-full ${granted ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
      {granted ? "Granted ✓" : "Not Granted ✗"}
    </span>
  </div>
);
