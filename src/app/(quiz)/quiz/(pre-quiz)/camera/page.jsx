"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CameraSetupPage() {
  const videoRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    let stream;
    const enableCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Camera access is required. Please allow it and refresh the page.");
      }
    };
    enableCamera();

    // Cleanup function to stop the camera stream when the component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <h3 className="text-2xl font-bold text-center mb-2 text-gray-800">Camera Setup</h3>
      <p className="text-center text-gray-500 mb-6">Position yourself correctly in the frame.</p>

      <div className="flex justify-center mb-6">
        <div className="rounded-lg overflow-hidden border-2 border-gray-300 w-full max-w-2xl aspect-video bg-black">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="bg-green-50 border-l-4 border-green-400 text-green-800 p-6 rounded-lg">
        <h4 className="font-semibold text-lg mb-2">Positioning Checklist</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Ensure your face is clearly visible and in the center.</li>
          <li>Make sure the room is well-lit.</li>
          <li>Remove any hats, sunglasses, or items obscuring your face.</li>
        </ul>
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={() => router.push("/quiz/ready")}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-lg shadow-md transition-all"
        >
          My Camera is Ready
        </button>
      </div>
    </div>
  );
}
