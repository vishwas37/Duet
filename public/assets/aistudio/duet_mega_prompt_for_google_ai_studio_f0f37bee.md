# MEGA PROMPT: Build "Duet" — A Feminist, Queer-Friendly, Minimalist Dating Web App for the Intentionally Childfree

> **How to use this prompt:** Copy and paste this entire document into **Google AI Studio** (Build / Gemini Pro). It contains the full product specification, feminist & queer-inclusive UX principles, Hinge-style UI blueprint, Firebase Storage & Firestore data architecture, and passwordless Email OTP implementation guide.

---

## ROLE & MISSION

Act as a Principal Product Designer and Staff Full-Stack Engineer. Build **Duet**, a complete, production-ready, modern minimalist editorial dating web application designed exclusively for the **intentionally childfree community**.

Duet is built from the ground up to be:
1. **Uncompromisingly Childfree:** Zero fence-sitters, zero "maybe someday," zero wasted emotional labor.
2. **Intersectional Feminist & Queer-Friendly:** Inclusive of all genders, pronouns, sexualities, and relationship structures, with consent-first mechanics and robust safety controls built natively into the experience.
3. **Hinge-Style Editorial Depth:** Rich vertical profiles that interleave up to 6 uploaded photos (stored in **Firebase Storage**) with curated prompts, where users can like or send a thoughtful comment on a **specific photo or specific prompt**.
4. **Passwordless Email OTP Authentication (No Phone Numbers):** Privacy-respecting email-only 6-digit OTP verification so users never have to hand over their personal phone number.
5. **Fully Persistent & Real-Time:** Backed by **Firebase Authentication**, **Cloud Firestore**, and **Firebase Storage**.

---

## 1. VISUAL IDENTITY & EDITORIAL DESIGN SYSTEM

Design Duet like an independent modern magazine (think *Kinfolk* meets *Hinge* and *Lex*), rejecting neon swiping clichés and heteronormative tropes.

- **Color Palette:**
  - **Primary Canvas:** Warm Alabaster `#FAF9F6`
  - **Card Surface:** Pure Crisp White `#FFFFFF` with `1px solid #EAE6DF` hairline borders
  - **Primary Ink:** Deep Charcoal `#18181B`
  - **Secondary / Muted Ink:** Warm Slate `#71717A`
  - **Primary Accent (Verified / Intent / Like):** Deep Botanical Sage `#3F6251` (Soft tint: `#EEF3F0`, Hover: `#345143`)
  - **Secondary Accent (Warm Note / Feminist Highlight):** Muted Terracotta `#C86D51` (Soft tint: `#FBF1EE`, Hover: `#B45E43`)
  - **Queer / Community Accent (Subtle):** Soft Plum `#6D4C6E` (Soft tint: `#F6F1F6`) for subtle inclusivity tags where appropriate—never garish or rainbow-washed.
- **Typography:**
  - **Display / Editorial Prompts / Names:** `Instrument Serif` (Google Fonts) — crisp, literary, high-contrast serif.
  - **UI / Controls / Body:** `Inter` (Google Fonts) — clean geometric sans-serif with generous line-height (`1.5–1.65`).
- **Layout & Motion:**
  - Generous whitespace, rounded editorial cards (`rounded-[2rem]`), ultra-subtle shadows.
  - Smooth CSS / Framer Motion transitions between onboarding steps, profile cards, and drawers.
  - **Responsive Architecture:** Mobile-first bottom navigation bar (`Discover`, `Likes You`, `Connections`, `Profile`) on viewports `< 768px`, transitioning seamlessly to a clean top bar / centered editorial column + split-pane chat on desktop (`>= 768px`).

---

## 2. TECH STACK & ARCHITECTURE

Build the application using:
- **Frontend:** React 18+ with TypeScript, Vite, Tailwind CSS, and `lucide-react` icons.
- **Backend / Persistence (Firebase v11 Modular SDK):**
  - `firebase/auth` — Persistent user accounts & session management.
  - `firebase/firestore` — Profiles, element-level likes/notes, mutual matches, real-time messages, blocks, and reports.
  - `firebase/storage` — Multi-photo user gallery uploads with progress tracking and deletion cleanup.
