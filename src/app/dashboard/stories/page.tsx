"use client";
import { useState, useEffect, useRef } from "react";
import { useUser } from "../layout";
import { Plus, X, Camera, ChevronLeft, ChevronRight, Eye, Clock, Trash2, Send, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

type StoryGroup = { user: { id:string; name:string; profilePhoto:string|null }; stories: { id:string; image:string; caption:string|null; viewCount:number; createdAt:string; expiresAt:string }[] };

export default function StoriesPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const fileRef = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [myStories, setMyStories] = useState<any[]>([]);
  const [viewing, setViewing] = useState<{group:StoryGroup;index:number}|null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string|null>(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<any>(null);

  const load = async () => {
    const res = await fetch("/api/stories");
    if (res.ok) {
      const d = await res.json();
      const gs: StoryGroup[] = d.storyGroups || [];
      setGroups(gs);
      const mine = gs.find((g: StoryGroup) => g.user.id === d.myId);
      setMyStories(mine?.stories || []);
    }
  };

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadStory = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      await fetch("/api/stories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"create", image:preview, caption }) });
      setPreview(null); setCaption(""); load();
    } catch {} finally { setUploading(false); }
  };

  const deleteStory = async (storyId: string) => {
    await fetch("/api/stories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"delete", storyId }) });
    load(); setViewing(null);
  };

  const openStory = (group: StoryGroup, index: number = 0) => {
    setViewing({ group, index });
    setProgress(0);
    // Mark as viewed
    fetch("/api/stories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"view", storyId:group.stories[index].id }) }).catch(()=>{});
  };

  const nextStory = () => {
    if (!viewing) return;
    const { group, index } = viewing;
    if (index < group.stories.length - 1) {
      setViewing({ group, index: index + 1 });
      setProgress(0);
      fetch("/api/stories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"view", storyId:group.stories[index+1].id }) }).catch(()=>{});
    } else {
      // Move to next group
      const gi = groups.indexOf(group);
      if (gi < groups.length - 1) { openStory(groups[gi + 1], 0); }
      else { setViewing(null); }
    }
  };

  const prevStory = () => {
    if (!viewing) return;
    const { group, index } = viewing;
    if (index > 0) { setViewing({ group, index: index - 1 }); setProgress(0); }
    else {
      const gi = groups.indexOf(group);
      if (gi > 0) { const pg = groups[gi - 1]; openStory(pg, pg.stories.length - 1); }
    }
  };

  // Auto-advance story every 5 seconds
  useEffect(() => {
    if (!viewing) return;
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { nextStory(); return 0; }
        return p + 2;
      });
    }, 100);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [viewing?.group.user.id, viewing?.index]);

  const timeAgo = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<3600000) return Math.floor(diff/60000)+"m"; if(diff<86400000) return Math.floor(diff/3600000)+"h"; return "1d"; };

  if (!user) return null;

  // Full screen story viewer
  if (viewing) {
    const story = viewing.group.stories[viewing.index];
    const isMyStory = viewing.group.user.id === user.id;
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="relative w-full max-w-lg h-full max-h-[100dvh] mx-auto">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
            {viewing.group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: i < viewing.index ? "100%" : i === viewing.index ? progress + "%" : "0%" }} />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              {viewing.group.user.profilePhoto ? <img src={viewing.group.user.profilePhoto} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/50" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/50">{viewing.group.user.name[0]}</div>}
              <div><p className="text-white font-bold text-sm">{viewing.group.user.name}</p><p className="text-white/60 text-xs">{timeAgo(story.createdAt)} ago</p></div>
            </div>
            <div className="flex items-center gap-2">
              {isMyStory && <div className="flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full"><Eye className="w-3.5 h-3.5 text-white/80" /><span className="text-white/80 text-xs font-medium">{story.viewCount}</span></div>}
              {isMyStory && <button onClick={() => deleteStory(story.id)} className="p-2 bg-black/30 backdrop-blur-sm rounded-full"><Trash2 className="w-4 h-4 text-white/80" /></button>}
              <button onClick={() => setViewing(null)} className="p-2 bg-black/30 backdrop-blur-sm rounded-full"><X className="w-5 h-5 text-white" /></button>
            </div>
          </div>

          {/* Story image */}
          <img src={story.image} className="w-full h-full object-contain" />

          {/* Caption */}
          {story.caption && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-16">
              <p className="text-white text-sm">{story.caption}</p>
            </div>
          )}

          {/* Navigation zones */}
          <button onClick={prevStory} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" />
          <button onClick={nextStory} className="absolute right-0 top-0 bottom-0 w-2/3 z-10" />

          {/* Arrows on desktop */}
          <button onClick={prevStory} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm items-center justify-center"><ChevronLeft className="w-5 h-5 text-white" /></button>
          <button onClick={nextStory} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm items-center justify-center"><ChevronRight className="w-5 h-5 text-white" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>Stories</h1>
        <span className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Stories disappear after 24 hours</span>
      </div>

      {/* Upload preview */}
      {preview && (
        <div className={"rounded-2xl border overflow-hidden mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <div className="relative h-72"><img src={preview} className="w-full h-full object-contain bg-black" /><button onClick={() => setPreview(null)} className="absolute top-3 right-3 p-2 bg-black/50 rounded-full"><X className="w-4 h-4 text-white" /></button></div>
          <div className="p-4">
            <input className={"w-full px-4 py-3 rounded-xl border outline-none text-sm mb-3 " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Add a caption (optional)" value={caption} onChange={e => setCaption(e.target.value)} />
            <button onClick={uploadStory} disabled={uploading} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">{uploading ? "Uploading..." : <><Send className="w-4 h-4" /> Share Story</>}</button>
          </div>
        </div>
      )}

      {/* Story circles */}
      <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* Add story button */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <button onClick={() => fileRef.current?.click()} className={"w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center " + (dc?"border-gray-600 hover:border-rose-400 bg-gray-700":"border-gray-200 hover:border-rose-300 bg-gray-50")}>
              <Plus className={"w-6 h-6 " + (dc?"text-gray-400":"text-gray-400")} />
            </button>
            <span className={"text-[11px] font-medium " + (dc?"text-gray-400":"text-gray-500")}>Add Story</span>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

          {/* My stories */}
          {myStories.length > 0 && (
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer" onClick={() => openStory(groups.find(g => g.user.id === user.id)!)}>
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500">
                {user.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full rounded-full object-cover border-2 border-white dark:border-gray-800" /> : <div className={"w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg border-2 bg-gradient-to-br from-rose-400 to-pink-400 " + (dc?"border-gray-800":"border-white")}>{user.name[0]}</div>}
              </div>
              <span className={"text-[11px] font-medium " + (dc?"text-gray-300":"text-gray-700")}>Your Story</span>
            </div>
          )}

          {/* Other users' stories */}
          {groups.filter(g => g.user.id !== user.id).map(g => (
            <div key={g.user.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer" onClick={() => openStory(g)}>
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-500">
                {g.user.profilePhoto ? <img src={g.user.profilePhoto} className={"w-full h-full rounded-full object-cover border-2 " + (dc?"border-gray-800":"border-white")} /> : <div className={"w-full h-full rounded-full flex items-center justify-center text-white font-bold text-lg border-2 bg-gradient-to-br from-rose-400 to-pink-400 " + (dc?"border-gray-800":"border-white")}>{g.user.name[0]}</div>}
              </div>
              <span className={"text-[11px] font-medium truncate max-w-[64px] " + (dc?"text-gray-300":"text-gray-700")}>{g.user.name.split(" ")[0]}</span>
            </div>
          ))}

          {groups.length === 0 && !myStories.length && (
            <div className={"flex items-center gap-3 pl-4 " + (dc?"text-gray-500":"text-gray-400")}>
              <Clock className="w-5 h-5" />
              <p className="text-sm">No stories yet. Be the first to share!</p>
            </div>
          )}
        </div>
      </div>

      {/* My active stories */}
      {myStories.length > 0 && (
        <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>Your Active Stories</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {myStories.map(s => (
              <div key={s.id} className="relative rounded-xl overflow-hidden group cursor-pointer h-36" onClick={() => openStory(groups.find(g => g.user.id === user.id)!, myStories.indexOf(s))}>
                <img src={s.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center gap-1"><Eye className="w-3 h-3 text-white/80" /><span className="text-white/80 text-[10px]">{s.viewCount} views</span></div>
                  <p className="text-white/60 text-[10px]">{timeAgo(s.createdAt)} ago</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteStory(s.id); }} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3 text-white" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={"rounded-2xl border p-6 text-center " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
        <ImageIcon className={"w-10 h-10 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} />
        <h3 className={"font-bold mb-1 " + (dc?"text-white":"text-gray-900")}>Share Your Moments</h3>
        <p className={"text-sm mb-4 " + (dc?"text-gray-500":"text-gray-400")}>Upload photos that disappear in 24 hours</p>
        <button onClick={() => fileRef.current?.click()} className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg text-sm flex items-center gap-2 mx-auto"><Camera className="w-4 h-4" /> Add Story</button>
      </div>
    </div>
  );
}
