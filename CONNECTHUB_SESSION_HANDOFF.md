# ConnectHub — Session Handoff for Next Chat

> **Purpose:** Drop this whole file into a new chat as the first message so the next Claude instance picks up exactly where we left off. No re-explaining needed.

---

## Project at a glance

- **Site:** https://connecthub.love (also www.connecthub.love)
- **Repo:** github.com/Paid855/ConnectHub
- **Local path:** `~/Dating_Website/` on user's MacBook
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind v4, Prisma 5, Neon PostgreSQL, Vercel
- **Owner style:** Confirms with "Boom 💥" or "my gee." Prefers terminal copy-paste over VS Code edits.
- **Vercel deploy hook:** `curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_sPVEKaloh3vAzZrEGUyjs8QzpZit/goszXjoFuM"`

---

## What we accomplished in the last session

### ✅ Photo upload — FULLY FIXED
Killed the Vercel 4.5MB body limit problem permanently. Every image upload (signup, profile, gallery) now goes browser → Cloudinary direct, then only the URL hits the API.

**Files touched:**
- `src/app/api/cloudinary-sign/route.ts` — server-signed upload tokens
- `src/lib/upload-photo.ts` — reusable client helper (compress + sign + upload)
- `src/app/dashboard/profile/page.tsx` — profile photo handler patched
- `src/components/PhotoGallery.tsx` — gallery handler patched
- `src/app/api/auth/photos/route.ts` — rewritten URL-only API (writes Postgres `String[]` natively, no JSON.stringify bug)

### ⏸️ Twilio SMS — DEFERRED to v2
User decided phone verification can wait. Email verification via Namecheap Private Email is enough for early users. Trial credit ($14.35) sits unused; can release the US number later.

### 🔒 Admin lockdown — STAGES 1–4 DONE, STAGE 5 IN PROGRESS

**Architecture decided:**
- Subdomain isolation: `admin.connecthub.love` (separate from public site)
- Secret URL slug stored in `ADMIN_SLUG` env var
- Final admin URL: `https://admin.connecthub.love/<ADMIN_SLUG>`
- Old path `/admin-page/c-panel-control` returns 404 in production

**8 layers of defense:**
1. Subdomain DNS isolation (live, valid SSL)
2. Middleware enforcing slug
3. Upstash Redis rate limit (5 attempts / 15 min) — **PROVEN WORKING in tests**
4. Real `role` field on User table (DB-side check)
5. HMAC-signed session cookies (httpOnly, secure, sameSite=strict, domain-scoped)
6. Server role check on every admin API call
7. Audit log table (`AdminLog`) for every admin action
8. Email alerts on 3+ failed logins → support@connecthub.love

---

## What's currently broken / blocking

### ⚠️ Bug 1: ADMIN_SLUG malformed in local `.env`

**Symptom:**
```
grep -c '^ADMIN_SLUG=' .env  →  0
grep -c '^ADMIN_SECRET=' .env  →  1   ← this one is clean
```

**Diagnosis:** `ADMIN_SLUG` line in `.env` has whitespace/colon between name and value (e.g. `ADMIN_SLUG : value` or `ADMIN_SLUG = value` instead of `ADMIN_SLUG=value`). Node's dotenv parser silently ignores malformed lines.

**Fix prepared (Python script):** This script reads `.env`, finds the malformed `ADMIN_SLUG` line regardless of separator, extracts the value, and rewrites in correct format. User needs to run it:

```bash
cd ~/Dating_Website && python3 << 'PYEOF'
with open(".env") as f:
    lines = f.readlines()
fixed = False
new_lines = []
slug_value = None
for line in lines:
    stripped = line.strip()
    if "ADMIN_SLUG" in stripped and not stripped.startswith("#"):
        for sep in ["=", ":"]:
            if sep in stripped:
                _, _, value = stripped.partition(sep)
                slug_value = value.strip().strip('"').strip("'")
                break
        else:
            slug_value = stripped.replace("ADMIN_SLUG", "").strip()
        if slug_value:
            new_lines.append(f'ADMIN_SLUG={slug_value}\n')
            fixed = True
            print(f"✓ Found ADMIN_SLUG, value length: {len(slug_value)} chars")
        else:
            print("✗ ADMIN_SLUG line has no value!")
            new_lines.append(line)
    else:
        new_lines.append(line)
if fixed:
    with open(".env", "w") as f:
        f.writelines(new_lines)
    print("✓ .env rewritten with correct format")
PYEOF
```

