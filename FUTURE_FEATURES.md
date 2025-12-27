# Photobooth App - Future Features Roadmap

> Based on business requirements gathered on December 2024

---

## Priority Legend
- **P0** - Critical / High Revenue Impact
- **P1** - Important / Competitive Advantage
- **P2** - Nice to Have / Future Growth
- **P3** - Long-term Vision

---

## P0 - Critical Features

### 1. Photo Crop/Adjust in Review
**Problem:** #1 guest complaint - can't fit their image exactly how they want in the final output

**Features:**
- Pinch-to-zoom and drag-to-position each photo in review screen
- Crop preview showing how photo will appear in frame placeholder
- Reset to original option
- Aspect ratio lock matching placeholder dimensions

**Business Impact:** Directly addresses top guest friction point

---

### 2. Automatic Printing (Unattended Mode)
**Problem:** Unattended booths need hands-free printing

**Features:**
- Auto-print toggle in event settings
- Print immediately after composite is saved
- Print queue management (handle back-to-back sessions)
- Print status indicator on screen
- Fallback to digital-only if printer errors
- Print count tracking per event (for contracted hour limits)

**Business Impact:** Enables true self-service kiosk operation

---

### 3. Operator Dashboard / Remote Monitoring
**Problem:** Need visibility into unattended booth status

**Features:**
- Real-time session count and status
- Printer status (online/offline/paper low/ink low)
- Error alerts (camera fail, printer jam, storage full)
- Remote event activation/deactivation
- Session history with timestamps
- Push notifications for critical issues

**Business Impact:** Reduces on-site staffing needs, faster issue response

---

## P1 - Competitive Advantage Features

### 4. Interactive Guest Experience
**Problem:** Wishlist item - more engaging booth experience

**Features:**
- **Animated countdown** with sound effects and visual flair
- **Pose prompts** - Show guests fun pose suggestions between shots
- **Voice guidance** - Audio instructions like for example ("Strike a pose!", "3, 2, 1, Smile!")
- **Live filters preview** - See filters before capture (B&W, vintage, etc.)
- **Celebration animations** - Confetti/effects after final photo
- **Touch-to-start** attract screen with event branding
- **Idle mode** screensaver with event slideshow

**Business Impact:** Differentiator for premium events, better guest engagement

---

### 5. AI-Powered Features
**Problem:** Competitor feature gap

**Features:**
- **AI Background Removal** - Replace backgrounds with custom scenes
- **AI Face Enhancement** - Subtle skin smoothing, red-eye removal
- **AI Filters** - Artistic style transfers (cartoon, painting, sketch)
- **AI Props** - Virtual hats, glasses, accessories without physical props
- **Smart Crop** - Auto-detect faces and optimize framing
- **AI Photo Rating** - Flag blurry/eyes-closed photos for retake suggestion

**Business Impact:** Premium upsell opportunity, modern competitive edge

---

### 6. Gallery Per Event
**Problem:** Clients want to view/share all event photos

**Features:**
- Public or password-protected gallery page per event
- Grid view of all session composites
- Individual photo download from gallery
- Bulk download option (for event host)
- Social sharing from gallery
- QR code linking to gallery (for display at event)
- Optional: Guest can claim their photos by session code
- Time-limited access option (auto-expire after X days)

**Business Impact:** Added value for clients, extended brand exposure

---

### 7. Guest Help / FAQ Overlay
**Problem:** Operators struggle with repetitive guest questions

**Features:**
- Help button accessible throughout flow
- Animated tutorial on first visit
- FAQ modal with common questions:
  - "How do I get my photos?"
  - "Can I retake?"
  - "How do I print?"
  - "Where do I enter the code?"
- Multi-language support
- Customizable FAQ per event

**Business Impact:** Reduces operator interruptions, better guest autonomy

---

## P2 - Nice to Have Features

### 8. Print Time Tracking / Contract Hours
**Problem:** Managing print entitlements within contracted hours

**Features:**
- Event start/end time configuration
- "Print window" settings (e.g., first 2 hours only)
- Visual indicator when print window expires
- Auto-switch to digital-only after contracted hours
- Print count limits per session or per event
- Report: prints used vs. contracted

**Business Impact:** Enforces contract terms automatically

---

### 9. Guest Data Capture
**Problem:** Sometimes clients request guest contact info

**Features:**
- Optional email capture before/after session
- Optional phone number capture
- SMS delivery option (via Twilio/similar)
- Guest consent checkbox (GDPR/privacy compliance)
- Export guest list per event (CSV)
- Integration-ready for email marketing tools

**Business Impact:** Added value for marketing-focused clients

---

### 10. Advanced Analytics Dashboard
**Problem:** Need business insights across events

