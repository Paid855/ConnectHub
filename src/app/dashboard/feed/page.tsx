"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Heart, MessageCircle, Send, Image as ImageIcon, Smile, Trash2, X, Film, Plus, Eye, Clock, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import Link from "next/link";

const EMOJIS = ["😀","😂","🥰","😍","😘","🤗","😊","❤️","🔥","💕","✨","💯","👋","🎉","💐","🌹","💝","💖","😎","🥳","🤩","💪","🙌","👏"];

type StoryItem = { id:string; image:string; caption:string|null; viewCount:number; viewedByMe:boolean; createdAt:string };
type StoryGroup = { user:{ id:string; name:string; profilePhoto:string|null; verified?:boolean }; stories:StoryItem[] };

export default function FeedPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const storyFileRef = useRef<HTMLInputElement>(null);
  const storyScrollRef = useRef<HTMLDivElement>(null);
  const progressTimer = useRef<any>(null);

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [previewImg, setPreviewImg] = useState<string|null>(null);
  const [previewVid, setPreviewVid] = useState<string|null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<string|null>(null);
  const [doubleTapId, setDoubleTapId] = useState<string|null>(null);
  const lastTap = useRef<{id:string;time:number}|null>(null);

  // Stories state
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [myStories, setMyStories] = useState<StoryItem[]>([]);
  const [viewing, setViewing] = useState<{group:StoryGroup;index:number}|null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [storyReply, setStoryReply] = useState("");
  const [storyLoved, setStoryLoved] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);

  const loadFeed = async () => {
    try { const res = await fetch("/api/feed"); if (res.ok) { const d = await res.json(); setPosts(d.feed || []); } } catch {}
    setLoading(false);
  };

  const loadStories = async () => {
    try {
      const res = await fetch("/api/stories");
      if (res.ok) {
        const d = await res.json();
        setStoryGroups(d.storyGroups || d.groups || []);
        setMyStories(d.myStories || []);
      }
    } catch {}
  };

  useEffect(() => {
    loadFeed(); loadStories();
    const i = setInterval(loadFeed, 20000);
    const j = setInterval(loadStories, 30000);
    const handleRefresh = () => { loadFeed(); loadStories(); };
    window.addEventListener("connecthub:refresh", handleRefresh);
    return () => { clearInterval(i); clearInterval(j); window.removeEventListener("connecthub:refresh", handleRefresh); };
  }, []);

  // Post functions
  const submitPost = async () => {
    if (!newPost.trim() && !previewImg && !previewVid) return;
    setPosting(true);
    const image = previewVid ? "[VID]" + previewVid : previewImg ? "[IMG]" + previewImg : null;
    await fetch("/api/feed", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ content:newPost.trim(), image }) });
    setNewPost(""); setPreviewImg(null); setPreviewVid(null); setShowEmoji(false); setPosting(false); loadFeed();
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => { setPreviewImg(ev.target?.result as string); setPreviewVid(null); };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 50*1024*1024) { alert("Max 50MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => { setPreviewVid(ev.target?.result as string); setPreviewImg(null); };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const toggleLike = async (postId: string) => {
    await fetch("/api/feed/like", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) });
    loadFeed();
  };

  const handleDoubleTap = (postId: string, liked: boolean) => {
    const now = Date.now();
    if (lastTap.current && lastTap.current.id === postId && now - lastTap.current.time < 300) {
      if (!liked) toggleLike(postId);
      setDoubleTapId(postId);
      setTimeout(() => setDoubleTapId(null), 800);
      lastTap.current = null;
    } else {
      lastTap.current = { id: postId, time: now };
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentText[postId]?.trim(); if (!text) return;
    await fetch("/api/feed/comment", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId, content: text }) });
    setCommentText(p => ({...p, [postId]: ""})); loadFeed();
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/feed/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) }); loadFeed();
  };

  // Story functions
  const uploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingStory(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const img = ev.target?.result as string;
      await fetch("/api/stories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action: "create", image: img, caption: "" }) });
      loadStories(); setUploadingStory(false);
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const openStory = (group: StoryGroup, index = 0) => {
    setViewing({ group, index }); setStoryProgress(0); setStoryLoved(false); setStoryReply("");
    // Mark as viewed
    const story = group.stories[index];
    if (story) fetch("/api/stories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"view", storyId:story.id }) }).catch(() => {});
  };

  const nextStory = () => {
    if (!viewing) return;
    if (viewing.index < viewing.group.stories.length - 1) {
      const next = viewing.index + 1;
      setViewing({ ...viewing, index: next }); setStoryProgress(0); setStoryLoved(false);
      fetch("/api/stories", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"view", storyId:viewing.group.stories[next]?.id }) }).catch(() => {});
    } else {
      const groupIdx = storyGroups.findIndex(g => g.user.id === viewing.group.user.id);
      if (groupIdx < storyGroups.length - 1) {
        openStory(storyGroups[groupIdx + 1]);
      } else {
        setViewing(null);
      }
    }
  };

  const prevStory = () => {
    if (!viewing) return;
    if (viewing.index > 0) {
      setViewing({ ...viewing, index: viewing.index - 1 }); setStoryProgress(0); setStoryLoved(false);
    }
  };

  // Story progress timer
  useEffect(() => {
    if (!viewing) return;
    setStoryProgress(0);
    if (progressTimer.current) clearInterval(progressTimer.current);
    progressTimer.current = setInterval(() => {
      setStoryProgress(p => {
        if (p >= 100) { nextStory(); return 0; }
        return p + 2;
      });
    }, 100);
    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, [viewing?.group.user.id, viewing?.index]);

  const sendStoryReply = async () => {
    if (!storyReply.trim() || !viewing) return;
    await fetch("/api/stories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: viewing.group.stories[viewing.index]?.id, type: "reply", content: storyReply.trim() }),
    });
    setStoryReply(""); alert("Reply sent!");
  };

  const loveStory = async () => {
    if (!viewing || storyLoved) return;
    setStoryLoved(true);
    await fetch("/api/stories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: viewing.group.stories[viewing.index]?.id, type: "react" }),
    });
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff/60000) + "m";
    if (diff < 86400000) return Math.floor(diff/3600000) + "h";
    if (diff < 604800000) return Math.floor(diff/86400000) + "d";
    return new Date(d).toLocaleDateString();
  };

  if (!user) return null;

  const currentStory = viewing ? viewing.group.stories[viewing.index] : null;

  return (
    <div className="max-w-2xl mx-auto px-0 sm:px-4">

      {/* ═══ STORIES BAR ═══ */}
      <div className={"py-4 mb-4 " + (dc ? "" : "")}>
        <div ref={storyScrollRef} className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {/* Your Story */}
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer" onClick={() => storyFileRef.current?.click()}>
            <div className="relative">
              <div className={"w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] rounded-full flex items-center justify-center " + (myStories.length > 0 ? "p-[3px] bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500" : (dc ? "p-[3px] bg-gray-600" : "p-[3px] bg-gray-200"))}>
                <div className={"w-full h-full rounded-full overflow-hidden " + (dc ? "bg-gray-800" : "bg-white")}>
                  {user.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white font-bold text-lg">{user.name?.[0]}</div>}
                </div>
              </div>
              <div className={"absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 " + (dc ? "bg-rose-500 border-gray-900" : "bg-rose-500 border-white")}>
                {uploadingStory ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
            <span className={"text-[10px] font-medium w-14 sm:w-16 text-center truncate " + (dc ? "text-gray-400" : "text-gray-500")}>Your Story</span>
          </div>
          <input ref={storyFileRef} type="file" accept="image/*,video/*" onChange={uploadStory} className="hidden" />

          {/* Other stories */}
          {storyGroups.map((group) => {
            const allViewed = group.stories.every(s => s.viewedByMe);
            return (
              <div key={group.user.id} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer" onClick={() => openStory(group)}>
                <div className={"w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] rounded-full p-[3px] " + (allViewed ? (dc ? "bg-gray-600" : "bg-gray-200") : "bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500")}>
                  <div className={"w-full h-full rounded-full overflow-hidden " + (dc ? "bg-gray-800" : "bg-white")}>
                    {group.user.profilePhoto ? <img src={group.user.profilePhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white font-bold text-lg">{group.user.name?.[0]}</div>}
                  </div>
                </div>
                <span className={"text-[10px] font-medium w-14 sm:w-16 text-center truncate " + (dc ? "text-gray-400" : "text-gray-500")}>{group.user.name?.split(" ")[0]}</span>
              </div>
            );
          })}

          {storyGroups.length === 0 && (
            <div className={"flex items-center gap-3 pl-2 " + (dc ? "text-gray-600" : "text-gray-300")}>
              <p className="text-xs font-medium whitespace-nowrap">No stories yet — be the first to share!</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ CREATE POST ═══ */}
      <div className={"rounded-2xl border mx-4 sm:mx-0 p-4 sm:p-5 mb-5 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm")}>
        <div className="flex items-start gap-3">
          {user.profilePhoto ? <img src={user.profilePhoto} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-rose-100" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{user.name?.[0]}</div>}
          <textarea className={"w-full px-0 py-1 outline-none text-sm resize-none border-none bg-transparent " + (dc ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400")} rows={3} placeholder={"What's on your mind, " + (user.name?.split(" ")[0] || "") + "?"} value={newPost} onChange={e => setNewPost(e.target.value)} />
        </div>

        {previewImg && <div className="relative mt-3 rounded-xl overflow-hidden"><img src={previewImg} className="w-full max-h-64 object-cover" /><button onClick={() => setPreviewImg(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"><X className="w-4 h-4" /></button></div>}
        {previewVid && <div className="relative mt-3 rounded-xl overflow-hidden"><video src={previewVid} controls className="w-full max-h-64" /><button onClick={() => setPreviewVid(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"><X className="w-4 h-4" /></button></div>}

        {showEmoji && (
          <div className={"flex flex-wrap gap-1 mt-3 p-3 rounded-xl " + (dc ? "bg-gray-700" : "bg-gray-50")}>
            {EMOJIS.map(e => <button key={e} onClick={() => setNewPost(p => p + e)} className={"w-9 h-9 flex items-center justify-center text-lg rounded-lg hover:scale-110 transition-transform " + (dc ? "hover:bg-gray-600" : "hover:bg-gray-200")}>{e}</button>)}
          </div>
        )}

        <div className={"flex items-center justify-between mt-3 pt-3 border-t " + (dc ? "border-gray-700" : "border-gray-100")}>
          <div className="flex gap-1">
            <input ref={imageRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
            <input ref={videoRef} type="file" accept="video/*" onChange={handleVideo} className="hidden" />
            <button onClick={() => imageRef.current?.click()} className={"p-2.5 rounded-xl transition-colors " + (dc ? "hover:bg-gray-700 text-emerald-400" : "hover:bg-emerald-50 text-emerald-500")} title="Photo"><ImageIcon className="w-5 h-5" /></button>
            <button onClick={() => videoRef.current?.click()} className={"p-2.5 rounded-xl transition-colors " + (dc ? "hover:bg-gray-700 text-blue-400" : "hover:bg-blue-50 text-blue-500")} title="Video"><Film className="w-5 h-5" /></button>
            <button onClick={() => setShowEmoji(!showEmoji)} className={"p-2.5 rounded-xl transition-colors " + (showEmoji ? (dc ? "bg-amber-500/20 text-amber-400" : "bg-amber-50 text-amber-500") : (dc ? "hover:bg-gray-700 text-amber-400" : "hover:bg-amber-50 text-amber-500"))} title="Emoji"><Smile className="w-5 h-5" /></button>
          </div>
          <button onClick={submitPost} disabled={posting || (!newPost.trim() && !previewImg && !previewVid)} className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-lg disabled:opacity-40 transition-all flex items-center gap-2">
            {posting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />} Post
          </button>
        </div>
      </div>

      {/* ═══ POSTS ═══ */}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> :
      posts.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border mx-4 sm:mx-0 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100")}>
          <div className="text-5xl mb-4">📝</div>
          <p className={"font-bold text-lg mb-2 " + (dc ? "text-white" : "text-gray-900")}>No posts yet</p>
          <p className={"text-sm " + (dc ? "text-gray-500" : "text-gray-400")}>Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4 px-4 sm:px-0">
          {posts.map((post: any) => (
            <div key={post.id} className={"rounded-2xl border overflow-hidden transition-all " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm")}>
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <Link href={"/dashboard/user?id=" + (post.user?.id || post.userId)}>
                  {post.user?.profilePhoto ? <img src={post.user.profilePhoto} className="w-11 h-11 rounded-full object-cover border-2 border-rose-100" /> : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{post.user?.name?.[0]}</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Link href={"/dashboard/user?id=" + (post.user?.id || post.userId)} className={"text-sm font-bold hover:underline " + (dc ? "text-white" : "text-gray-900")}>{post.user?.name}</Link>
                    {post.user?.verified && <Shield className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />}
                    <TierBadge tier={post.user?.tier} />
                  </div>
                  <p className={"text-xs " + (dc ? "text-gray-500" : "text-gray-400")}>{timeAgo(post.createdAt)}{post.user?.country ? " · " + post.user.country : ""}</p>
                </div>
                {post.userId === user.id && (
                  <button onClick={() => deletePost(post.id)} className={"p-2 rounded-full transition-colors " + (dc ? "hover:bg-gray-700 text-gray-500" : "hover:bg-gray-100 text-gray-400")}><Trash2 className="w-4 h-4" /></button>
                )}
              </div>

              {/* Content */}
              {post.content && <p className={"px-4 pb-3 text-sm leading-relaxed " + (dc ? "text-gray-300" : "text-gray-700")}>{post.content}</p>}

              {/* Media — double tap to like */}
              {post.image && !post.image.startsWith("[VID]") && !post.image.startsWith("[VOICE]") && (
                <div className="relative cursor-pointer" onClick={() => handleDoubleTap(post.id, post.liked)}>
                  <img src={post.image.replace("[IMG]", "")} className="w-full max-h-[500px] object-cover" loading="lazy" />
                  {doubleTapId === post.id && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Heart className="w-20 h-20 text-white fill-white drop-shadow-xl animate-ping" style={{ animationDuration: "0.6s" }} />
                    </div>
                  )}
                </div>
              )}
              {post.image && post.image.startsWith("[VID]") && (
                <video src={post.image.replace("[VID]", "")} controls playsInline className="w-full max-h-[500px] bg-black" />
              )}

              {/* Stats */}
              {(post.likeCount > 0 || post.commentCount > 0) && (
                <div className={"flex items-center justify-between px-4 py-2.5 " + (dc ? "text-gray-500" : "text-gray-400")}>
                  <div className="flex items-center gap-1.5 text-xs font-medium">{post.likeCount > 0 && <><span className="text-rose-500">❤️</span> {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}</>}</div>
                  {post.commentCount > 0 && <button onClick={() => setShowComments(showComments === post.id ? null : post.id)} className="text-xs font-medium hover:underline">{post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}</button>}
                </div>
              )}

              {/* Actions */}
              <div className={"flex border-t " + (dc ? "border-gray-700" : "border-gray-100")}>
                <button onClick={() => toggleLike(post.id)} className={"flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all " + (post.liked ? "text-rose-500" : (dc ? "text-gray-400 hover:bg-gray-700/50" : "text-gray-500 hover:bg-rose-50/50"))}>
                  <Heart className={"w-5 h-5 transition-transform " + (post.liked ? "fill-rose-500 scale-110" : "")} />
                  {post.liked ? "Liked" : "Like"}
                </button>
                <button onClick={() => setShowComments(showComments === post.id ? null : post.id)} className={"flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors " + (dc ? "text-gray-400 hover:bg-gray-700/50" : "text-gray-500 hover:bg-gray-50")}>
                  <MessageCircle className="w-5 h-5" /> Comment
                </button>
              </div>

              {/* Comments */}
              {showComments === post.id && (
                <div className={"border-t p-4 " + (dc ? "border-gray-700" : "border-gray-100")}>
                  {post.comments?.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {post.comments.map((c: any) => (
                        <div key={c.id} className="flex items-start gap-2.5">
                          <Link href={"/dashboard/user?id=" + c.userId}>
                            {c.user?.profilePhoto ? <img src={c.user.profilePhoto} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white text-xs font-bold">{c.user?.name?.[0]}</div>}
                          </Link>
                          <div className="flex-1">
                            <div className={"rounded-2xl px-3.5 py-2.5 " + (dc ? "bg-gray-700" : "bg-gray-50")}>
                              <Link href={"/dashboard/user?id=" + c.userId} className={"text-xs font-bold hover:underline " + (dc ? "text-white" : "text-gray-900")}>{c.user?.name}</Link>
                              <p className={"text-xs mt-0.5 leading-relaxed " + (dc ? "text-gray-300" : "text-gray-600")}>{c.content}</p>
                            </div>
                            <p className={"text-[10px] mt-1 ml-3 " + (dc ? "text-gray-600" : "text-gray-400")}>{timeAgo(c.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input className={"flex-1 px-4 py-2.5 rounded-full border text-sm outline-none transition-all " + (dc ? "bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-rose-500" : "bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200 focus:border-rose-300")} placeholder="Write a comment..." value={commentText[post.id] || ""} onChange={e => setCommentText(p => ({...p, [post.id]: e.target.value}))} onKeyDown={e => e.key === "Enter" && submitComment(post.id)} />
                    <button onClick={() => submitComment(post.id)} disabled={!commentText[post.id]?.trim()} className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:shadow-lg transition-all"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ STORY VIEWER (FULLSCREEN) ═══ */}
      {viewing && currentStory && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
          {/* Progress bars */}
          <div className="absolute top-0 left-0 right-0 z-30 px-3 pt-3 flex gap-1">
            {viewing.group.stories.map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-100" style={{ width: i < viewing.index ? "100%" : i === viewing.index ? storyProgress + "%" : "0%" }} />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="absolute top-8 left-0 right-0 z-30 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/30">
                {viewing.group.user.profilePhoto ? <img src={viewing.group.user.profilePhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">{viewing.group.user.name?.[0]}</div>}
              </div>
              <div>
                <p className="text-white text-sm font-bold flex items-center gap-1.5">{viewing.group.user.name} {viewing.group.user.verified && <Shield className="w-3 h-3 text-blue-400 fill-blue-400" />}</p>
                <p className="text-white/50 text-[10px]">{timeAgo(currentStory.createdAt)} ago · <Eye className="w-3 h-3 inline" /> {currentStory.viewCount}</p>
              </div>
            </div>
            <button onClick={() => { setViewing(null); if (progressTimer.current) clearInterval(progressTimer.current); }} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Story image */}
          <img src={currentStory.image} className="max-w-full max-h-full object-contain" />

          {/* Caption */}
          {currentStory.caption && (
            <div className="absolute bottom-24 left-0 right-0 text-center px-8">
              <p className="text-white text-sm bg-black/30 backdrop-blur-sm inline-block px-5 py-2.5 rounded-full">{currentStory.caption}</p>
            </div>
          )}

          {/* Navigation zones */}
          <button onClick={prevStory} className="absolute left-0 top-0 bottom-0 w-1/3 z-20" />
          <button onClick={nextStory} className="absolute right-0 top-0 bottom-0 w-1/3 z-20" />

          {/* Reply bar */}
          {viewing.group.user.id !== user.id && (
            <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-3">
              <input value={storyReply} onChange={e => setStoryReply(e.target.value)} onKeyDown={e => e.key === "Enter" && sendStoryReply()} placeholder="Reply to story..." className="flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white text-sm placeholder-white/40 outline-none focus:bg-white/15 backdrop-blur transition-all" />
              <button onClick={loveStory} className={"w-11 h-11 rounded-full flex items-center justify-center transition-all " + (storyLoved ? "bg-rose-500 scale-110" : "bg-white/10 border border-white/20 hover:bg-white/20")}>
                <Heart className={"w-5 h-5 " + (storyLoved ? "text-white fill-white" : "text-white")} />
              </button>
              {storyReply.trim() && (
                <button onClick={sendStoryReply} className="w-11 h-11 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
