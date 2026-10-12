# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users
Small-scale farmers and agricultural workers monitoring real-time soil health, disease status, and receiving AI-driven crop advisory for vegetables (such as mustard greens, bell peppers, potatoes, and tomatoes).

## Product Purpose
Combines IoT sensor monitoring (EC, soil moisture, temperature, nitrogen estimation) and computer vision-based plant disease classification via an EfficientNet-B0 PyTorch model to give actionable, localized agricultural insights and expert chatbot recommendations.

## Positioning
Integrates live local IoT sensor telemetry with deep-learning plant disease diagnostics and a domain-specific LLM advisor in a unified mobile/web application designed for accessible field use.

## Operating Context
Agricultural fields, greenhouses, or home gardens where sensor data is continuously streamed from ESP32 microcontrollers to a FastAPI backend, inspected via mobile phones or browsers under varying outdoor lighting conditions.

## Capabilities and Constraints
- Real-time soil telemetry monitoring (EC, moisture, temperature, nitrogen estimation) with historical trend charts.
- Camera/library photo capture and CNN classification for 15 crop disease categories.
- Gemini-powered bilingual (Vietnamese) agronomy chatbot advisor context-aware of recent sensor readings.
- Constraint: Requires active backend connection and database/sensor availability.

## Brand Commitments
- Name: KLTN AI & IoT (Smart Agriculture System)
- Voice: Practical, simple, direct, empathetic to small-scale farmers.

## Evidence on Hand
- FastAPI backend codebase under `app/`.
- React Native Expo client codebase under `mobile-app/`.
- PyTorch model and knowledge base under `app/ml/` and `app/services/`.

## Product Principles
1. Instant legibility under field conditions: high contrast, clear status indicators, and glanceable metrics.
2. Zero ambiguity in diagnostics: direct severity levels and concrete actionable recommendations within 24 hours.
3. Native-first ergonomics: fluid touch targets, safe area handling, and native chart performance.

## Accessibility & Inclusion
Optimized for high readability outdoors with large typography scales, high color contrast status badges, and clear Vietnamese terminology tailored for agricultural users.
