export default function sitemap() {
  return [
    { url: "https://connecthub.love", lastModified: new Date(), changeFrequency: "daily" as const, priority: 1 },
    { url: "https://connecthub.love/about", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: "https://connecthub.love/contact", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: "https://connecthub.love/help", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.7 },
    { url: "https://connecthub.love/terms", lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.5 },
    { url: "https://connecthub.love/privacy", lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.5 },
    { url: "https://connecthub.love/advertise", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.6 },
    { url: "https://connecthub.love/login", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
    { url: "https://connecthub.love/signup", lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.9 },
  ];
}
