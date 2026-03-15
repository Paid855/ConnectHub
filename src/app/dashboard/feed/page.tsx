"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Heart, MessageCircle, Send, Image as ImageIcon, Shield, Smile, X } from "lucide-react";

type PostUser = { id:string; name:string; profilePhoto:string|null; tier:string; };
type Comment = { id:string; content:string; createdAt:string; user:PostUser; };
type Post = { id:string; content:string|null; image:string|null; createdAt:string; user:PostUser; likeCount:number; liked:boolean; comments:Comment[]; commentCount:number; };

const EMOJIS = ["😀","😂","🥰","😍","😘","🤗","❤️","🔥","💕","✨","💯","👋","🎉","💐","🌹","💝","👏","🙏","😎","🥳"];

export default function FeedPage() {
  const { user } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState("");
  const [newImage, setNewImage] = useState<string|null>(null);
  const [posting, setPosting] = useState(false);
  const [commentText, setCommentText] = useState<Record<string,string>>({});
  const [showComments, setShowComments] = useState<Record<string,boolean>>({});
  const [showEmoji, setShowEmoji] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  const loadFeed = async () => {
    const res = await fetch("/api/feed");
    if (res.ok) { const d = await res.json(); setPosts(d.feed || []); }
    setLoading(false);
  };

  useEffect(() => { loadFeed(); }, []);

  const createPost = async () => {
    if (!newPost.trim() && !newImage) return;
    setPosting(true);
    await fetch("/api/feed", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ content: newPost, image: newImage }) });
    setNewPost(""); setNewImage(null); setShowEmoji(false);
    await loadFeed();
    setPosting(false);
  };

  const toggleLike = async (postId: string) => {
    await fetch("/api/feed/like", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) });
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 } : p));
  };

  const addComment = async (postId: string) => {
    const text = commentText[postId];
    if (!text?.trim()) return;
    await fetch("/api/feed/comment", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId, content: text }) });
    setCommentText(prev => ({ ...prev, [postId]: "" }));
    await loadFeed();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setNewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return Math.floor(diff/60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff/3600000) + "h ago";
    return new Date(d).toLocaleDateString([], { month:"short", day:"numeric" });
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Feed</h1><p className="text-sm text-gray-500">See what people are sharing</p></div>

      {/* Create Post */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex gap-3">
          {user.profilePhoto ? <img src={user.profilePhoto} className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">{user.name[0]}</div>}
          <div className="flex-1">
            <textarea className="w-full border-none outline-none text-sm resize-none placeholder-gray-400 min-h-[60px]" placeholder={"What's on your mind, " + user.name.split(" ")[0] + "?"} value={newPost} onChange={e => setNewPost(e.target.value)} />
            {newImage && (
              <div className="relative mt-2 inline-block">
                <img src={newImage} className="max-h-48 rounded-xl border border-gray-200" />
                <button onClick={() => setNewImage(null)} className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button>
              </div>
            )}
            {showEmoji && (
              <div className="flex flex-wrap gap-1 mt-2 p-2 bg-gray-50 rounded-xl">{EMOJIS.map(e => <button key={e} onClick={() => setNewPost(p => p + e)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-200 rounded-lg">{e}</button>)}</div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input ref={imageRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button onClick={() => imageRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-all"><ImageIcon className="w-4 h-4 text-emerald-500" /> Photo</button>
            <button onClick={() => setShowEmoji(!showEmoji)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-all"><Smile className="w-4 h-4 text-amber-500" /> Emoji</button>
          </div>
          <button onClick={createPost} disabled={(!newPost.trim() && !newImage) || posting} className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-40 flex items-center gap-1.5">
            {posting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />} Post
          </button>
        </div>
      </div>

      {/* Posts */}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100"><Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" /><h3 className="font-bold text-gray-400">No posts yet</h3><p className="text-sm text-gray-400">Be the first to share something!</p></div>
      ) : (
        <div className="space-y-5">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center gap-3 p-4 pb-2">
                {post.user?.profilePhoto ? <img src={post.user.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{post.user?.name?.[0]}</div>}
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">{post.user?.name} {post.user?.tier === "verified" && <Shield className="w-3.5 h-3.5 text-blue-500" />}{post.user?.tier === "gold" && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">GOLD</span>}{post.user?.tier === "premium" && <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-bold">PRO</span>}</p>
                  <p className="text-xs text-gray-400">{formatTime(post.createdAt)}</p>
                </div>
              </div>

              {/* Post Content */}
              {post.content && <p className="px-4 pb-3 text-sm text-gray-800 leading-relaxed">{post.content}</p>}
              {post.image && <img src={post.image} className="w-full max-h-[500px] object-cover" />}

              {/* Like/Comment Counts */}
              <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500">
                <span>{post.likeCount > 0 ? post.likeCount + (post.likeCount === 1 ? " like" : " likes") : ""}</span>
                <button onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className="hover:underline">{post.commentCount > 0 ? post.commentCount + (post.commentCount === 1 ? " comment" : " comments") : ""}</button>
              </div>

              {/* Actions */}
              <div className="flex border-t border-gray-100">
                <button onClick={() => toggleLike(post.id)} className={"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all " + (post.liked ? "text-rose-500" : "text-gray-500 hover:bg-gray-50")}>
                  <Heart className={"w-5 h-5 " + (post.liked ? "fill-rose-500 text-rose-500" : "")} /> {post.liked ? "Liked" : "Like"}
                </button>
                <button onClick={() => setShowComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50">
                  <MessageCircle className="w-5 h-5" /> Comment
                </button>
              </div>

              {/* Comments */}
              {showComments[post.id] && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  {post.comments.map(c => (
                    <div key={c.id} className="flex gap-2.5 mb-3 last:mb-0">
                      {c.user?.profilePhoto ? <img src={c.user.profilePhoto} className="w-7 h-7 rounded-full object-cover flex-shrink-0" /> : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.user?.name?.[0]}</div>}
                      <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <p className="text-xs font-bold text-gray-900">{c.user?.name}</p>
                        <p className="text-xs text-gray-700">{c.content}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(c.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <input className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none text-xs focus:ring-2 focus:ring-rose-200" placeholder="Write a comment..." value={commentText[post.id] || ""} onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addComment(post.id)} />
                    <button onClick={() => addComment(post.id)} disabled={!commentText[post.id]?.trim()} className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center disabled:opacity-40"><Send className="w-3.5 h-3.5" /></button>
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
