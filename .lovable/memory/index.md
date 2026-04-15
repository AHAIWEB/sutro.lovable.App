# Project Memory

## Core
- Sutra: Bengali web link directory. Users can browse and submit links.
- Tech Stack: Supabase (DB, Auth, RLS), TanStack Query, Framer Motion.
- UI Theme: "Ink & Paper" (cream bg, teal primary). Glass-morphism effects.
- Typography: Hind Siliguri & Noto Sans Bengali. **Use Bengali numerals (০-৯) for all numbers/counts.**
- Links: External links MUST open in a new tab (`target="_blank"`).
- Auth: RBAC via `user_roles`. Admin panel (`/admin`) requires 'admin' role (`ahai.info@gmail.com`).
- DB: countries, sub_categories, featured_posts, scraper_configs tables. Links have country_id and sub_category_id.

## Memories
- [Project Vision](mem://project/vision) — Sutra is a Bengali web link directory with public submission
- [Visual Direction](mem://style/visual-direction) — Ink & Paper theme, Bengali fonts, glass-morphism, Bengali numerals
- [Data Management](mem://tech/data-management) — Supabase, TanStack Query, recursive pagination, RLS
- [Role Management](mem://auth/role-management) — RBAC via user_roles table, admin-only access to /admin
- [Auth Configuration](mem://auth/configuration) — Email auto-confirm, password reset, specific admin email
- [Admin Panel](mem://features/admin-panel) — /admin route for managing links, categories, bulk imports, scraper, featured posts
- [Category System](mem://features/category-system) — Country-based + A-Z categories with sub-categories (print daily, e-paper, etc.)
- [Navigation Structure](mem://features/navigation-structure) — CountryDropdownNav with country flags and A-Z letter nav
- [Link Cards](mem://features/link-cards) — Display domain favicon automatically, sort by visit count
- [Link Behavior](mem://features/link-behavior) — All external links open in new tab
- [News Carousel](mem://features/news-carousel) — Auto-sliding news ticker in the app layout
- [Newspaper Directory](mem://content/newspaper-directory) — 7139 global newspaper links scraped, grouped A-Z
- [Scraper Feature](mem://features/scraper) — Edge function scrape-links for fetching links from external directories
- [Featured Posts](mem://features/featured-posts) — Featured slider on homepage with admin CRUD and auto-fetch capability
