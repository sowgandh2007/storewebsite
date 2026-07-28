# Premium WebGL & Bento Grid Website Template

This is a premium, high-performance static website template designed for showcase catalogs, bento grid showcases, and WhatsApp-based order reservation systems. It features a modern dark glassmorphic design system and WebGL background particles.

## Features
1. **WebGL Background**: Native high-performance falling light matrix particles (`js/lightfall.js`) powered by the lightweight `ogl` WebGL engine.
2. **Bento Grid Layout**: Modern, responsive CSS grid layout that scales beautifully from mobile viewports up to large desktop screens.
3. **Tailwind CSS CLI Compilation**: Clean setup to compile, purge, and minify Tailwind utility classes down to ~19 KB.
4. **State Management**: Ready-to-use client-side cart drawer, product filtering, dynamic search query tracking, and quantity adjustment.
5. **WhatsApp Checkout Integration**: Automatically formats selected items, quantities, and prices into a formatted WhatsApp booking request message.
6. **SEO & SSR Optimized**: Pre-rendered default grids with `<noscript>` animation and layout overrides for search crawler compatibility.

## Project Structure
```text
website-template/
├── css/
│   ├── style.css           # Bespoke animations, keyframes, scrollbars, and card styles
│   └── tailwind-input.css  # Tailwind import directives
├── js/
│   ├── database.js         # Supabase connection client and data loader mocks
│   ├── customer.js         # Cart actions, filter states, and catalog grid hydration
│   └── lightfall.js        # WebGL OGL particle background animation
├── index.html              # Main HTML5 entry point with pre-rendered placeholders
├── tailwind.config.js      # Tailwind JIT purge and custom brand themes configuration
└── package.json            # Tailwind CLI compilation dependencies
```

## Setup & Development

### 1. Install Tailwind CSS Dependencies
Run the following command in the template folder to install the local compiler:
```bash
npm install
```

### 2. Compile and Minify Stylesheet
Use the Tailwind compiler to rebuild the minified utility styles:
```bash
npm run build
```

Or run the watcher to automatically rebuild styles during development:
```bash
npm run dev
```

### 3. Customize Placeholders
Search the codebase for these placeholder tags to customize the branding:
* `{{BRAND_NAME}}`: Your Store/Mart/App name.
* `{{PHONE_NUMBER}}`: Contact telephone/WhatsApp number.
* `{{PRODUCT_LIST}}`: Seed default products for initial SSR paint.
