# SameThing.

You're never the only one.

Bir düşünceyi düşür ("drop"), kaç kişinin aynısını yaşadığını gör. Her thing'in iki cevabı var: **Same** ya da **Nah** — ve bu cevap kesindir.

## Kurulum

```bash
npm install
cp .env.example .env      # Supabase URL + anon key
npm run dev
```

1. **Şema:** Supabase Dashboard → SQL Editor → `supabase/schema.sql`'i çalıştır.
2. **Google girişi:** Authentication → Providers → Google'ı aç, redirect URL olarak site adresini ekle.
3. **AI:** OpenRouter anahtarı **istemciye konmaz** — Edge Function'da durur:

```bash
supabase secrets set OPENROUTER_API_KEY=sk-or-...
supabase secrets set SITE_URL=https://samething.lovable.app
supabase functions deploy analyze-thing
```

## Kurallar

| Kavram | Nasıl çalışıyor | Nerede |
|---|---|---|
| **Oy** | Bir kez verilir. Değiştirilemez, geri alınamaz. | `votes` — RLS'te update/delete politikası **yok** |
| **Similarity** | `same / (same + nah)` | `thing_stats` view |
| **Rare Thing** | ≥ 20 oy **ve** similarity ≤ %1. Rozet **thing'e** aittir; hesabın planı değişmez. | `rare_things` view |
| **You're the only one** | Thing rare eşiğini geçtiği anda, thing başına bir kez | `notify_only_one` trigger |
| **Featured** | Son 48 saat, `oy×2 + yorum×3`, ilk 12; pencere kaydıkça kendini tazeler | `featured_things` view |
| **Sonucu görme** | Oyunu verdiysen (ya da senin thing'inse) similarity açılır | `revealed` / `owned` |
| **Yorum pin** | Sadece thing'in sahibi ("creator"), en fazla 3 tane | RLS + `guard_pin_limit` |
| **Strike / mute** | Safety filtresi post'u gizler → strike. 3 strike = 24 saat mute. | `strike_user` / `guard_muted` |
| **Feed language** | Thing yazıldığı dilde durur; feed filtreler, arayüzü çevirmez | `things.lang` (AI tespit eder) |
| **DM** | Yok. `open_to_chat` duruyor ama hiçbir şey yapmıyor. | `profiles.open_to_chat` |

E�ikler kodda değil `app_config` tablosunda:

```sql
update app_config set value = 0.02 where key = 'rare_max_similarity';
```

## AI (analyze-thing)

Yazarken 800 ms sessizlikte tetiklenir, iki iş yapar:

- **Güvenlik** — nefret, taciz, cinsel içerik, şiddet, doxxing, spam, kendine zarar/şiddet teşviki → `ok: false`, post edilemez.
- **Tag önerisi** — çekirdek 8 tag'den 1–3, gerekirse tek kelimelik yeni tag. Chip'lerde ✧ ile işaretlenir, "TAP TO ACCEPT" ile kabul edilir.
- Ayrıca dili tespit eder (`things.lang`) ve daha derli toplu bir sürüm önerir ("Use this" / "Keep mine").

`crisis` bayrağı `ok`'tan **ayrıdır**: intihar düşüncesi olan biri engellenmez — engellenirse zaten yalnız olan insan susturulmuş olur. Post edilir, ama yanında yardım hattı gösterilir.

AI'a ulaşılamazsa akış durmaz: analiz yoksa post serbest.

## Yapı

```
supabase/schema.sql                 tablolar, RLS, view'lar, trigger'lar, moderasyon, delete_account()
supabase/functions/analyze-thing/   OpenRouter — güvenlik + tag önerisi (anahtar burada)
src/lib/                            supabase client, tipler, sabitler, yardımcılar
src/hooks/                          useAuth, useThings, useVote, useNotifications, useToast, useAnalysis
src/components/                     Header, BottomNav, ThingCard, CommentCard, ReportMenu,
                                    SimilarityBar, MentionText, Wordmark
src/pages/                          Feed, Search, Drop, Inbox, Me, EditProfile, Settings,
                                    NotificationSettings, AccountSettings, Legal, FAQPage,
                                    ThingDetail, PublicProfile, Auth
```

## Kararlar

- **Oy kesin.** RLS'te `votes` için update/delete politikası hiç yazılmadı — kural veritabanında, arayüzde değil.
- **Oylar gizli.** Herkes yalnızca kendi oyunu okur; "kim Nah dedi" hiçbir zaman istemciye gitmez. Sayılar view'dan gelir.
- **Anonimlik DB'de kesilir.** `things_feed` ve `comments_view`, anonimse `username`'i `null` döndürür. Frontend'e hiç ulaşmaz — `display:none` değil.
- **Rare Thing thing'in rozeti.** Trigger hesabın planına dokunmaz.
- **Bildirim tercihleri trigger'da okunur.** Kapattığın bildirim hiç yazılmaz; sonradan filtrelenmez.
- **@mention'ı kapatan gerçekten kapatır.** `allow_mentions` false ise ne kayıt ne bildirim oluşur.
- **Report sabit listeli.** Serbest metin yalnızca "Other" için — `check` constraint zorluyor.
- **Gizlenen post sahibinde kalır.** RLS `not hidden or auth.uid() = user_id`: sahibi neyin gizlendiğini ve niye gizlendiğini görür.

## Açık uçlar

- **Edge Function post'u gizlemiyor** — şu an `ok:false` sadece istemcide "Drop it"i durduruyor. Birisi API'ye doğrudan vurursa post geçer. Sağlamı: insert'i de bir trigger/function arkasına almak, ya da `analyze-thing`'i insert eden tarafa taşımak. Söyle, yaparım.
- **Strike'lar hiç düşmüyor** — kalıcı sayaç. 30 günde bir affetmek istersen bir cron gerekir.
- **PremiumThing** — `plan` alanı ve "Upgrade — soon" butonu duruyor; ne satıldığı belirsiz.
- **Export** (Privacy'de söz verildi) — henüz kod yok, elle e-posta gerekiyor.
