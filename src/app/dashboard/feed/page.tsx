"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Heart, MessageCircle, Send, Image as ImageIcon, Smile, Trash2, MoreVertical, X, Film } from "lucide-react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

const EMOJIS = ["😀","😂","🥰","😍","😘","🤗","😊","❤️","🔥","💕","✨","💯","👋","🎉","💐","🌹","💝","💖"];

export default function FeedPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [previewImg, setPreviewImg] = useState<string|null>(null);
  const [previewVid, setPreviewVid] = useState<string|null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<string|null>(null);
  const [deleting, setDeleting] = useState<string|null>(null);

  const loadFeed = async () => {
    try { const res = await fetch("/api/feed"); if (res.ok) { const d = await res.json(); setPosts(d.feed || []); } } catch {}
    setLoading(false);
  };

  useEffect(() => { loadFeed(); const i = setInterval(loadFeed, 30000); return () => clearInterval(i); }, []);

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
    reader.onload = (ev) => { setPreviewImg(ev.target?.result as string); setPreviewVid(null); };
    reader.readAsDataURL(file);
    if (imageRef.current) imageRef.current.value = "";
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 50*1024*1024) { alert("Max 50MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPreviewVid(ev.target?.result as string); setPreviewImg(null); };
    reader.readAsDataURL(file);
    if (videoRef.current) videoRef.current.value = "";
  };

  const toggleLike = async (postId: string) => { await fetch("/api/feed/like", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) }); loadFeed(); };

  const submitComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    await fetch("/api/feed/comment", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId, content:text }) });
    setCommentText(p => ({...p, [postId]: ""}));
    loadFeed();
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    setDeleting(postId);
    await fetch("/api/feed/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) });
    loadFeed(); setDeleting(null);
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={"text-2xl font-bold mb-5 " + (dc?"text-white":"text-gray-900")}>Feed</h1>

      {/* Create post */}
      <div className={"rounded-2xl border p-4 mb-5 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <div className="flex items-start gap-3">
          {user.profilePhoto ? <img src={user.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{user.name[0]}</div>}
          <div className="flex-1">
            <textarea className={"w-full px-0 py-1 outline-none text-sm resize-none border-none bg-transparent " + (dc?"text-white placeholder-gray-500":"text-gray-900 placeholder-gray-400")} rows={2} placeholder="What's on your mind?" value={newPost} onChange={e => setNewPost(e.target.value)} />
          </div>
        </div>

        {/* Preview */}
        {previewImg && <div className="relative mt-2"><img src={previewImg} className="w-full max-h-48 object-cover rounded-xl" /><button onClick={() => setPreviewImg(null)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"><X className="w-4 h-4 text-white" /></button></div>}
        {previewVid && <div className="relative mt-2"><video src={previewVid} controls className="w-full max-h-48 rounded-xl" /><button onClick={() => setPreviewVid(null)} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full"><X className="w-4 h-4 text-white" /></button></div>}

        {/* Emoji panel */}
        {showEmoji && <div className="flex flex-wrap gap-1 mt-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-700">{EMOJIS.map(e => <button key={e} onClick={() => setNewPost(p => p + e)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">{e}</button>)}</div>}

        <div className={"flex items-center justify-between mt-3 pt-3 border-t " + (dc?"border-gray-700":"border-gray-100")}>
          <div className="flex gap-2">
            <input ref={imageRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
            <input ref={videoRef} type="file" accept="video/*" onChange={handleVideo} className="hidden" />
            <button onClick={() => imageRef.current?.click()} className={"p-2 rounded-lg " + (dc?"hover:bg-gray-700 text-gray-400":"hover:bg-gray-100 text-gray-500")}><ImageIcon className="w-5 h-5" /></button>
            <button onClick={() => videoRef.current?.click()} className={"p-2 rounded-lg " + (dc?"hover:bg-gray-700 text-gray-400":"hover:bg-gray-100 text-gray-500")}><Film className="w-5 h-5" /></button>
            <button onClick={() => setShowEmoji(!showEmoji)} className={"p-2 rounded-lg " + (showEmoji?(dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-500"):(dc?"hover:bg-gray-700 text-gray-400":"hover:bg-gray-100 text-gray-500"))}><Smile className="w-5 h-5" /></button>
          </div>
          <button onClick={submitPost} disabled={posting || (!newPost.trim() && !previewImg && !previewVid)} className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg disabled:opacity-40 flex items-center gap-2">{posting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />} Post</button>
        </div>
      </div>

      <AdBanner dark={dc} />

      {/* Posts */}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> :
      posts.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}><Heart className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} /><p className={"font-bold " + (dc?"text-white":"text-gray-900")}>No posts yet</p><p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>Be the first to share something!</p></div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <div key={post.id} className={"rounded-2xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
              {/* Post header */}
              <div className="flex items-center gap-3 p-4 pb-2">
                <Link href={"/dashboard/user?id=" + (post.user?.id || post.userId)}>
                  {post.user?.profilePhoto ? <img src={post.user.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{post.user?.name?.[0]}</div>}
                </Link>
                <div className="flex-1">
                  <Link href={"/dashboard/user?id=" + (post.user?.id || post.userId)} className={"text-sm font-bold hover:text-rose-500 " + (dc?"text-white":"text-gray-900")}>{post.user?.name}</Link>
                  <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{new Date(post.createdAt).toLocaleDateString("en-US", { month:"short", day:"numeric" })} {post.user?.country ? "· " + post.user.country : ""}</p>
                </div>
                {post.userId === user.id && <button onClick={() => deletePost(post.id)} disabled={deleting === post.id} className={"p-2 rounded-full " + (dc?"hover:bg-gray-700 text-gray-500":"hover:bg-gray-100 text-gray-400")}>{deleting === post.id ? <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>}
              </div>

              {/* Content */}
              {post.content && <p className={"px-4 pb-2 text-sm " + (dc?"text-gray-300":"text-gray-700")}>{post.content}</p>}

              {/* Media */}
              {post.image && !post.image.startsWith("[VID]") && !post.image.startsWith("[VOICE]") && (
                <img src={post.image.replace("[IMG]", "")} className="w-full max-h-[400px] object-cover" />
              )}
              {post.image && post.image.startsWith("[VID]") && (
                <video src={post.image.replace("[VID]", "")} controls playsInline className="w-full max-h-[400px]" />
              )}

              {/* Like & Comment buttons */}
              <div className={"flex border-t " + (dc?"border-gray-700":"border-gray-100")}>
                <button onClick={() => toggleLike(post.id)} className={"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors " + (post.liked?"text-rose-500":"text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700")}><Heart className={"w-5 h-5 " + (post.liked?"fill-rose-500":"")} /> {post.likeCount > 0 ? post.likeCount : ""} {post.liked?"Liked":"Like"}</button>
                <button onClick={() => setShowComments(showComments === post.id ? null : post.id)} className={"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"}><MessageCircle className="w-5 h-5" /> {post.commentCount > 0 ? post.commentCount : ""} Comment</button>
              </div>

              {/* Comments */}
              {showComments === post.id && (
                <div className={"border-t p-4 " + (dc?"border-gray-700":"border-gray-100")}>
                  {post.comments?.map((c: any) => (
                    <div key={c.id} className="flex gap-2 mb-3">
                      {c.user?.profilePhoto ? <img src={c.user.profilePhoto} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7 h-7 rounded-full bg-rose-200 flex items-center justify-center text-rose-600 text-xs font-bold">{c.user?.name?.[0]}</div>}
                      <div className={"flex-1 rounded-xl px-3 py-2 " + (dc?"bg-gray-700":"bg-gray-50")}><span className={"text-xs font-bold " + (dc?"text-white":"text-gray-900")}>{c.user?.name} </span><span className={"text-xs " + (dc?"text-gray-300":"text-gray-600")}>{c.content}</span></div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input className={"flex-1 px-3 py-2 rounded-full border text-sm outline-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200")} placeholder="Write a comment..." value={commentText[post.id] || ""} onChange={e => setCommentText(p => ({...p, [post.id]: e.target.value}))} onKeyDown={e => e.key === "Enter" && submitComment(post.id)} />
                    <button onClick={() => submitComment(post.id)} className="w-9 h-9 bg-rose-500 rounded-full flex items-center justify-center text-white"><Send className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
