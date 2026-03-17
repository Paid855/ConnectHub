"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Heart, MessageCircle, Send, Image as ImageIcon, Shield, Smile, X, MoreHorizontal, Trash2, Crown, Gem, Ban } from "lucide-react";
import Link from "next/link";

type PostUser = { id:string; name:string; profilePhoto:string|null; tier:string; };
type Comment = { id:string; content:string; createdAt:string; user:PostUser; };
type Post = { id:string; userId:string; content:string|null; image:string|null; createdAt:string; user:PostUser; likeCount:number; liked:boolean; myEmoji:string|null; emojiCounts:Record<string,number>; comments:Comment[]; commentCount:number; };

const POST_EMOJIS = ["😀","😂","🥰","😍","😘","🤗","❤️","🔥","💕","✨","💯","👋","🎉","💐","🌹","💝","👏","🙏","😎","🥳"];
const REACTIONS = [{emoji:"❤️",key:"heart"},{emoji:"😂",key:"laugh"},{emoji:"😍",key:"love"},{emoji:"😮",key:"wow"},{emoji:"😢",key:"sad"},{emoji:"🔥",key:"fire"}];

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
  const [openMenu, setOpenMenu] = useState<string|null>(null);
  const [showReactions, setShowReactions] = useState<string|null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const loadFeed = async () => { const res = await fetch("/api/feed"); if (res.ok) { const d = await res.json(); setPosts(d.feed||[]); } setLoading(false); };
  useEffect(() => { loadFeed(); }, []);

  const createPost = async () => {
    if (!newPost.trim() && !newImage) return;
    setPosting(true);
    await fetch("/api/feed", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ content:newPost, image:newImage }) });
    setNewPost(""); setNewImage(null); setShowEmoji(false); await loadFeed(); setPosting(false);
  };

  const reactToPost = async (postId: string, emoji: string) => {
    await fetch("/api/feed/like", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId, emoji }) });
    setShowReactions(null);
    await loadFeed();
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch("/api/feed/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId }) });
    setOpenMenu(null); await loadFeed();
  };

  const blockUser = async (userId: string) => {
    if (!confirm("Block this user? You won't see their posts anymore.")) return;
    await fetch("/api/block", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"block" }) });
    setOpenMenu(null); await loadFeed();
  };

  const addComment = async (postId: string) => {
    const text = commentText[postId]; if (!text?.trim()) return;
    await fetch("/api/feed/comment", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ postId, content:text }) });
    setCommentText(prev => ({...prev,[postId]:""})); await loadFeed();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setNewImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const formatTime = (d: string) => { const diff = Date.now()-new Date(d).getTime(); if(diff<60000) return "Just now"; if(diff<3600000) return Math.floor(diff/60000)+"m ago"; if(diff<86400000) return Math.floor(diff/3600000)+"h ago"; return new Date(d).toLocaleDateString([],{month:"short",day:"numeric"}); };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Feed</h1><p className="text-sm text-gray-500">See what people are sharing</p></div>

      {/* Create Post */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex gap-3">
          {user.profilePhoto ? <img src={user.profilePhoto} className="w-10 h-10 rounded-full object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold flex-shrink-0">{user.name[0]}</div>}
          <div className="flex-1">
            <textarea className="w-full border-none outline-none text-sm resize-none placeholder-gray-400 min-h-[60px]" placeholder={"What's on your mind, "+user.name.split(" ")[0]+"?"} value={newPost} onChange={e=>setNewPost(e.target.value)} />
            {newImage && <div className="relative mt-2 inline-block"><img src={newImage} className="max-h-48 rounded-xl border border-gray-200" /><button onClick={()=>setNewImage(null)} className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"><X className="w-3 h-3 text-white" /></button></div>}
            {showEmoji && <div className="flex flex-wrap gap-1 mt-2 p-2 bg-gray-50 rounded-xl">{POST_EMOJIS.map(e => <button key={e} onClick={()=>setNewPost(p=>p+e)} className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-200 rounded-lg">{e}</button>)}</div>}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex gap-2">
            <input ref={imageRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <button onClick={()=>imageRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg"><ImageIcon className="w-4 h-4 text-emerald-500" /> Photo</button>
            <button onClick={()=>setShowEmoji(!showEmoji)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg"><Smile className="w-4 h-4 text-amber-500" /> Emoji</button>
          </div>
          <button onClick={createPost} disabled={(!newPost.trim()&&!newImage)||posting} className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg disabled:opacity-40 flex items-center gap-1.5">{posting?<span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<Send className="w-3.5 h-3.5"/>} Post</button>
        </div>
      </div>

      {/* Posts */}
      {loading ? <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> : posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100"><Heart className="w-12 h-12 text-gray-200 mx-auto mb-3" /><h3 className="font-bold text-gray-400">No posts yet</h3><p className="text-sm text-gray-400">Be the first to share!</p></div>
      ) : (
        <div className="space-y-5">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 p-4 pb-2">
                <Link href={"/dashboard/user?id="+post.userId}>
                  {post.user?.profilePhoto ? <img src={post.user.profilePhoto} className="w-10 h-10 rounded-full object-cover hover:ring-2 hover:ring-rose-300 transition-all" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold">{post.user?.name?.[0]}</div>}
                </Link>
                <div className="flex-1">
                  <Link href={"/dashboard/user?id="+post.userId} className="text-sm font-bold text-gray-900 hover:text-rose-500 flex items-center gap-1.5">
                    {post.user?.name}
                    {post.user?.tier==="verified"&&<Shield className="w-3.5 h-3.5 text-blue-500"/>}
                    {post.user?.tier==="gold"&&<Crown className="w-3.5 h-3.5 text-amber-500"/>}
                    {post.user?.tier==="premium"&&<Gem className="w-3.5 h-3.5 text-rose-500"/>}
                  </Link>
                  <p className="text-xs text-gray-400">{formatTime(post.createdAt)}</p>
                </div>
                <div className="relative">
                  <button onClick={()=>setOpenMenu(openMenu===post.id?null:post.id)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><MoreHorizontal className="w-4 h-4 text-gray-400" /></button>
                  {openMenu===post.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 w-44 z-10">
                      {post.userId===user.id && <button onClick={()=>deletePost(post.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /> Delete Post</button>}
                      {post.userId!==user.id && <button onClick={()=>blockUser(post.userId)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"><Ban className="w-4 h-4" /> Block User</button>}
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              {post.content && <p className="px-4 pb-3 text-sm text-gray-800 leading-relaxed">{post.content}</p>}
              {post.image && <img src={post.image} className="w-full max-h-[500px] object-cover" />}

              {/* Emoji Reaction Summary */}
              <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  {Object.entries(post.emojiCounts || {}).map(([emoji, count]) => {
                    const emojiMap: Record<string,string> = {heart:"❤️",laugh:"😂",love:"😍",wow:"😮",sad:"😢",fire:"🔥"};
                    return <span key={emoji} className="flex items-center gap-0.5 bg-gray-50 rounded-full px-1.5 py-0.5">{emojiMap[emoji]||"❤️"} <strong>{count as number}</strong></span>;
                  })}
                  {post.likeCount > 0 && Object.keys(post.emojiCounts||{}).length === 0 && <span>❤️ {post.likeCount}</span>}
                </div>
                <button onClick={()=>setShowComments(prev=>({...prev,[post.id]:!prev[post.id]}))} className="hover:underline">{post.commentCount>0?post.commentCount+" comment"+(post.commentCount>1?"s":""):""}</button>
              </div>

              {/* Reaction Bar */}
              <div className="relative flex border-t border-gray-100">
                {/* Reaction picker popup */}
                {showReactions===post.id && (
                  <div className="absolute -top-12 left-4 bg-white rounded-full shadow-xl border border-gray-200 px-2 py-1.5 flex gap-1 z-20">
                    {REACTIONS.map(r => (
                      <button key={r.key} onClick={()=>reactToPost(post.id,r.key)} className={"w-9 h-9 flex items-center justify-center text-xl hover:scale-125 transition-transform rounded-full " + (post.myEmoji===r.key?"bg-rose-100":"hover:bg-gray-100")}>{r.emoji}</button>
                    ))}
                  </div>
                )}

                <button
                  onClick={()=>post.liked?reactToPost(post.id,post.myEmoji||"heart"):setShowReactions(showReactions===post.id?null:post.id)}
                  onDoubleClick={()=>reactToPost(post.id,"heart")}
                  className={"flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all " + (post.liked?"text-rose-500":"text-gray-500 hover:bg-gray-50")}
                >
                  {post.liked ? (
                    <>{REACTIONS.find(r=>r.key===post.myEmoji)?.emoji||"❤️"} {post.myEmoji==="laugh"?"Haha":post.myEmoji==="love"?"Love":post.myEmoji==="wow"?"Wow":post.myEmoji==="sad"?"Sad":post.myEmoji==="fire"?"Fire":"Liked"}</>
                  ) : (
                    <><Heart className="w-5 h-5" /> Like</>
                  )}
                </button>
                <button onClick={()=>{setShowComments(prev=>({...prev,[post.id]:!prev[post.id]}));setShowReactions(null);}} className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50"><MessageCircle className="w-5 h-5" /> Comment</button>
              </div>

              {/* Comments */}
              {showComments[post.id] && (
                <div className="border-t border-gray-100 bg-gray-50 p-4">
                  {post.comments.map(c => (
                    <div key={c.id} className="flex gap-2.5 mb-3 last:mb-0">
                      <Link href={"/dashboard/user?id="+c.user?.id}>{c.user?.profilePhoto ? <img src={c.user.profilePhoto} className="w-7 h-7 rounded-full object-cover flex-shrink-0" /> : <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{c.user?.name?.[0]}</div>}</Link>
                      <div className="bg-white rounded-xl px-3 py-2 border border-gray-100">
                        <Link href={"/dashboard/user?id="+c.user?.id} className="text-xs font-bold text-gray-900 hover:text-rose-500">{c.user?.name}</Link>
                        <p className="text-xs text-gray-700">{c.content}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{formatTime(c.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <input className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none text-xs focus:ring-2 focus:ring-rose-200" placeholder="Write a comment..." value={commentText[post.id]||""} onChange={e=>setCommentText(prev=>({...prev,[post.id]:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addComment(post.id)} />
                    <button onClick={()=>addComment(post.id)} disabled={!commentText[post.id]?.trim()} className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center disabled:opacity-40"><Send className="w-3.5 h-3.5" /></button>
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
