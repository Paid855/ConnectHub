"use client";
import { Mail, BarChart3, Users, Eye, ArrowRight, Shield, Zap } from "lucide-react";
import Link from "next/link";

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="text-rose-500 text-sm font-medium hover:underline mb-8 block">← Back to ConnectHub</Link>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Advertise on ConnectHub</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Reach thousands of engaged singles actively looking for connections. Premium ad placements with high engagement rates.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <Users className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-3xl font-bold text-gray-900">10K+</h3>
            <p className="text-gray-500 text-sm">Active Users</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <Eye className="w-10 h-10 text-violet-500 mx-auto mb-3" />
            <h3 className="text-3xl font-bold text-gray-900">500K+</h3>
            <p className="text-gray-500 text-sm">Monthly Page Views</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
            <BarChart3 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-3xl font-bold text-gray-900">8.5%</h3>
            <p className="text-gray-500 text-sm">Average CTR</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">$99<span className="text-gray-400 text-base font-normal">/month</span></p>
            <p className="text-sm text-gray-500 mb-4">Perfect for local businesses</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>Feed banner ads</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>5,000 impressions/month</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>Basic analytics</li>
            </ul>
            <a href="mailto:ads@connecthub.com?subject=Starter Ad Package" className="block w-full py-2.5 border-2 border-rose-500 text-rose-500 rounded-full font-semibold text-center text-sm hover:bg-rose-50">Get Started</a>
          </div>
          <div className="bg-white rounded-2xl border-2 border-rose-500 p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold">POPULAR</span>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Growth</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">$299<span className="text-gray-400 text-base font-normal">/month</span></p>
            <p className="text-sm text-gray-500 mb-4">For growing brands</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>Feed + Discover ads</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>25,000 impressions/month</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>Detailed analytics</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>Targeted demographics</li>
            </ul>
            <a href="mailto:ads@connecthub.com?subject=Growth Ad Package" className="block w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold text-center text-sm hover:shadow-lg">Get Started</a>
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
            <p className="text-3xl font-bold text-gray-900 mb-1">Custom</p>
            <p className="text-sm text-gray-500 mb-4">For large campaigns</p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>All placements</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>Unlimited impressions</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>Dedicated manager</li>
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500"/>Custom integrations</li>
            </ul>
            <a href="mailto:ads@connecthub.com?subject=Enterprise Ad Package" className="block w-full py-2.5 border-2 border-rose-500 text-rose-500 rounded-full font-semibold text-center text-sm hover:bg-rose-50">Contact Sales</a>
          </div>
        </div>

        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to reach singles?</h2>
          <p className="text-rose-100 mb-4">Contact our advertising team today</p>
          <a href="mailto:ads@connecthub.com" className="inline-flex items-center gap-2 bg-white text-rose-500 px-6 py-3 rounded-full font-bold hover:shadow-lg"><Mail className="w-5 h-5" /> ads@connecthub.com</a>
        </div>
      </div>
    </div>
  );
}
