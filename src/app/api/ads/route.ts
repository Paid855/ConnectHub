import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Hardcoded ads for now — later you can make this a DB table
const ADS = [
  { id: "ad1", title: "Speed Dating NYC", description: "Meet 10 singles in one night! Book your spot now.", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=200&fit=crop", link: "https://connecthub.com/advertise", sponsor: "NYC Events", type: "feed" },
  { id: "ad2", title: "Perfect Date Restaurant", description: "Romantic dinner for two. Use code CONNECT20 for 20% off.", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop", link: "https://connecthub.com/advertise", sponsor: "The Bistro", type: "feed" },
  { id: "ad3", title: "Date Night Ideas", description: "Fun activities for couples. Adventure awaits!", image: "https://images.unsplash.com/photo-1506869640319-fe1a24fd76cb?w=400&h=200&fit=crop", link: "https://connecthub.com/advertise", sponsor: "FunDate Co", type: "discover" },
  { id: "ad4", title: "Gift Ideas for Your Match", description: "Surprise your match with the perfect gift. Free shipping!", image: "https://images.unsplash.com/photo-1549465220-1a8b9238f4e1?w=400&h=200&fit=crop", link: "https://connecthub.com/advertise", sponsor: "LoveGifts", type: "browse" },
  { id: "ad5", title: "Premium Dating Coach", description: "Get expert advice on your dating profile. First session free!", image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=200&fit=crop", link: "https://connecthub.com/advertise", sponsor: "DateCoach Pro", type: "messages" },
];

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ ads: [] });
  const { id } = JSON.parse(session.value);

  // Premium and Gold users don't see ads
  const user = await prisma.user.findUnique({ where: { id }, select: { tier: true } });
  if (user?.tier === "premium" || user?.tier === "gold") {
    return NextResponse.json({ ads: [], adFree: true });
  }

  const url = new URL(req.url);
  const placement = url.searchParams.get("placement") || "feed";

  // Return 1-2 random ads for the placement
  const matching = ADS.filter(a => a.type === placement || Math.random() > 0.5);
  const selected = matching.sort(() => Math.random() - 0.5).slice(0, 1);

  return NextResponse.json({ ads: selected, adFree: false });
}