After running, verify:
```bash
grep -c '^ADMIN_SLUG=' .env   # should be 1
grep -c '^ADMIN_SECRET=' .env # should be 1
```

### ⚠️ Bug 2: ADMIN_SLUG on Vercel may have same typo

User likely typed it the same way in Vercel dashboard. Need to:
1. Go to Vercel → ConnectHub → Settings → Environment Variables
2. Edit `ADMIN_SLUG` — make sure **Key** field is exactly `ADMIN_SLUG` (no spaces, no colon, no quotes), **Value** is just the slug (no `ADMIN_SLUG=` prefix, no quotes)
3. Re-enable **Sensitive** flag on `ADMIN_SLUG` and `ADMIN_SECRET` (user disabled it earlier thinking it was the cause — it wasn't)
4. Save → trigger redeploy

### ⚠️ Bug 3: Login API returns 500 on admin subdomain (Test 4)

When middleware fixes are applied, this may self-heal. If not, likely cause is one of: audit log write to `AdminLoginAttempt` table, email alert SMTP, or bcrypt compare. Need to read Vercel logs to diagnose:
```bash
timeout 15 npx vercel logs 2>&1 | grep -iE "error|admin|500" | tail -20
```
Or check Vercel dashboard → Logs filter by `/api/admin/login`.

---

## Test results from last session

| Test | Expected | Got | Status |
|---|---|---|---|
| 1. Old admin path on main domain | 404 | 200 | ❌ Middleware not firing (slug bug) |
| 2. Admin API on main domain | 404 | 405 | ❌ Same root cause |
| 3. Wrong slug on admin subdomain | 404 | 200 | ❌ Same root cause |
| 4. Login API on admin subdomain | 401 | 500 | ❌ Server error (TBD) |
| 5. Rate limit kicks in after 5 attempts | 401×5 then 429 | 401, 401, 401, 401, 429, 429, 429 | ✅ **PERFECT** |

**Upstash rate limiting WORKS.** That's the hardest piece. Once the slug env var loads correctly, tests 1–3 should pass instantly. Test 4 needs separate investigation.

---

## Files we created / modified for admin lockdown

| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Added `role`, `adminLastLogin`, `adminLastLoginIp` on User; added `AdminLog` and `AdminLoginAttempt` models |
| `src/lib/admin-session.ts` | HMAC-signed session sign/verify (uses `ADMIN_SECRET`) |
| `src/lib/admin-ratelimit.ts` | Upstash Redis rate limiter |
| `src/lib/admin-audit.ts` | Audit logger + login attempt logger + getClientIp helper |
| `src/lib/admin-alert.ts` | Email alert via Namecheap SMTP when 3+ failed logins from same IP |
| `src/lib/admin-auth.ts` | Unified `requireAdmin()` guard for all admin routes |
| `src/middleware.ts` | Subdomain + slug enforcement |
| `src/app/api/admin/login/route.ts` | Rewritten — rate limit + bcrypt + audit + signed cookie |
| `src/app/api/admin/me/route.ts` | DB role re-verification on every request |
| `src/app/api/admin/logout/route.ts` | Audit logging on logout |
| `src/app/api/admin/audit/route.ts` | Audit log viewer API |
| `src/app/api/admin/users/route.ts` | Patched to use `requireAdmin` |
| `src/app/api/admin/verifications/route.ts` | Patched |
| `src/app/api/admin/withdrawals/route.ts` | Patched |
| `src/app/api/admin/password/route.ts` | Patched |
| `src/app/api/admin/reports/route.ts` | Patched |
| `src/app/api/admin/revenue/route.ts` | Patched (had duplicate import, fixed) |

DB migration applied successfully via `npx prisma db push`. `admin@connecthub.com` promoted to `role: "admin"`.

---

## Env vars expected (locally and on Vercel)

| Variable | Status | Notes |
|---|---|---|
| `ADMIN_SECRET` | ✅ Set both places | HMAC signing key |
| `ADMIN_SLUG` | ⚠️ Malformed locally, possibly Vercel too | Secret URL path |
| `UPSTASH_REDIS_REST_URL` | ✅ Both | Rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | ⚠️ User pasted token in chat earlier — should rotate | Rate limit |
| `CLOUDINARY_*` (3 vars) | ✅ Both | Photo uploads |
| `EMAIL_USER`, `EMAIL_PASS` | ✅ Both | Namecheap SMTP for alerts |

---

## Resume plan (next chat)

**Step 1:** Run the Python script in Bug 1 to fix `ADMIN_SLUG` formatting locally.

**Step 2:** Verify both env vars exist correctly on Vercel dashboard (not via CLI — CLI hangs without `vercel link`).

**Step 3:** Re-enable Sensitive flag on `ADMIN_SLUG` and `ADMIN_SECRET` in Vercel (user disabled them mistakenly thinking it was blocking access — Sensitive is display-only, doesn't affect runtime).

**Step 4:** Redeploy via curl hook.

**Step 5:** Re-run the 5 security tests:
```bash
echo "=== TEST 1 (should be 404) ==="
curl -s -o /dev/null -w "%{http_code}\n" https://www.connecthub.love/admin-page/c-panel-control
echo "=== TEST 2 (should be 404) ==="
curl -s -o /dev/null -w "%{http_code}\n" https://www.connecthub.love/api/admin/login -X POST
echo "=== TEST 3 (should be 404) ==="
curl -s -o /dev/null -w "%{http_code}\n" https://admin.connecthub.love/wrongpath
echo "=== TEST 4 (should be 401, not 500) ==="
curl -s -o /dev/null -w "%{http_code}\n" https://admin.connecthub.love/api/admin/login -X POST -H "Content-Type: application/json" -d '{"email":"a","password":"b"}'
echo "=== TEST 5 rate limit ==="
for i in 1 2 3 4 5 6 7; do echo -n "Attempt $i: "; curl -s -o /dev/null -w "%{http_code}\n" https://admin.connecthub.love/api/admin/login -X POST -H "Content-Type: application/json" -d '{"email":"x","password":"x"}'; done
```

**Step 6:** If Test 4 is still 500, read Vercel logs and fix.

**Step 7:** Test the actual admin login at `https://admin.connecthub.love/<ADMIN_SLUG>` in browser with `admin@connecthub.com` + password.

**Step 8 (Stage 6):** Build the redesigned admin dashboard:
- Sidebar nav (Overview, Users, Verifications, Reports, Withdrawals, Audit Log, Settings)
- Stats cards at top (users today/week/month, revenue, pending, flagged)
- User detail drawer (slide-in panel)
- Audit log table page
- Charts via recharts
- Bulk actions + CSV export

---

## Security rules from this session (keep enforcing)

1. ❌ Never paste secrets, tokens, API keys, passwords, or session cookies in chat
2. ❌ Never expose `ADMIN_SECRET` value or `ADMIN_SLUG` value
3. ✅ Sensitive flag stays ON for `ADMIN_SLUG` and `ADMIN_SECRET` in Vercel
4. ✅ User says "done" or "saved" — no values needed
5. ⚠️ Upstash token was leaked earlier in chat — should be rotated when convenient

---

## Quick commands cheat sheet

```bash
# Deploy
git add -A && git commit -m "..." && git push && curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_sPVEKaloh3vAzZrEGUyjs8QzpZit/goszXjoFuM"

# Check env (names only, no values)
grep -E "^[A-Z_]+=" .env | awk -F= '{print $1}' | sort

# Build locally
npx next build 2>&1 | tail -15

# Read Vercel logs
timeout 15 npx vercel logs 2>&1 | tail -30

# DB sync
npx prisma db push && npx prisma generate

# Wake up Neon if paused
# Visit https://console.neon.tech → click project
```

---

**Pick up from Step 1 in the Resume Plan above.**
