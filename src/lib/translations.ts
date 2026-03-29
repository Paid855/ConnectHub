export const LANGUAGES = [
  { code:"en", name:"English (US)", flag:"🇺🇸" },
  { code:"es", name:"Español", flag:"🇪🇸" },
  { code:"fr", name:"Français", flag:"🇫🇷" },
  { code:"pt", name:"Português", flag:"🇧🇷" },
  { code:"de", name:"Deutsch", flag:"🇩🇪" },
  { code:"it", name:"Italiano", flag:"🇮🇹" },
  { code:"nl", name:"Nederlands", flag:"🇳🇱" },
  { code:"pl", name:"Polski", flag:"🇵🇱" },
  { code:"ru", name:"Русский", flag:"🇷🇺" },
  { code:"ar", name:"العربية", flag:"🇸🇦" },
  { code:"hi", name:"हिन्दी", flag:"🇮🇳" },
  { code:"zh", name:"中文", flag:"🇨🇳" },
  { code:"ja", name:"日本語", flag:"🇯🇵" },
  { code:"ko", name:"한국어", flag:"🇰🇷" },
  { code:"tr", name:"Türkçe", flag:"🇹🇷" },
  { code:"th", name:"ไทย", flag:"🇹🇭" },
  { code:"vi", name:"Tiếng Việt", flag:"🇻🇳" },
  { code:"sw", name:"Kiswahili", flag:"🇰🇪" },
  { code:"id", name:"Bahasa Indonesia", flag:"🇮🇩" },
  { code:"ms", name:"Bahasa Melayu", flag:"🇲🇾" },
  { code:"tl", name:"Filipino", flag:"🇵🇭" },
  { code:"uk", name:"Українська", flag:"🇺🇦" },
  { code:"ro", name:"Română", flag:"🇷🇴" },
  { code:"el", name:"Ελληνικά", flag:"🇬🇷" },
  { code:"he", name:"עברית", flag:"🇮🇱" },
  { code:"sv", name:"Svenska", flag:"🇸🇪" },
  { code:"da", name:"Dansk", flag:"🇩🇰" },
  { code:"no", name:"Norsk", flag:"🇳🇴" },
  { code:"fi", name:"Suomi", flag:"🇫🇮" },
  { code:"hu", name:"Magyar", flag:"🇭🇺" },
];

type Dict = Record<string, string>;

