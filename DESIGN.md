# Design System: KLTN AI & IoT (Smart Agriculture System)

## 1. Visual World & Direction
- **Archetype:** Tactical Agronomic Instrument (Hệ thống nông nghiệp thông minh ngoài thực địa).
- **Aesthetic Tenets:** High contrast, glanceable, outdoor-optimized legibility, zero decorative fluff, tactile native feedback.
- **Modes:** 
  - `Operate` on Dashboard & Diagnosis: direct data inspection, high-speed camera capture and inference.
  - `Read` on History: dense longitudinal telemetry inspection, smart non-overlapping time sampling.
  - `Advisory` on Chatbot: conversational domain-expert counseling contextualized by IoT sensors.

## 2. Color System & Contrast Calibration
### Light Mode (Field Daylight)
- **Background (`bg`):** `#F6F5EE` (Warm botanical ground, avoids screen glare in bright sunlight)
- **Surface (`surface`):** `#FFFFFF` (Card container)
- **Surface Secondary (`surfaceSecondary`):** `#F0EDE2` (Tonal containers, segmented pills)
- **Primary Brand (`primary`):** `#1B4332` (Deep Forest Green, WCAG AAA contrast against light grounds)
- **Primary Soft (`primarySoft`):** `#E2ECE5`
- **Accent (`accent`):** `#B87B22` (Amber earth, for telemetry & highlights)
- **Status Semantics:**
  - `success`: `#2E7D32` (Tối ưu)
  - `warning`: `#B25E09` (Cần theo dõi / Thiếu / Thừa)
  - `danger`: `#C62828` (Cần can thiệp / Nghiêm trọng)
  - `info`: `#1565A9` (Độ ẩm)

### Dark Mode (Night & Low Light)
- **Background (`bg`):** `#0F1512` (Botanical Charcoal, OLED-friendly)
- **Surface (`surface`):** `#17201B` (Slightly elevated dark forest surface)
- **Surface Secondary (`surfaceSecondary`):** `#212D26`
- **Primary Brand (`primary`):** `#52B788` (Vibrant leaf green for high readability on dark)
- **Primary Soft (`primarySoft`):** `#1A3326`
- **Accent (`accent`):** `#E6A84D`
- **Status Semantics:**
  - `success`: `#66BB6A`
  - `warning`: `#FFA726`
  - `danger`: `#EF5350`
  - `info`: `#42A5F5`

## 3. Typography Scale (Native-First)
- **Hero Metric:** 52pt, weight 800 (EC Value, glanceable from 1-2 meters).
- **Display / Page Title:** 24pt, weight 800.
- **Section Heading:** 14-15pt, weight 700-800.
- **Body & Prompts:** 13-14pt, weight 500-600.
- **Kicker / Eyebrow:** 10pt, weight 800, letter-spacing 1.2px (UPPERCASE).
- **Caption / Unit:** 11-12pt, weight 500-600.

## 4. Interactive Components & Signatures
- **Smart Label Sampling on Line Charts:**
  Dynamically calculates the screen width and downsamples X-axis time marks to at most 3-4 key timestamps, completely eliminating text overlap when visualizing 8, 15, 30, or 50 data points.
- **Interactive Data Inspector:**
  Users can tap any point on any sensor chart to inspect the exact timestamp, EC, Moisture, Temperature, and Nitrogen levels simultaneously with light haptic feedback.
- **Viewfinder Overlay for Plant Leaf Diagnosis:**
  Camera viewfinder brackets (`[ ]`) establish active visual inspection context for CNN classification.
- **Appearance & Settings Sheet:**
  Accessible from the Dashboard header action, allows toggling between System, Light, and Dark modes, inspecting standard agronomic ranges, and reviewing hardware telemetry status.
- **Lucide Universal Icon Set:**
  Replaced generic icons with consistent, tree-shakable Lucide icons (`sprout`, `activity`, `bot`, `scan`, `zap`, `droplets`, `thermometer`).
