---
name: Modern Obsidian Saju
colors:
  surface: '#121318'
  surface-dim: '#121318'
  surface-bright: '#38393f'
  surface-container-lowest: '#0d0e13'
  surface-container-low: '#1a1b21'
  surface-container: '#1e1f25'
  surface-container-high: '#292a2f'
  surface-container-highest: '#34343a'
  on-surface: '#e3e1e9'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e3e1e9'
  inverse-on-surface: '#2f3036'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#ffb4a3'
  on-secondary: '#630f00'
  secondary-container: '#b22301'
  on-secondary-container: '#ffc8bc'
  tertiary: '#ecc078'
  on-tertiary: '#432c00'
  tertiary-container: '#b28a48'
  on-tertiary-container: '#3a2600'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#ffdad2'
  secondary-fixed-dim: '#ffb4a3'
  on-secondary-fixed: '#3d0600'
  on-secondary-fixed-variant: '#8c1900'
  tertiary-fixed: '#ffdeac'
  tertiary-fixed-dim: '#ecc078'
  on-tertiary-fixed: '#281900'
  on-tertiary-fixed-variant: '#5f4103'
  background: '#121318'
  on-background: '#e3e1e9'
  surface-variant: '#34343a'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  price-display:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-tablet: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.875rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses modern Korean destiny analysis with editorial clarity, shifting the perception of traditional fortune-telling (*Saju*) from mystical superstition or impersonal algorithmic readout into an intimate, high-end lifestyle reading. The aesthetic is contemporary dark-mode editorial: quiet luxury, atmospheric depth, and empathetic human storytelling.

### Target Audience & Emotional Arc
- **Audience:** Discerning Millennials and Gen Z in Korea navigating career junctions, complex romantic reconciliation (*재회*), modern compatibility (*궁합*), and annual transitions (*신년운세*).
- **Tone & Mood:** Poetic yet rational, empathetic, confidential, and premium. It avoids stiff telemetry dashboards, cosmic tropes, or tacky talismans in favor of editorial restraint, thoughtful micro-copy, and tactile card architecture.
- **Visual Stance:** Dark obsidian surfaces (`#0C0D12`), frosted glass overlays, whisper-soft gradients of twilight violet and burnt vermilion, with crisp Korean sans-serif typography that honors structural balance.

## Colors

The palette balances deep midnight obsidian with ethereal accents drawn from dusk skies, seal stamps, and fine gold thread.

### Palette Architecture
- **Base Neutral (`#0C0D12`):** Obsidian void serving as the foundation canvas, preserving OLED contrast while reducing harsh black clipping.
- **Surface Elevation Containers:**
  - `surface-1` (`#14161F`): Primary card containers, sheets, and bottom navigation bar.
  - `surface-2` (`#1D202D`): Secondary interactive chips, search fields, and nested callouts.
  - `surface-border` (`rgba(255, 255, 255, 0.08)`): Subtle structural outlines for definition without visual noise.
- **Primary Violet (`#8B5CF6`):** Spiritual clarity and inner reflection. Used for focal highlights, dynamic radial aura glows, and primary action glows.
- **Secondary Vermilion (`#FF5A36`):** Inspired by Korean red seal ink (*인주*). Applied to purchase CTA buttons, "HOT / 재회 특화" badges, urgent insight flags, and pricing emphasis.
- **Tertiary Antique Gold (`#E5B972`):** Subtle astral thread accent. Reserved for premium verified reviews, celestial ratings, and 4-pillar destiny stem/branch tokens.
- **Text Neutrals:**
  - `text-primary` (`#F4F4F6`): 96% opacity white for headline clarity.
  - `text-secondary` (`#9BA1B5`): Muted lavender gray for contextual narrative body.
  - `text-tertiary` (`#5E6478`): Low-priority metadata, purchase timestamps, and disclaimers.

## Typography

Typography relies on geometric precision with humanist warmth, tailored for Hangul legibility using standard Pretendard / Plus Jakarta Sans fallbacks (`font-family: "Pretendard", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`).

### Editorial Rhythm
- **Headlines:** Clean, high-contrast, set with tight tracking (`-0.02em`) to deliver immediate emotional gravity (e.g., *"그 사람의 진심과 다시 닿을 시간"*).
- **Body:** Open line-heights (`1.6` to `1.7`) guarantee fluid reading across long-form analysis reports without cognitive fatigue.
- **Numbers & Prices:** Tabular numerals with bold weight ensure clear transactional transparency (e.g., `12,900원`, `19,800원`).
- **Korean Typographic Rules:** Apply `word-break: keep-all;` globally across titles and subtitles to prevent disjointed Hangul syllable wraps.

## Layout & Spacing

This design prioritizes mobile-first consumption with a maximum content canvas centered on wide displays.

