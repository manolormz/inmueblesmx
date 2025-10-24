# Kentra

Environment setup:

- Use a local .env.local file for secrets and environment overrides. Do not commit .env to version control.
- Public keys should live in .env.example only. Example:
  - VITE_BUILDER_PUBLIC_API_KEY=REEMPLAZAR

Development:

- The app is wrapped by LayoutShell (header + footer). Pages should not render their own Header or Footer to avoid duplicates.
- Kentra palette is enforced via CSS variables and Tailwind tokens (primary, secondary). Avoid hard-coded blues.
