"use client";
import { useState, useEffect } from "react";
import { MapPin, Shield, AlertTriangle, X } from "lucide-react";

export default function LocationDetector() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [vpnWarning, setVpnWarning] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checked = sessionStorage.getItem("location_checked");
    if (checked) return;

    // Detect location via IP geolocation API
    const detectLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          const country = data.country_name || "";
          const city = data.city || "";
          const isVPN = data.org?.toLowerCase().includes("vpn") || data.org?.toLowerCase().includes("proxy") || data.org?.toLowerCase().includes("hosting") || false;
          
          setDetectedCountry(country);
          
          if (isVPN) {
            setVpnWarning(true);
          }

          // Save to server
          await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: data.latitude, longitude: data.longitude, country, city, isVPN })
          });

          sessionStorage.setItem("location_checked", "true");
          sessionStorage.setItem("user_country", country);
        }
      } catch {}
    };

    // Ask for browser location permission
    const askPermission = () => {
      if (!navigator.geolocation) {
        detectLocation();
        return;
      }
      
      const permitted = localStorage.getItem("location_permitted");
      if (permitted === "true") {
        navigator.geolocation.getCurrentPosition(
          (pos) => { detectLocation(); },
          () => { detectLocation(); },
          { timeout: 5000 }
        );
      } else if (permitted !== "denied") {
        setShowPrompt(true);
        detectLocation(); // Still detect via IP
      } else {
        detectLocation();
      }
    };

    setTimeout(askPermission, 2000);
  }, []);

  const allowLocation = () => {
    localStorage.setItem("location_permitted", "true");
    setShowPrompt(false);
    navigator.geolocation?.getCurrentPosition(() => {}, () => {}, { timeout: 5000 });
  };

  const denyLocation = () => {
    localStorage.setItem("location_permitted", "denied");
    setShowPrompt(false);
  };

  if (dismissed) return null;

  return (
    <>
      {/* Location permission prompt */}
      {showPrompt && (
        <div className="fixed bottom-20 left-4 right-4 lg:left-auto lg:right-6 lg:bottom-6 lg:w-80 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-sm">Enable Location</h3>
              <p className="text-xs text-gray-500 mt-1">Allow location access to see matches near you and reduce scam accounts.</p>
              <div className="flex gap-2 mt-3">
                <button onClick={allowLocation} className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg text-xs font-bold hover:shadow-lg">Allow</button>
                <button onClick={denyLocation} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50">Not Now</button>
              </div>
            </div>
            <button onClick={() => { setShowPrompt(false); denyLocation(); }} className="p-1"><X className="w-4 h-4 text-gray-400" /></button>
          </div>
        </div>
      )}

      {/* VPN warning */}
      {vpnWarning && !dismissed && (
        <div className="fixed top-16 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-50 bg-amber-50 border border-amber-200 rounded-2xl shadow-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-800 text-sm">VPN Detected</h3>
              <p className="text-xs text-amber-600 mt-1">It looks like you're using a VPN or proxy. For the best experience and to see matches in your real location, please disable your VPN.</p>
              <p className="text-xs text-amber-500 mt-1">Detected location: {detectedCountry || "Unknown"}</p>
            </div>
            <button onClick={() => { setVpnWarning(false); setDismissed(true); }} className="p-1"><X className="w-4 h-4 text-amber-400" /></button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </>
  );
}
