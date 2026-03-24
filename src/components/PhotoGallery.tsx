"use client";
import { useState, useEffect, useRef } from "react";
import { Camera, Plus, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function PhotoGallery({ userId, editable = false, dark = false }: { userId: string; editable?: boolean; dark?: boolean }) {
  const dc = dark;
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<number|null>(null);

  const load = async () => {
    try {
      const res = await fetch("/api/auth/photos?userId=" + userId);
      if (res.ok) { const d = await res.json(); setPhotos(d.photos || []); }
    } catch {}
  };

  useEffect(() => { load(); }, [userId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await fetch("/api/auth/photos", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ photo:ev.target?.result, action:"add" }) });
      load();
      setUploading(false);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const deletePhoto = async (index: number) => {
    if (!confirm("Delete this photo?")) return;
    await fetch("/api/auth/photos", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"delete", index }) });
    load();
    setViewing(null);
  };

  if (photos.length === 0 && !editable) return null;

  return (
    <>
      <div className={"rounded-2xl border p-5 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>Photos ({photos.length}/6)</h3>
          {editable && photos.length < 6 && (
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg text-xs font-semibold hover:shadow-lg disabled:opacity-60">
              {uploading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3 h-3" />}
              {uploading ? "Uploading..." : "Add Photo"}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

        {photos.length === 0 ? (
          <div className={"text-center py-8 rounded-xl border-2 border-dashed " + (dc?"border-gray-600":"border-gray-200")}>
            <Camera className={"w-8 h-8 mx-auto mb-2 " + (dc?"text-gray-600":"text-gray-300")} />
            <p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>No photos yet</p>
            {editable && <button onClick={() => fileRef.current?.click()} className="text-rose-500 text-xs font-semibold mt-1 hover:underline">Upload your first photo</button>}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden cursor-pointer aspect-square" onClick={() => setViewing(i)}>
                <img src={p} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                {i === 0 && <span className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Main</span>}
                {editable && (
                  <button onClick={(e) => { e.stopPropagation(); deletePhoto(i); }} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            ))}
            {editable && photos.length < 6 && (
              <button onClick={() => fileRef.current?.click()} className={"rounded-xl border-2 border-dashed flex items-center justify-center aspect-square " + (dc?"border-gray-600 hover:border-rose-400":"border-gray-200 hover:border-rose-300")}>
                <Plus className={"w-6 h-6 " + (dc?"text-gray-500":"text-gray-400")} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen photo viewer */}
      {viewing !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setViewing(null)}>
          <button onClick={() => setViewing(null)} className="absolute top-4 right-4 p-2 bg-white/10 rounded-full z-10"><X className="w-6 h-6 text-white" /></button>
          {viewing > 0 && <button onClick={(e) => { e.stopPropagation(); setViewing(viewing - 1); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full z-10"><ChevronLeft className="w-6 h-6 text-white" /></button>}
          {viewing < photos.length - 1 && <button onClick={(e) => { e.stopPropagation(); setViewing(viewing + 1); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 rounded-full z-10"><ChevronRight className="w-6 h-6 text-white" /></button>}
          <img src={photos[viewing]} className="max-w-full max-h-[90vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, i) => <div key={i} className={"w-2 h-2 rounded-full " + (i === viewing ? "bg-white" : "bg-white/30")} />)}
          </div>
        </div>
      )}
    </>
  );
}