**Features:**
- Sessions per hour/day/event trends
- Peak usage times
- Popular frame/sticker choices
- Print vs. digital-only ratio
- Average session duration
- Guest return rate (same device)
- Revenue tracking (if pricing integrated)
- Export reports (PDF/CSV)

**Business Impact:** Data-driven pricing and operations decisions

---

### 11. Multi-Language Support
**Problem:** Diverse guest populations at events

**Features:**
- Language selector on landing page
- Translated UI strings (English, Spanish, Filipino, etc.)
- Per-event default language setting
- Auto-detect browser language

**Business Impact:** Better guest experience for international/diverse events

---

### 12. GIF/Boomerang Mode
**Problem:** Static photos feel dated to younger guests

**Features:**
- Burst capture mode (4-8 rapid frames)
- Auto-generate GIF or boomerang
- Preview animation before saving
- Download as GIF or MP4
- Share animated version to social

**Business Impact:** Appeals to younger demographics, social media friendly

---

### 13. Video Message Mode
**Problem:** Expand beyond photos for special events

**Features:**
- Record short video messages (10-30 seconds)
- Countdown before recording
- Playback and re-record option
- Add event frame/branding overlay
- Compile all videos into event montage
- QR code to video

**Business Impact:** Premium upsell for weddings/special events

---

## P3 - Long-term Vision

### 14. White-Label Platform
**Problem:** Future licensing opportunity

**Features:**
- Custom branding (logo, colors, fonts)
- Custom domain support
- Reseller dashboard
- Per-operator billing/subscription
- Feature toggles per license tier
- Operator onboarding flow

**Business Impact:** Recurring revenue stream from other operators

---

### 15. Hardware Integrations
**Problem:** Professional booth setups need deeper integration

**Features:**
- **DSLR Camera Support** - Tethered shooting via USB
- **Dedicated Printer Integration** - Direct print API (DNP, HiTi, Mitsubishi)
- **External Flash Trigger** - Sync with studio lighting
- **Coin/Card Payment** - Accept payment per session
- **Kiosk Mode** - Lock device to app only
- **Barcode Scanner** - Scan tickets/wristbands for access

**Business Impact:** Premium/enterprise booth configurations

---

### 16. Social Media Direct Posting
**Problem:** Guests want instant social sharing

**Features:**
- Post directly to Instagram Stories
- Share to Facebook
- TikTok integration
- Event hashtag auto-insertion
- Social wall display (show posts at event)
- Branded watermark on shared images

**Business Impact:** Viral marketing for events and your business

---

### 17. Template Marketplace
**Problem:** Clients want unique designs without custom work

**Features:**
- Pre-designed frame templates by event type
- Seasonal/holiday templates
- Upload and sell custom templates
- One-click template application
- Template preview with sample photos

**Business Impact:** Reduced design time, potential revenue from templates

---

### 18. Offline Mode
**Problem:** Venue WiFi can be unreliable

**Features:**
- Full capture flow works offline
- Local photo storage queue
- Auto-sync when connection restored
- Offline indicator in UI
- Local print capability

**Business Impact:** Reliability in poor connectivity venues

---

### 19. Green Screen / Virtual Backgrounds
**Problem:** Physical backdrops are limiting and bulky

**Features:**
- Real-time green screen removal
- Library of virtual backgrounds
- Custom background upload per event
- Background blur option
- AI-powered background swap (no green screen needed)

**Business Impact:** Reduced equipment needs, unlimited backdrop options

---

### 20. Event Booking Integration
**Problem:** Streamline client onboarding

**Features:**
- Client self-service event setup portal
- Contract/quote generation
- Deposit payment processing
- Calendar integration
- Automated event reminders
- Post-event survey and review request

**Business Impact:** Reduced admin work, professional client experience

---

## Implementation Phases

### Phase 1: Core Guest Experience (Next 1-2 weeks focus)
1. Photo Crop/Adjust in Review (P0)
2. Interactive Guest Experience basics (P1)
3. Guest Help/FAQ Overlay (P1)

### Phase 2: Operations & Automation
1. Automatic Printing (P0)
2. Operator Dashboard (P0)
3. Print Time Tracking (P2)

### Phase 3: Engagement & Growth
1. Gallery Per Event (P1)
2. AI Features - start with Smart Crop (P1)
3. GIF/Boomerang Mode (P2)

### Phase 4: Scale & Monetize
1. Advanced Analytics (P2)
2. Guest Data Capture (P2)
3. White-Label foundations (P3)

---

## Notes

- Priorities may shift based on client feedback and market demands
- AI features require API cost consideration (OpenAI, Replicate, etc.)
- Hardware integrations depend on specific equipment availability
- All features should maintain mobile-first, touch-friendly design

---

*Last updated: December 2024*
