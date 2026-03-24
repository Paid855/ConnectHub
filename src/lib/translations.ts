export const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "yo", name: "Yorùbá", flag: "🇳🇬" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: { hero_title: "Find Your", hero_highlight: "Perfect Match", hero_desc: "AI-powered matching, video-verified profiles, and real connections.", cta: "Start Matching Free", features: "Features", how: "How It Works", pricing: "Pricing", login: "Log In", signup: "Get Started" },
  es: { hero_title: "Encuentra Tu", hero_highlight: "Pareja Perfecta", hero_desc: "Emparejamiento con IA, perfiles verificados por video y conexiones reales.", cta: "Empieza Gratis", features: "Funciones", how: "Cómo Funciona", pricing: "Precios", login: "Iniciar Sesión", signup: "Registrarse" },
  fr: { hero_title: "Trouvez Votre", hero_highlight: "Match Parfait", hero_desc: "Matching IA, profils vérifiés par vidéo et vraies connexions.", cta: "Commencer Gratuitement", features: "Fonctionnalités", how: "Comment ça marche", pricing: "Tarifs", login: "Connexion", signup: "S'inscrire" },
  pt: { hero_title: "Encontre Seu", hero_highlight: "Par Perfeito", hero_desc: "Matching com IA, perfis verificados por vídeo e conexões reais.", cta: "Começar Grátis", features: "Recursos", how: "Como Funciona", pricing: "Preços", login: "Entrar", signup: "Cadastrar" },
  ar: { hero_title: "اعثر على", hero_highlight: "شريكك المثالي", hero_desc: "مطابقة بالذكاء الاصطناعي، ملفات تعريف موثقة بالفيديو، واتصالات حقيقية.", cta: "ابدأ مجاناً", features: "الميزات", how: "كيف يعمل", pricing: "الأسعار", login: "تسجيل الدخول", signup: "سجل الآن" },
  hi: { hero_title: "अपना खोजें", hero_highlight: "परफेक्ट मैच", hero_desc: "AI-संचालित मैचिंग, वीडियो-सत्यापित प्रोफाइल और वास्तविक कनेक्शन।", cta: "मुफ्त शुरू करें", features: "विशेषताएं", how: "कैसे काम करता है", pricing: "मूल्य", login: "लॉग इन", signup: "साइन अप" },
  yo: { hero_title: "Wá", hero_highlight: "Ẹni Tó Bá Ọ Mu", hero_desc: "Ìbáṣepọ̀ AI, àwọn profaili tí a fìdí múlẹ̀, àti ìjùmọ̀ gidi.", cta: "Bẹ̀rẹ̀ Lọ́fẹ̀ẹ́", features: "Àwọn Ẹ̀yà", how: "Bí ó ṣe ń ṣiṣẹ́", pricing: "Iye Owó", login: "Wọlé", signup: "Forúkọ Sílẹ̀" },
  zh: { hero_title: "找到你的", hero_highlight: "完美匹配", hero_desc: "AI驱动的匹配、视频验证的个人资料和真实的连接。", cta: "免费开始", features: "功能", how: "如何运作", pricing: "价格", login: "登录", signup: "注册" },
  de: { hero_title: "Finde Dein", hero_highlight: "Perfektes Match", hero_desc: "KI-gestütztes Matching, videoverifizierte Profile und echte Verbindungen.", cta: "Kostenlos Starten", features: "Funktionen", how: "So funktioniert's", pricing: "Preise", login: "Anmelden", signup: "Registrieren" },
  sw: { hero_title: "Pata Yako", hero_highlight: "Mechi Kamili", hero_desc: "Upatanishaji wa AI, wasifu uliohakikiwa kwa video, na miunganisho ya kweli.", cta: "Anza Bure", features: "Vipengele", how: "Inavyofanya Kazi", pricing: "Bei", login: "Ingia", signup: "Jisajili" },
};

export function t(lang: string, key: string): string {
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;
}