- **Email OTP Delivery (No Phone Numbers):**
  - Implement a clean `authOtpService.ts` abstraction supporting **both**:
    1. **Production Email OTP Endpoint** (Firebase Cloud Function / Serverless API using **Resend** or **SendGrid** + Firestore `email_otps` collection with SHA-256 hashed 6-digit codes, 10-minute expiration, rate limiting, and `admin.auth().createCustomToken(uid)`).
    2. **Firebase Passwordless Email Link Fallback** (`sendSignInLinkToEmail` / `isSignInWithEmailLink`).
    3. **Seamless Preview / Dev Mode Fallback** (automatically active if no external SMTP/Cloud Function URL is configured in `.env`, displaying the generated 6-digit OTP inside a clean, clearly labeled "Dev Email Inbox Preview" toast/drawer so anyone testing in Google AI Studio can experience the complete 6-digit Email OTP flow immediately, backed by real Firebase Auth persistence).

Provide a complete `.env.example` file AND a `functions/sendEmailOtp.ts` reference file for deploying the real production Email OTP Cloud Function with Resend.

---

## 3. FEMINIST & QUEER-FRIENDLY PRODUCT PRINCIPLES (MANDATORY)

Embed these principles into the data model, UI copy, onboarding, and safety tools:

### A. Expansive Gender, Pronouns & Sexuality
- **Gender Identity (Multi-select + Custom Self-Describe):**
  - `Woman`, `Man`, `Non-binary`, `Trans Woman`, `Trans Man`, `Genderqueer`, `Genderfluid`, `Agender`, `Two-Spirit`, `Questioning`, plus `Self-describe` (free text input).
  - Toggle: *"Show my gender on my profile"* (on by default, user-controlled).
- **Pronouns (Multi-select + Custom):**
  - `she/her`, `he/him`, `they/them`, `she/they`, `he/they`, `ze/zir`, plus custom input.
- **Sexual Orientation (Multi-select + Custom):**
  - `Queer`, `Bisexual`, `Pansexual`, `Lesbian`, `Gay`, `Straight`, `Asexual`, `Demisexual`, `Aromantic`, `Polysexual`, `Questioning`, `Self-describe`.
  - Toggle: *"Show my orientation on my profile"*.
- **Who You Want to Meet (Inclusive Discovery Preferences):**
  - Users can select any combination of genders (e.g., `Women`, `Non-binary & Gender-expansive folks`, `Men`, `Trans folks`, or `Everyone`), plus an optional **"Prioritize Queer Community"** filter toggle.
- **Relationship Structure:**
  - `Monogamous`, `Ethical Non-Monogamy (ENM)`, `Polyamorous`, `Open to exploring`, `Queerplatonic / Life Partnership`.

### B. Consent-First Feminist Safety Controls
- **Zero-Tolerance Pledge (Mandatory during Onboarding):**
  - Every user must explicitly affirm both:
    1. **The Childfree Boundary:** *"I am 100% certain I do not want children—biological, adopted, or step-parenting—and will never pressure or hope for a partner to change their mind."*
    2. **The Feminist & Queer Respect Pledge:** *"I commit to enthusiastic consent, equal emotional labor, and zero tolerance for misogyny, transphobia, queerphobia, casteism, or unsolicited explicit content."*
- **Proactive / Incognito Discovery Mode:**
  - A built-in privacy toggle in Settings/Onboarding: *"Only show my profile to people I have liked first."* Empowers women, trans, and queer users to browse safely without unsolicited attention.
- **Consent-Based First Message / Note Control:**
  - Toggle: *"Allow opening notes with likes"* vs. *"Only allow messages after a mutual match."*
- **Granular Childfree & Safety Reporting:**
  - Report reasons must explicitly include:
    - `Misrepresented childfree status / secretly wants kids`
    - `Pressuring me to change my mind about children`
    - `Misogyny, sexism, or disrespecting boundaries`
    - `Queerphobia / transphobia`
    - `Harassment or unsolicited explicit content`
    - `Fake profile / spam`
  - Instant **Block & Hide** removes the user immediately from Discover, Likes You, and Matches.

---

## 4. COMPLETE DATA MODEL (FIRESTORE & FIREBASE STORAGE)

### TypeScript Interfaces

~~~ts
export interface PhotoItem {
  id: string;
  url: string;               // Firebase Storage download URL
  storagePath: string;       // e.g. users/{uid}/photos/{photoId}.jpg
  order: number;             // 0..5
  promptLabel?: string;      // Optional Hinge-style photo caption e.g. "My happy place"
  caption?: string;
}

export interface PromptItem {
  id: string;
  question: string;
  answer: string;            // max 260 chars
}

export interface UserProfile {
  uid: string;
  email: string;
  emailVerifiedViaOtp: boolean;
  displayName: string;
  age: number;               // Strictly 18+
  city: string;              // Quick picks (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai, Kolkata, Goa) + custom
  hometown?: string;
  workOrCraft?: string;      // e.g. "Architect & ceramicist"

