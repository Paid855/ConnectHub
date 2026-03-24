"use client";
import { useState } from "react";
import { useUser } from "../layout";
import { HelpCircle, MessageCircle, Shield, Coins, Users, Heart, Camera, Video, ChevronDown, Mail, ExternalLink } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { icon: Users, title: "Account & Profile", color: "text-blue-500", bg: "bg-blue-500/10", items: [
    { q: "How do I change my profile photo?", a: "Go to Profile → click your photo → upload a new one. Photos should be under 5MB." },
    { q: "How do I change my username?", a: "Username cannot be changed after registration to prevent impersonation. Contact support if you need help." },
    { q: "How do I delete my account?", a: "Go to Profile → Settings tab → Delete Account. Enter your password and type 'DELETE MY ACCOUNT' to confirm. Note: You cannot create a new account with the same email for 30 days." },
    { q: "Why is my account banned?", a: "Accounts are banned for violating community guidelines (harassment, fake profiles, spam, inappropriate content). Contact support@connecthub.com to appeal." },
  ]},
  { icon: Shield, title: "Verification", color: "text-emerald-500", bg: "bg-emerald-500/10", items: [
    { q: "How do I get verified?", a: "Go to Dashboard → Verify. You'll complete a face scan (4 poses) and upload a government ID. Our admin team reviews and approves within 24 hours." },
    { q: "Why was my verification rejected?", a: "Common reasons: blurry photos, face not visible, ID doesn't match name, expired ID. You can try again with clearer photos." },
    { q: "What are the benefits of verification?", a: "Verified users get a blue badge, appear higher in search results, and get up to 5x more matches. Required for live streaming." },
  ]},
  { icon: Coins, title: "Coins & Payments", color: "text-amber-500", bg: "bg-amber-500/10", items: [
    { q: "How do I buy coins?", a: "Go to Dashboard → Coins → Buy Coins. We accept cards, bank transfer, USSD, and mobile money via Paystack." },
    { q: "I paid but didn't receive coins", a: "Coins are delivered automatically after payment. If you don't see them within 5 minutes, refresh the page. Still missing? Email support@connecthub.com with your payment reference." },
    { q: "Can I get a refund?", a: "Coin purchases are non-refundable as stated in our Terms of Service. However, if there was a technical error, contact support." },
    { q: "What can I do with coins?", a: "Send gifts to other users, upgrade to Premium or Gold, boost your profile for more visibility, and more." },
  ]},
  { icon: Heart, title: "Matching & Messaging", color: "text-rose-500", bg: "bg-rose-500/10", items: [
    { q: "How does matching work?", a: "Our AI considers your interests, preferences, location, and compatibility quiz answers to suggest the best matches." },
    { q: "Why am I not getting matches?", a: "Complete your profile (photo, bio, interests), get verified, and use the compatibility quiz. Active profiles get more matches." },
    { q: "How many messages can I send?", a: "Basic: 5 messages/day. Premium & Gold: Unlimited. Upgrade in the Coins section." },
    { q: "Can I delete messages?", a: "Yes. Tap any message → Delete for me (only you) or Delete for everyone (both users)." },
  ]},
  { icon: Video, title: "Live & Stories", color: "text-violet-500", bg: "bg-violet-500/10", items: [
    { q: "Who can go live?", a: "Verified users and Premium/Gold members can start live streams." },
    { q: "How do Stories work?", a: "Upload photos or videos that disappear after 24 hours. Other users can react with ❤️ or send replies directly to your messages." },
    { q: "What are gifts?", a: "Gifts are virtual items you can send during live streams. They cost coins and show appreciation. The streamer receives 80% of the coin value." },
  ]},
];

export default function SupportPage() {
  const { dark } = useUser();
  const dc = dark;
  const [openCat, setOpenCat] = useState<number|null>(0);
  const [openQ, setOpenQ] = useState<string|null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <HelpCircle className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-rose-400":"text-rose-500")} />
        <h1 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Help Center</h1>
        <p className={"text-sm " + (dc?"text-gray-400":"text-gray-500")}>Find answers to common questions about ConnectHub</p>
      </div>

      <div className="space-y-4 mb-8">
        {CATEGORIES.map((cat, ci) => (
          <div key={ci} className={"rounded-2xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
            <button onClick={() => setOpenCat(openCat === ci ? null : ci)} className="w-full flex items-center gap-3 p-5 text-left">
              <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + cat.bg}><cat.icon className={"w-5 h-5 " + cat.color} /></div>
              <span className={"flex-1 font-bold " + (dc?"text-white":"text-gray-900")}>{cat.title}</span>
              <ChevronDown className={"w-5 h-5 transition-transform " + (openCat === ci ? "rotate-180 " : "") + (dc?"text-gray-500":"text-gray-400")} />
            </button>
            {openCat === ci && (
              <div className={"border-t px-5 pb-4 " + (dc?"border-gray-700":"border-gray-100")}>
                {cat.items.map((item, qi) => {
                  const key = ci + "-" + qi;
                  return (
                    <div key={qi} className={"border-b last:border-0 " + (dc?"border-gray-700/50":"border-gray-50")}>
                      <button onClick={() => setOpenQ(openQ === key ? null : key)} className="w-full flex items-center justify-between py-3 text-left">
                        <span className={"text-sm font-medium " + (dc?"text-gray-300":"text-gray-700")}>{item.q}</span>
                        <ChevronDown className={"w-4 h-4 flex-shrink-0 transition-transform " + (openQ === key ? "rotate-180 " : "") + (dc?"text-gray-600":"text-gray-400")} />
                      </button>
                      {openQ === key && <p className={"text-sm pb-3 leading-relaxed " + (dc?"text-gray-400":"text-gray-500")}>{item.a}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={"rounded-2xl border p-6 text-center " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <MessageCircle className={"w-10 h-10 mx-auto mb-3 " + (dc?"text-rose-400":"text-rose-500")} />
        <h3 className={"font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Still need help?</h3>
        <p className={"text-sm mb-4 " + (dc?"text-gray-400":"text-gray-500")}>Our support team is here for you</p>
        <a href="mailto:support@connecthub.com" className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg"><Mail className="w-4 h-4" /> support@connecthub.com</a>
      </div>
    </div>
  );
}
