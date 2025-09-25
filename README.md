MathLab Studio

Tagline: A unified workspace for precise calculation and effortless conversion.

Overview:
MathLab Studio is a lightweight, browser-based toolkit that fuses a scientific calculator with a unit & currency converter in a single, modern interface. Built with vanilla HTML/CSS/JS and an opinionated, modular architecture, it delivers production-grade UX—dark/light theming, power-user shortcuts, and accessible design tokens—without external dependencies.

Core value props

Do more in one place: Calculate, convert, and sanity-check results without app-switching.

Trust the math: A real parser (Shunting-Yard → RPN) enforces precedence, parentheses, and associativity.

Work at velocity: Keyboard-first interactions, discoverable shortcuts, and a clean, responsive UI.

Feature set

Scientific Calculator

Operators: + − × ÷ ^, parentheses, implicit multiplication.

Functions: sin, cos, tan (DEG/RAD), ln, log10, √, x², x³, 1/x, n!, %, constants π, e.

Engine: Shunting-Yard parser to Reverse Polish Notation with a robust RPN evaluator and friendly error handling.

Formatting: Smart precision and scientific notation when it aids readability.

Unit & Currency Converter

Physical units: length, mass, temperature (affine math), speed, area, volume, time, data, energy, pressure.

Currency: live exchange rates (ECB reference rates via the Frankfurter API) with localStorage caching and graceful fallback.

UX niceties: quick Swap button, readable output, and category-aware defaults.

UX & Accessibility

Tabs: Calculator ↔ Converter in one canvas.

Shortcuts: Ctrl/⌘+1/2 (switch tabs), ? (help overlay), T (theme), Enter (equals), Backspace (delete), Delete (AC).

Help overlay: Built-in cheat sheet; ESC to close.

Theming: Dark/Light toggle powered by design tokens; responsive layout; reduced-motion friendly.

Architecture highlights

Separation of concerns: Self-contained modules per tab (IIFE pattern), scoped selectors, minimal globals.

Deterministic conversions: Base-unit normalization for units; single-base normalization for FX.

No heavy stack required: Pure front-end assets—drop into any static host.

Who it’s for

Students, developers, and analysts who need a fast, trustworthy math workspace with zero setup and excellent ergonomics.