  // Inclusive Identity
  genders: string[];
  showGender: boolean;
  pronouns: string[];
  orientations: string[];
  showOrientation: boolean;
  relationshipStyles: string[];

  // Childfree Verification & Nuance
  childfreePledgeSigned: boolean;
  feministQueerPledgeSigned: boolean;
  childfreeStanceBadge:
    | '100% Firmly Childfree'
    | 'Childfree & Sterilized / Vasectomy'
    | 'DINK Life Enthusiast'
    | 'Childfree Pet Parent';
  showSterilizedBadge: boolean;

  // Values & Lifestyle Chips (3 to 8 selected)
  valuesAndLifestyle: string[];
  // Examples: "Intersectional feminist", "Queer community", "Therapy-positive",
  // "Equal emotional labor", "FIRE / Financial independence", "Slow travel",
  // "Pet parent", "Quiet Sundays", "Creative pursuits", "Outdoors & nature",
  // "Left-leaning / Progressive", "Sober / Low-alcohol", "Neurodivergent-friendly"

  // Hinge-Style Media & Prompts
  photos: PhotoItem[];       // 1 to 6 photos (Firebase Storage)
  prompts: PromptItem[];     // 3 prompts

  // Discovery Preferences & Feminist Safety Settings
  discoveryPreferences: {
    interestedInGenders: string[]; // ['Everyone'] or specific array
    ageMin: number;
    ageMax: number;
    cities: string[];              // Empty array = All Cities
    prioritizeQueerCommunity: boolean;
  };
  safetySettings: {
    proactiveIncognitoMode: boolean;     // Only visible to people I've liked
    allowNotesBeforeMatch: boolean;      // Consent toggle for icebreaker notes
    pauseProfile: boolean;               // Temporarily hide from Discover
  };

  blockedUids: string[];
  createdAt: number;
  updatedAt: number;
}

export interface LikeInteraction {
  id: string;                            // `${fromUid}__${toUid}`
  fromUid: string;
  toUid: string;
  type: 'like' | 'pass';
  targetElementType?: 'photo' | 'prompt' | 'profile';
  targetElementId?: string;              // Exact photo.id or prompt.id liked!
  targetElementPreview?: string;         // Prompt text or photo URL snapshot
  note?: string;                         // Optional thoughtful comment attached to that photo/prompt
  status: 'pending' | 'matched' | 'dismissed';
  createdAt: number;
}

export interface MatchThread {
  id: string;                            // sorted `${uidA}__${uidB}`
  participants: [string, string];
  originContext?: {
    likedByUid: string;
    targetElementType: 'photo' | 'prompt' | 'profile';
    targetElementPreview: string;
    openingNote?: string;
  };
  lastMessageText?: string;
  lastMessageAt: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderUid: string;
  text: string;
  createdAt: number;
}
~~~

### Firebase Storage & Firestore Security Rules (Include in `/firebase-rules/`)
1. **Firestore Rules (`firestore.rules`):**
   - Users can only write their own `profiles/{uid}` document.
   - `email_otps` collection is completely locked from client reads/writes (`allow read, write: if false;`) — accessed only by Cloud Functions Admin SDK.
   - Users can read/write `matches` and `messages` only if `request.auth.uid in resource.data.participants`.
   - Reports (`reports/{reportId}`) are create-only for authenticated users, never readable by clients.
2. **Firebase Storage Rules (`storage.rules`):**
   - Path: `users/{uid}/photos/{photoId}`
   - `allow read: if request.auth != null;`
   - `allow write: if request.auth != null && request.auth.uid == uid && request.resource.size < 5 * 1024 * 1024 && request.resource.contentType.matches('image/.*');`
   - `allow delete: if request.auth != null && request.auth.uid == uid;`

---

## 5. STEP-BY-STEP ONBOARDING FLOW (7 SMOOTH STEPS)

Build a calm, single-column onboarding wizard with a sleek `2px` sage progress bar at the top, keyboard support, and zero clutter.

1. **Step 1 — The Childfree Gatekeeper & Feminist Pledge:**
   - Question: *"Where do you stand on having children?"*
   - Options:
     - `100% Childfree — I do not want children, ever.` (Proceeds)
     - `Unsure / Fence-sitter` (Shows warm, firm boundary screen explaining why Duet protects its community from fence-sitters—blocks progression)
     - `I want children someday` (Same polite boundary screen—blocks progression)
   - Once `100% Childfree` is chosen, reveal two crisp consent checkboxes:
     - **Childfree Boundary Pledge**
     - **Feminist, Consent & Queer-Inclusion Pledge**

