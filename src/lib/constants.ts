/** Drop ekranindaki sabit tag'ler. Kullanici kendi tag'ini de ekleyebilir. */
export const CORE_TAGS = [
  "daily life",
  "relationships",
  "work",
  "family",
  "social",
  "mental",
  "habits",
  "fears",
] as const;

/** Profil emoji seti — hepsi ayni ailenin sembolleri: yildiz, cicek, kar tanesi. */
export const EMOJIS = [
  "✦","✧","✺","✳","✴","✷","✸",
  "❂","◉","◐","❀","✿","❁","❊",
  "❄","❅","❆","✼","✻",
] as const;

/** Feed dilleri. Arayuzu degistirmez — sadece hangi dildeki thing'leri gordugunu belirler. */
export const FEED_LANGS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "it", label: "Italiano" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "bn", label: "বাংলা" },
  { code: "ur", label: "اردو" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "ms", label: "Bahasa Melayu" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "th", label: "ไทย" },
  { code: "fa", label: "فارسی" },
  { code: "pl", label: "Polski" },
  { code: "nl", label: "Nederlands" },
  { code: "sv", label: "Svenska" },
  { code: "uk", label: "Українська" },
  { code: "el", label: "Ελληνικά" },
  { code: "he", label: "עברית" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
];

export const FAQ = [
  {
    q: "What is SameThing?",
    a: "A quiet place to drop a thought and see who quietly agrees. Vote Same or Nah, watch the similarity score reveal you're not the only one.",
  },
  {
    q: "What is a Rare Thing?",
    a: "A thing almost nobody relates to. Once at least 20 people have voted and 1% or fewer said Same, that thing becomes a Rare Thing. The badge belongs to the thing, not to you — your account stays exactly where it was.",
  },
  {
    q: "Can I change my vote?",
    a: "No. Same or Nah is final — one vote per thing, no takebacks. Read it twice before you answer.",
  },
  {
    q: "Why do some posts show anonymous?",
    a: "The person turned on Post anonymously when they dropped it. Their username is hidden from every reader, though the post stays linked to their account so moderation still works.",
  },
  {
    q: "How does @mention work?",
    a: "Type @ and a username inside a thing or a comment. They get a notification and the name turns into a link to their profile. Anyone can switch mentions off in Account & privacy.",
  },
  {
    q: "Can I change my username?",
    a: "Yes, in Edit profile. Old mentions keep pointing at you, but text written before the change still shows the old handle.",
  },
  {
    q: "Who can DM me?",
    a: "Nobody. Direct messages are off across SameThing for now. The only way to reach someone is a comment or a mention.",
  },
  {
    q: "How do I close comments on a thing?",
    a: "Turn on Close to comments before you drop it. Votes stay open either way.",
  },
  {
    q: "How do I report something?",
    a: "Open the \u00b7\u00b7\u00b7 menu on any thing and choose Report. Tell us what's wrong in a line — it reaches us directly.",
  },
];
