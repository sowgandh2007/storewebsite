---
name: website-generator
description: A static website builder using a high-fidelity WebGL and Bento Grid Tailwind CSS template. Use this skill when asked to create a new website or bootstrap a landing page/catalog storefront.
---

# Static Website Generator Skill

Use this skill when the user requests to create or bootstrap a new website.

## Template Source Location
The master website template files are stored at:
`c:\Users\avadh\OneDrive\Documents\stockinventory\website-template`

## Template Structure
* **`index.html`**: Master HTML5 wireframe with SEO tags, responsive layout grids, filtering toolbars, dialog drawer lists, and scripts loader.
* **`package.json`**: NPM configurations for building and watching Tailwind CSS compilations.
* **`tailwind.config.js`**: Purge boundaries and color overrides.
* **`css/style.css`**: Animation keyframes, custom styling hooks, and scroll-locks.
* **`css/tailwind-input.css`**: Tailwind base directives.
* **`js/lightfall.js`**: WebGL background canvas animation.
* **`js/customer.js`**: Core state adjustments, cart listings, and WhatsApp booking.
* **`js/database.js`**: Supabase client and seed database layers.

## Bootstrapping a New Website
To copy and initialize a new website template:
1. Copy all contents of `c:\Users\avadh\OneDrive\Documents\stockinventory\website-template` to your target directory.
2. In `index.html`, replace all instances of `{{BRAND_NAME}}`, `{{PHONE_NUMBER}}`, and default SEO titles with your actual values.
3. In `js/database.js`, replace the Supabase credentials or update the fallback default products array.
4. Run `npm install` inside the target directory to install Tailwind.
5. Compile the purged Tailwind CSS with `npm run build` or `npx tailwindcss -i ./css/tailwind-input.css -o ./css/tailwind.css --minify`.