### Layout Principles
- **Mobile Foundation:** 1-column fluid flow capped at `480px` max-width on mobile viewport view, expanding to a centered `640px` or `768px` readable column on tablet and desktop.
- **Margins & Safe Areas:** Consistent `20px` (`1.25rem`) lateral padding to maintain thumb-zone comfort and prevent card clipping. Bottom padding reserves `84px` across all scrollable views to clear the sticky navigation dock and CTA bars.
- **Vertical Spacing Hierarchy:**
  - Micro gaps between related elements (badge to title): `8px` (`space-sm`).
  - Card internal padding: `20px` (`space-lg`).
  - Section-to-section breaks: `32px` (`space-xl`).

## Elevation & Depth

Visual hierarchy uses frosted glass and subtle luminescence against obsidian planes, avoiding harsh drop shadows.

### Atmospheric Surface Rules
- **Backdrop Blur & Translucency:** Sticky bottom navigation and top app bars use `background: rgba(12, 13, 18, 0.82)` with `backdrop-filter: blur(16px)` and a top hairline border `rgba(255, 255, 255, 0.08)`.
- **Card Surfaces:** Reports live on `surface-1` (`#14161F`) elevated with a crisp 1px perimeter border (`rgba(255, 255, 255, 0.07)`).
- **Luminous Radiance (Aura Glows):** Flagship cards (e.g., *재회 사주*, *신년운세*) feature soft radial background fills:
  - Violet aura: `radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.15), transparent 70%)`.
  - Vermilion aura: `radial-gradient(ellipse at bottom left, rgba(255, 90, 54, 0.10), transparent 60%)`.
- **Active State Elevation:** Card press states compress subtly via `transform: scale(0.985)` with ambient inner highlight `inset 0 1px 0 rgba(255, 255, 255, 0.12)`.

## Shapes

A balanced `roundedness: 2` scale provides modern warmth while retaining editorial precision.

- **Base Radius (8px / `0.5rem`):** Applied to badges, category filter chips, input cells, and thumbnail previews.
- **Medium Radius (12px / `0.75rem`):** Buttons, interactive form dropdowns, and alert sheets.
- **Card Radius (16px / `1rem`):** Main destiny report cards, preview modules, and review quotes.
- **Pill Shapes (`9999px`):** Status pills (e.g., "1회성 평생 열람", "평균 평점 4.9") and floating quick-filter tags.

## Components

### 1. Destiny Report Content Cards
- **Structure:** `surface-1` container, 16px radius, subtle 1px border.
- **Header:** Category sub-label (`label-sm`, Violet or Vermilion) and reading duration/format badge (`1회 결제 / 즉시 확인`).
- **Body:** High-contrast title (`headline-md`), hook paragraph (`body-sm`, `text-secondary`), and bulleted deliverables (e.g., *“상대방 현재 심리 · 연락 오는 시기 · 주의 행동”*).
- **Footer:** Social proof rating (`★ 4.9 (1,248개 평가)` in gold), original crossed price, and final payment price in Vermilion (`14,900원`).

### 2. Category Filter Tabs
- **Options:** `전체`, `재회`, `연애`, `궁합`, `평생운`, `신년운세`.
- **Styling:** Horizontal scroll with hidden scrollbar. Inactive pills use `surface-2` with `text-secondary`. Active pill uses solid white or high-contrast vermilion tint with pure white text and a 1px matching border.

### 3. Action Buttons (CTA)
- **Primary Purchase CTA:** High-intensity vermilion gradient (`linear-gradient(135deg, #FF6B4A 0%, #FF451D 100%)`), white bold text, height 52px, 12px radius, with active scale damping.
- **Secondary Action:** Frosted obsidian button (`background: rgba(255, 255, 255, 0.06)`, border `rgba(255, 255, 255, 0.12)`, text `#F4F4F6`).

### 4. Social Proof & Verified Reviews
- **Review Cards:** Minimalist dark tile with verified buyer badge (`인증된 구매자`), 5 gold destiny stars, time passed, and candid emotional quote with highlighted keywords.

### 5. Sticky Bottom Navigation Bar
- **Dock Architecture:** 3-item navigation (`홈`, `검색`, `보관함 / 마이`). Height 64px + safe-area inset.
- **Active State:** Icon switches to filled state with violet or vermilion illumination dot underneath; inactive icons use 40% opacity monochrome white.

### 6. User Input Fields (Saju Information Entry)
- **Fields:** Birth date (양력/음력), exact birth time (시/분 or "모름" toggle), gender, and optional partner info.
- **Inputs:** Dark recessed wells (`#11131B`), 1px neutral border that glows violet on focus (`rgba(139, 92, 246, 0.6)`), avoiding browser-default outlines.