"use client";
import { useState, useEffect } from "react";
import { MapPin, Shield, AlertTriangle, X, Navigation } from "lucide-react";

export default function LocationDetector() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [vpnWarning, setVpnWarning] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const checked = sessionStorage.getItem("location_gps_v3");
    if (checked) return;

    const saveLocation = async (lat: number, lon: number) => {
      try {
        // Reverse geocode using free API
        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        if (res.ok) {
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision || "";
          const country = data.countryName || "";
          const countryCode = data.countryCode || "";

          // Save to user profile
          await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              detectedCity: city,
              detectedCountry: country,
              countryCode,
              latitude: lat,
              longitude: lon,
              source: "gps"
            }),
          });

          setDetectedCountry(country);
          sessionStorage.setItem("location_gps_v3", "done");

          // Check for VPN via IP comparison
          try {
            const ipRes = await fetch("https://ipapi.co/json/");
            if (ipRes.ok) {
              const ipData = await ipRes.json();
              const ipCountry = ipData.country_name || "";
              const isVPN = ipData.org?.toLowerCase().includes("vpn") || ipData.org?.toLowerCase().includes("proxy") || ipData.org?.toLowerCase().includes("hosting");
              if (isVPN || (ipCountry && country && ipCountry !== country)) {
                setVpnWarning(true);
              }
            }
          } catch {}
        }
      } catch {}
    };

    const requestGPS = () => {
      if (!("geolocation" in navigator)) {
        // Fallback to IP if no GPS
        fallbackToIP();
        return;
      }

      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocating(false);
          saveLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          setLocating(false);
          if (error.code === 1) {
            // Permission denied — show mandatory prompt
            setShowPrompt(true);
          } else {
            // Other error — fallback to IP
            fallbackToIP();
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    const fallbackToIP = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              detectedCity: data.city || "",
              detectedCountry: data.country_name || "",
              countryCode: data.country_code || "",
              latitude: data.latitude || 0,
              longitude: data.longitude || 0,
              source: "ip"
            }),
          });
          setDetectedCountry(data.country_name || "");
          sessionStorage.setItem("location_gps_v3", "done");

          const isVPN = data.org?.toLowerCase().includes("vpn") || data.org?.toLowerCase().includes("proxy");
          if (isVPN) setVpnWarning(true);
        }
      } catch {}
    };

    // Auto-request GPS on load (slight delay for page to settle)
    setTimeout(requestGPS, 3000);

    // Watch for location changes
    let watchId: number | null = null;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          saveLocation(position.coords.latitude, position.coords.longitude);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 300000 }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Mandatory location prompt
  if (showPrompt && !dismissed) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Navigation className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">Enable Location</h2>
          <p className="text-gray-500 text-sm mb-2">ConnectHub needs your location to:</p>
          <div className="text-left space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600"><span className="text-rose-500">💕</span> Show you matches nearby</div>
            <div className="flex items-center gap-2 text-sm text-gray-600"><span className="text-rose-500">🛡️</span> Verify profiles and prevent scams</div>
            <div className="flex items-center gap-2 text-sm text-gray-600"><span className="text-rose-500">📍</span> Display your city on your profile</div>
          </div>
          <button onClick={() => {
            setShowPrompt(false);
            // Re-request permission
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                fetch("/api/location", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    detectedCity: "",
                    detectedCountry: "",
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    source: "gps_retry"
                  }),
                });
                sessionStorage.setItem("location_gps_v3", "done");
              },
              () => { setDismissed(true); },
              { enableHighAccuracy: true, timeout: 15000 }
            );
          }} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg transition-all mb-3">
            Allow Location Access
          </button>
          <button onClick={() => setDismissed(true)} className="text-xs text-gray-400 hover:text-gray-600">
            Skip for now
          </button>
          <p className="text-[10px] text-gray-400 mt-3">Your exact address is never shared. Only your city is shown on your profile.</p>
        </div>
      </div>
    );
  }

  // VPN warning
  if (vpnWarning && !dismissed) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">VPN / Proxy Detected</p>
            <p className="text-xs text-amber-600 mt-1">For safety, ConnectHub works best without VPN. Your real location helps verify your identity and find matches near you.</p>
          </div>
          <button onClick={() => { setVpnWarning(false); setDismissed(true); }}><X className="w-4 h-4 text-amber-400" /></button>
        </div>
      </div>
    );
  }

  // Locating indicator
  if (locating) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-72">
        <div className="bg-white border border-rose-100 rounded-2xl p-3 shadow-lg flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Detecting your location...</p>
        </div>
      </div>
    );
  }

  return null;
}