2. **Step 2 — Passwordless Email OTP Verification (Zero Phone Numbers):**
   - Clean email input: *"We never ask for your phone number. Enter your email to receive a 6-digit verification code."*
   - **Send OTP** button → transitions smoothly to a **6-box auto-advancing OTP code input** (supports paste, backspace navigation, 60-second resend countdown, and "Change email" link).
   - Verifies OTP, signs into Firebase Auth, and checks Firestore:
     - Returning user with existing profile → takes them straight into the main app.
     - New user → continues to Step 3.

3. **Step 3 — Identity, Pronouns, Orientation & Relationship Style:**
   - First Name, Age (`18+` validated), Pronouns chips (+ custom), Gender Identity chips (+ custom & visibility toggle), Sexual Orientation chips (+ custom & visibility toggle), and Relationship Structure chips.

4. **Step 4 — Location, Vitals & Who You Want to Meet:**
   - City quick-select pills (`Bengaluru`, `Mumbai`, `Delhi NCR`, `Hyderabad`, `Pune`, `Chennai`, `Kolkata`, `Goa`) + custom city input.
   - Optional short line: Work / Creative Craft.
   - Discovery preferences: Genders you're interested in, Age Range slider/inputs, and optional *"Prioritize Queer Community"* toggle.

5. **Step 5 — Hinge-Style Photo Upload Studio (Firebase Storage):**
   - Clean 6-slot responsive grid (minimum 1 photo required to enter, up to 6 photos).
   - Client-side image compression/resize (Canvas API to max 1080px, JPEG 0.82 quality) before uploading to **Firebase Storage** (`users/{uid}/photos/{id}.jpg`) with real-time circular upload progress indicators.
   - Support **reordering photos** (move left/right or drag-and-drop), deleting photos (also deletes from Firebase Storage), and adding an optional **Hinge-style Photo Prompt / Caption** (e.g., *"A weekend I'd repeat forever"*, *"Me in my element"*, *"My pet / creative side"*).
   - Also allow an optional high-craft **Editorial Monogram Card** fallback if a privacy-conscious user wants a cover portrait without showing their face publicly on Discover.

6. **Step 6 — Thoughtful Prompts & Values (Hinge-Style):**
   - Choose **3 prompts** from curated feminist & childfree categories:
     - *Childfree Joy:* "My favorite thing about the childfree life is...", "A freedom I refuse to give up is...", "Our ideal quiet Sunday looks like..."
     - *Values & Emotional Depth:* "Green flags I look for in a partner...", "Equal partnership to me means...", "Unlearning patriarchy taught me..."
     - *Play & Curiosity:* "A rabbit hole I could talk about for hours...", "Next passport stamp on my mind...", "The way to win me over is..."
   - Select **3 to 8 Values & Lifestyle Chips** (e.g., `Intersectional feminist`, `Queer community`, `Therapy-positive`, `FIRE / Financial independence`, `Pet parent`, `Slow travel`, `Equal emotional labor`, `Creative pursuits`).
   - Optional Childfree Stance badge selector (including optional `Childfree & Sterilized / Vasectomy` badge).

7. **Step 7 — Consent Controls & Live Profile Preview:**
   - Let the user toggle their **Proactive Incognito Mode** and **Notes Before Match** preferences.
   - Show a miniature live preview of their Hinge-style profile card.
   - CTA: **"Publish Profile & Enter Duet"** → writes full document to Firestore and transitions into the Discover feed.

---

## 6. CORE APPLICATION VIEWS (HINGE-STYLE EXPERIENCE)

### View 1: Discover Feed (Hinge-Style Vertical Editorial Profile)
- Displays **one full vertical scrollable profile at a time** (no shallow rapid-fire Tinder swiping).
- **Interleaved Layout:**
  1. **Header Block:** Name, Age, Pronouns pill, Verified Childfree Pledge badge, City, Optional Sterilized/Stance pill.
  2. **Photo 1 (Hero):** Full-bleed rounded editorial frame (`aspect-[4/5]`) with optional photo prompt caption + a floating **Heart / Comment button** in the bottom-right corner of the photo.
  3. **Vitals Strip (Horizontal scrollable pill strip):** Gender, Orientation, Relationship Style, Work/Craft, Hometown.
  4. **Prompt 1 Card:** Serif quote typography (`Instrument Serif`, large & airy) + dedicated **Heart / Comment button** on the card.
  5. **Photo 2** + Heart/Comment button.
  6. **Values & Lifestyle Card:** Clean tactile chips highlighting shared values with the current user (e.g., subtle sage border on overlapping tags!).
  7. **Prompt 2 Card** + Heart/Comment button.
  8. **Photos 3–6 & Prompt 3** interleaved gracefully.
