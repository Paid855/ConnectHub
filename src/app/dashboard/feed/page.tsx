"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Heart, MessageCircle, Send, Image as ImageIcon, Smile, Trash2, X, Film, MoreVertical, Share2, Bookmark } from "lucide-react";
import Link from "next/link";

const EMOJIS = ["😀","😂","🥰","😍","😘","🤗","😊","❤️","🔥","💕","✨","💯","👋","🎉","💐","🌹","💝","💖","😎","🥳","🤩","💪","🙌","👏"];

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
    reader.onload = ev => { setPreviewImg(ev.target?.result as string); setPreviewVid(null); };
    reader.readAsDataURL(file);
    if (imageRef.current) imageRef.current.value = "";
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 50*1024*1024) { alert("Max 50MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => { setPreviewVid(ev.target?.result as string); setPreviewImg(null); };
    reader.readAsDataURL(file);
    if (videoRef.current) videoRef.current.value = "";
  };

  const toggleLike = async (postId: string) => { await fetch("/api/feed/like", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) }); loadFeed(); };

  const submitComment = async (postId: string) => {
    const text = commentText[postId]?.trim(); if (!text) return;
    await fetch("/api/feed/comment", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId, content: text }) });
    setCommentText(p => ({...p, [postId]: ""})); loadFeed();
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/feed/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) });
    loadFeed();
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff/60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff/3600000) + "h ago";
    if (diff < 604800000) return Math.floor(diff/86400000) + "d ago";
    return new Date(d).toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Create post */}
      <div className={"rounded-2xl border p-4 sm:p-5 mb-5 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <div className="flex items-start gap-3">
          {user.profilePhoto ? <img src={user.profilePhoto} className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{user.name?.[0]}</div>}
          <div className="flex-1 min-w-0">
            <textarea className={"w-full px-0 py-1 outline-none text-sm resize-none border-none bg-transparent " + (dc?"text-white placeholder-gray-500":"text-gray-900 placeholder-gray-400")} rows={3} placeholder={"What's on your mind, " + (user.name?.split(" ")[0] || "") + "?"} value={newPost} onChange={e => setNewPost(e.target.value)} />
          </div>
        </div>

        {previewImg && <div className="relative mt-3 rounded-xl overflow-hidden"><img src={previewImg} className="w-full max-h-64 object-cover" /><button onClick={() => setPreviewImg(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"><X className="w-4 h-4" /></button></div>}
        {previewVid && <div className="relative mt-3 rounded-xl overflow-hidden"><video src={previewVid} controls className="w-full max-h-64" /><button onClick={() => setPreviewVid(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"><X className="w-4 h-4" /></button></div>}

        {showEmoji && (
          <div className={"flex flex-wrap gap-1 mt-3 p-3 rounded-xl " + (dc?"bg-gray-700":"bg-gray-50")}>
            {EMOJIS.map(e => <button key={e} onClick={() => setNewPost(p => p + e)} className={"w-9 h-9 flex items-center justify-center text-lg rounded-lg hover:scale-110 transition-transform " + (dc?"hover:bg-gray-600":"hover:bg-gray-200")}>{e}</button>)}
          </div>
        )}

        <div className={"flex items-center justify-between mt-3 pt-3 border-t " + (dc?"border-gray-700":"border-gray-100")}>
          <div className="flex gap-1">
            <input ref={imageRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
            <input ref={videoRef} type="file" accept="video/*" onChange={handleVideo} className="hidden" />
            <button onClick={() => imageRef.current?.click()} className={"p-2.5 rounded-xl transition-colors " + (dc?"hover:bg-gray-700 text-emerald-400":"hover:bg-emerald-50 text-emerald-500")} title="Add photo"><ImageIcon className="w-5 h-5" /></button>
            <button onClick={() => videoRef.current?.click()} className={"p-2.5 rounded-xl transition-colors " + (dc?"hover:bg-gray-700 text-blue-400":"hover:bg-blue-50 text-blue-500")} title="Add video"><Film className="w-5 h-5" /></button>
            <button onClick={() => setShowEmoji(!showEmoji)} className={"p-2.5 rounded-xl transition-colors " + (showEmoji?(dc?"bg-amber-500/20 text-amber-400":"bg-amber-50 text-amber-500"):(dc?"hover:bg-gray-700 text-amber-400":"hover:bg-amber-50 text-amber-500"))} title="Add emoji"><Smile className="w-5 h-5" /></button>
          </div>
          <button onClick={submitPost} disabled={posting || (!newPost.trim() && !previewImg && !previewVid)} className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-lg disabled:opacity-40 transition-all flex items-center gap-2">{posting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />} Post</button>
        </div>
      </div>

      {/* Posts */}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> :
      posts.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <div className="text-5xl mb-4">📝</div>
          <p className={"font-bold text-lg mb-2 " + (dc?"text-white":"text-gray-900")}>No posts yet</p>
          <p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>Be the first to share something with the community!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post: any) => (
            <div key={post.id} className={"rounded-2xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
              {/* Header */}
              <div className="flex items-center gap-3 p-4">
                <Link href={"/dashboard/user?id=" + (post.user?.id || post.userId)}>
                  {post.user?.profilePhoto ? <img src={post.user.profilePhoto} className="w-11 h-11 rounded-full object-cover" /> : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{post.user?.name?.[0]}</div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={"/dashboard/user?id=" + (post.user?.id || post.userId)} className={"text-sm font-bold hover:underline " + (dc?"text-white":"text-gray-900")}>{post.user?.name}</Link>
                    {post.user?.verified && <span className="text-blue-500 text-xs">✓</span>}
                    <TierBadge tier={post.user?.tier} />
                  </div>
                  <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{timeAgo(post.createdAt)}{post.user?.country ? " · " + post.user.country : ""}</p>
                </div>
                {post.userId === user.id && (
                  <button onClick={() => deletePost(post.id)} className={"p-2 rounded-full transition-colors " + (dc?"hover:bg-gray-700 text-gray-500":"hover:bg-gray-100 text-gray-400")} title="Delete post"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>

              {/* Content */}
              {post.content && <p className={"px-4 pb-3 text-sm leading-relaxed " + (dc?"text-gray-300":"text-gray-700")}>{post.content}</p>}

              {/* Media */}
              {post.image && !post.image.startsWith("[VID]") && !post.image.startsWith("[VOICE]") && (
                <img src={post.image.replace("[IMG]", "")} className="w-full max-h-[450px] object-cover" loading="lazy" />
              )}
              {post.image && post.image.startsWith("[VID]") && (
                <video src={post.image.replace("[VID]", "")} controls playsInline className="w-full max-h-[450px] bg-black" />
              )}

              {/* Stats */}
              {(post.likeCount > 0 || post.commentCount > 0) && (
                <div className={"flex items-center justify-between px-4 py-2 " + (dc?"text-gray-500":"text-gray-400")}>
                  <div className="flex items-center gap-1 text-xs">{post.likeCount > 0 && <><span className="text-rose-500">❤️</span> {post.likeCount}</>}</div>
                  {post.commentCount > 0 && <button onClick={() => setShowComments(showComments === post.id ? null : post.id)} className="text-xs hover:underline">{post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}</button>}
                </div>
              )}

              {/* Actions */}
              <div className={"flex border-t " + (dc?"border-gray-700":"border-gray-100")}>
                <button onClick={() => toggleLike(post.id)} className={"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors " + (post.liked?"text-rose-500":(dc?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-50"))}>
                  <Heart className={"w-5 h-5 " + (post.liked?"fill-rose-500":"")} />
                  {post.liked ? "Liked" : "Like"}
                </button>
                <button onClick={() => setShowComments(showComments === post.id ? null : post.id)} className={"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors " + (dc?"text-gray-400 hover:bg-gray-700":"text-gray-500 hover:bg-gray-50")}>
                  <MessageCircle className="w-5 h-5" /> Comment
                </button>
              </div>

              {/* Comments section */}
              {showComments === post.id && (
                <div className={"border-t p-4 " + (dc?"border-gray-700":"border-gray-100")}>
                  {post.comments?.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {post.comments.map((c: any) => (
                        <div key={c.id} className="flex items-start gap-2">
                          <Link href={"/dashboard/user?id=" + c.userId}>
                            {c.user?.profilePhoto ? <img src={c.user.profilePhoto} className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white text-xs font-bold">{c.user?.name?.[0]}</div>}
                          </Link>
                          <div className="flex-1">
                            <div className={"rounded-2xl px-3.5 py-2.5 " + (dc?"bg-gray-700":"bg-gray-50")}>
                              <Link href={"/dashboard/user?id=" + c.userId} className={"text-xs font-bold hover:underline " + (dc?"text-white":"text-gray-900")}>{c.user?.name}</Link>
                              <p className={"text-xs mt-0.5 " + (dc?"text-gray-300":"text-gray-600")}>{c.content}</p>
                            </div>
                            <p className={"text-[10px] mt-1 ml-3 " + (dc?"text-gray-600":"text-gray-400")}>{timeAgo(c.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input className={"flex-1 px-4 py-2.5 rounded-full border text-sm outline-none " + (dc?"bg-gray-700 border-gray-600 text-white placeholder-gray-500":"bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200")} placeholder="Write a comment..." value={commentText[post.id] || ""} onChange={e => setCommentText(p => ({...p, [post.id]: e.target.value}))} onKeyDown={e => e.key === "Enter" && submitComment(post.id)} />
                    <button onClick={() => submitComment(post.id)} disabled={!commentText[post.id]?.trim()} className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center text-white disabled:opacity-40 hover:shadow-lg transition-all"><Send className="w-4 h-4" /></button>
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
