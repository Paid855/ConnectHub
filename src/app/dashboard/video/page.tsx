"use client";
import { Video, Shield, Lock, Sparkles } from "lucide-react";
import { useUser } from "../layout";
import Link from "next/link";

export default function VideoPage() {
  const { user } = useUser();
  const isVerified = user?.tier === "verified";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Video Dates</h1><p className="text-sm text-gray-500">Face-to-face connections from anywhere</p></div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 border border-white/30"><Video className="w-10 h-10 text-white" /></div>
          <h2 className="text-3xl font-bold text-white mb-2">Video Dating</h2>
          <p className="text-lg text-white/80">See your match before you meet</p>
        </div>
        <div className="p-6">
          {!isVerified ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><Lock className="w-8 h-8 text-amber-500" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Required</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">Video dates are only available for verified members. Complete your identity verification to unlock this feature.</p>
              <Link href="/dashboard/verify" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"><Shield className="w-5 h-5" /> Get Verified Now</Link>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Sparkles className="w-8 h-8 text-emerald-500" /></div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready for Video Dates!</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">You are verified and can use video calling. Start a conversation with someone and the video call option will appear in the chat.</p>
              <Link href="/dashboard/messages" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all"><Video className="w-5 h-5" /> Go to Messages</Link>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
            {[{icon:Shield,title:"Safe & Secure",desc:"Only verified users"},{icon:Video,title:"HD Video",desc:"Crystal clear calls"},{icon:Lock,title:"Private",desc:"End-to-end encrypted"}].map((f,i) => (
              <div key={i} className="text-center"><f.icon className="w-6 h-6 text-gray-400 mx-auto mb-2" /><p className="text-sm font-bold text-gray-900">{f.title}</p><p className="text-xs text-gray-500">{f.desc}</p></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