- **Element-Level Like & Note Modal (Signature Hinge Interaction):**
  - Clicking the Heart icon on **any specific photo or prompt** opens a sleek bottom sheet / modal showing a compact preview of *that exact photo or prompt*, an optional note input (*"Add a thoughtful comment..."*, respected if the target user allows notes before match), and a **"Send Like"** CTA.
- **Floating Bottom-Left Pass (`X`) Button** + **Undo Last Pass** button + **Safety Menu (`...`)** for instant Block or Report.
- **Top Filter Bar:** Filter by City, Gender Identity, Relationship Style, Age Range, and Queer Priority toggle.

### View 2: "Likes You" Tab (Intentional Queue)
- Shows everyone who has liked you or commented on one of your photos/prompts.
- Each card prominently displays **which specific photo or prompt they liked** and their attached **comment/note** right at the top.
- Two clear actions: **Dismiss (`X`)** or **Match & Start Chat (`Heart`)** — clicking Match instantly creates a `MatchThread` in Firestore, seeds their opening note into the chat, and opens the conversation.

### View 3: Connections & Real-Time Chat
- Desktop: Two-column split layout (Matches list on the left, live conversation on the right). Mobile: Clean list transitioning to full-screen chat.
- Inside every chat:
  - **Context Banner** at the top reminding both people which prompt/photo sparked the match.
  - Real-time Firestore messages (`onSnapshot`) with timestamps and subtle read/sent styling.
  - **In-Chat Safety Drawer:** Unmatch, Block, or Report (with childfree-specific and feminist safety reasons).

### View 4: Profile, Photo Studio & Safety Settings
- **Preview Mode vs. Edit Mode** tabs (exactly like Hinge: tap `Preview` to see your profile as others see it, tap `Edit` to modify photos, prompts, pronouns, orientation, values, and preferences).
- Re-usable **Firebase Storage Photo Manager** (add, compress, upload, reorder, caption, delete).
- **Safety & Privacy Controls** (Proactive Incognito Mode, Notes Consent toggle, Pause Account toggle, Sign Out).

---

## 7. INCLUSIVE SEED PROFILES FOR INSTANT PREVIEW

Include 6 tasteful, richly written, diverse demo profiles (used gracefully alongside real Firestore users when fewer than 3 real peers exist, clearly badged as `Sample Member` and interactive for likes/notes/chat so the app feels alive on first load):
- Diverse genders, pronouns, and sexualities: e.g., a queer non-binary product designer (`they/them`, Bengaluru), an intersectional feminist architect woman (`she/her`, Mumbai), a bisexual trans woman filmmaker (`she/her`, Pune), a feminist cis man climate-tech founder (`he/him`, vasectomy-verified, Delhi NCR), a pansexual woman psychologist (`she/they`, Hyderabad), and a queer ceramicist (`he/they`, Goa).
- Each demo profile should include curated placeholder editorial photography (using reliable Unsplash portrait/lifestyle URLs with graceful editorial monogram fallbacks if offline), 3 deeply written childfree/feminist prompts, and realistic lifestyle chips.

---

## 8. STRICT ENGINEERING & UX REQUIREMENTS

1. **Zero Native Browser Dialogs:** Never use `window.alert()`, `window.confirm()`, or `window.prompt()`. Build custom, accessible minimalist modals and toast notifications.
2. **Real Firebase Persistence + Graceful Fallback:** Wire all Auth, Firestore, and Storage calls cleanly through a dedicated `src/lib/firebase.ts` module reading from `import.meta.env.VITE_FIREBASE_*`. If environment variables are not yet populated, provide an inline non-intrusive setup banner + working local-state demo mode so the UI never white-screens.
3. **Production Email OTP Cloud Function Included:** Generate `functions/src/emailOtp.ts` showing the exact production Firebase Cloud Function (using Resend API + SHA-256 OTP hashing + Firestore TTL + `admin.auth().createCustomToken`) alongside clear setup instructions in `README.md`.
4. **Accessibility & Polish:** Keyboard-navigable OTP inputs, `aria-label` attributes on icon buttons, loading skeletons for photos and feeds, empty states with helpful CTAs, and clean responsive design across mobile (`375px`) and desktop (`1440px`).

Begin by outlining the folder structure, then generate the complete, working codebase including `src/lib/firebase.ts`, `src/lib/emailOtpService.ts`, `functions/src/emailOtp.ts`, `firestore.rules`, `storage.rules`, `.env.example`, and all React components with zero placeholders or `// TODO` stubs.