const T: Record<string, Dict> = {
  en: { discover:"Discover", messages:"Messages", feed:"Feed", friends:"Friends", stories:"Stories", profile:"Profile", explore:"Explore", search:"Search", invite:"Invite", coins:"Coins", video:"Video", settings:"Settings", support:"Help", blocked:"Blocked", views:"Who Viewed", leaderboard:"Leaderboard", verify:"Verify", logout:"Log Out", dark_mode:"Dark Mode", light_mode:"Light Mode", like:"Like", comment:"Comment", post:"Post", send:"Send", online:"Online", offline:"Offline", share:"Share", copy:"Copy", upgrade:"Upgrade", buy_coins:"Buy Coins", language:"Language", no_ads:"No ads", unlimited_likes:"Unlimited likes", see_who_likes:"See who likes you", super_likes:"Super Likes", top_picks:"Top Picks", read_receipts:"Read receipts", profile_boost:"Profile boost", priority_support:"Priority support" },
  es: { discover:"Descubrir", messages:"Mensajes", feed:"Publicaciones", friends:"Amigos", stories:"Historias", profile:"Perfil", explore:"Explorar", search:"Buscar", invite:"Invitar", coins:"Monedas", video:"Video", settings:"Ajustes", support:"Ayuda", blocked:"Bloqueados", views:"Quién vio", leaderboard:"Clasificación", verify:"Verificar", logout:"Cerrar sesión", dark_mode:"Modo oscuro", light_mode:"Modo claro", like:"Me gusta", comment:"Comentar", post:"Publicar", send:"Enviar", online:"En línea", offline:"Desconectado", share:"Compartir", copy:"Copiar", upgrade:"Mejorar", buy_coins:"Comprar monedas", language:"Idioma" },
  fr: { discover:"Découvrir", messages:"Messages", feed:"Fil", friends:"Amis", stories:"Stories", profile:"Profil", explore:"Explorer", search:"Chercher", invite:"Inviter", coins:"Pièces", video:"Vidéo", settings:"Paramètres", support:"Aide", blocked:"Bloqués", views:"Qui a vu", leaderboard:"Classement", verify:"Vérifier", logout:"Déconnexion", dark_mode:"Mode sombre", light_mode:"Mode clair", like:"J'aime", comment:"Commenter", post:"Publier", send:"Envoyer", online:"En ligne", offline:"Hors ligne", share:"Partager", copy:"Copier", upgrade:"Améliorer", buy_coins:"Acheter", language:"Langue" },
  pt: { discover:"Descobrir", messages:"Mensagens", feed:"Feed", friends:"Amigos", stories:"Stories", profile:"Perfil", explore:"Explorar", search:"Buscar", invite:"Convidar", coins:"Moedas", video:"Vídeo", settings:"Config", support:"Ajuda", blocked:"Bloqueados", views:"Quem viu", leaderboard:"Ranking", verify:"Verificar", logout:"Sair", dark_mode:"Modo escuro", light_mode:"Modo claro", like:"Curtir", comment:"Comentar", post:"Postar", send:"Enviar", online:"Online", offline:"Offline", share:"Compartilhar", copy:"Copiar", upgrade:"Melhorar", buy_coins:"Comprar", language:"Idioma" },
  de: { discover:"Entdecken", messages:"Nachrichten", feed:"Feed", friends:"Freunde", stories:"Stories", profile:"Profil", explore:"Erkunden", search:"Suchen", invite:"Einladen", coins:"Münzen", video:"Video", settings:"Einstellungen", support:"Hilfe", blocked:"Blockiert", views:"Wer hat gesehen", leaderboard:"Rangliste", verify:"Verifizieren", logout:"Abmelden", dark_mode:"Dunkelmodus", light_mode:"Hellmodus", like:"Gefällt mir", comment:"Kommentar", post:"Posten", send:"Senden", online:"Online", offline:"Offline", share:"Teilen", copy:"Kopieren", upgrade:"Upgrade", buy_coins:"Kaufen", language:"Sprache" },
  ar: { discover:"اكتشف", messages:"الرسائل", feed:"المنشورات", friends:"الأصدقاء", stories:"القصص", profile:"الملف", explore:"استكشف", search:"بحث", invite:"دعوة", coins:"العملات", video:"فيديو", settings:"الإعدادات", support:"المساعدة", blocked:"المحظورين", views:"من شاهد", leaderboard:"المتصدرين", verify:"التحقق", logout:"خروج", dark_mode:"وضع داكن", light_mode:"وضع فاتح", like:"إعجاب", comment:"تعليق", post:"نشر", send:"إرسال", online:"متصل", offline:"غير متصل", share:"مشاركة", copy:"نسخ", upgrade:"ترقية", buy_coins:"شراء", language:"اللغة" },
  hi: { discover:"खोजें", messages:"संदेश", feed:"फीड", friends:"दोस्त", stories:"स्टोरीज", profile:"प्रोफाइल", explore:"एक्सप्लोर", search:"खोज", invite:"आमंत्रित", coins:"सिक्के", video:"वीडियो", settings:"सेटिंग्स", support:"सहायता", blocked:"ब्लॉक", views:"किसने देखा", leaderboard:"लीडरबोर्ड", verify:"सत्यापन", logout:"लॉग आउट", dark_mode:"डार्क मोड", light_mode:"लाइट मोड", like:"पसंद", comment:"टिप्पणी", post:"पोस्ट", send:"भेजें", online:"ऑनलाइन", offline:"ऑफलाइन", share:"शेयर", copy:"कॉपी", upgrade:"अपग्रेड", buy_coins:"खरीदें", language:"भाषा" },
  zh: { discover:"发现", messages:"消息", feed:"动态", friends:"好友", stories:"故事", profile:"资料", explore:"探索", search:"搜索", invite:"邀请", coins:"金币", video:"视频", settings:"设置", support:"帮助", blocked:"屏蔽", views:"谁看了", leaderboard:"排行榜", verify:"验证", logout:"退出", dark_mode:"深色模式", light_mode:"浅色模式", like:"喜欢", comment:"评论", post:"发布", send:"发送", online:"在线", offline:"离线", share:"分享", copy:"复制", upgrade:"升级", buy_coins:"购买", language:"语言" },
};

export function t(lang: string, key: string): string {
  return T[lang]?.[key] || T.en[key] || key;
}
