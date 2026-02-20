# Random Wheel Picker — Environment Setup Guide

## Prerequisites

| Requirement | Minimum Version | Recommended | Check |
|---|---|---|---|
| Node.js | 18.x | 20.x LTS | `node -v` |
| npm | 9.x | 10.x | `npm -v` |
| Git | Any | Latest | `git -v` |

Download Node.js from https://nodejs.org (LTS version includes npm).

---

## 1. Scaffold the Project

Open a terminal in `D:\Projects\RandomPicker` and run:

```bash
npm create vite@latest . -- --template react-ts
```

> The `.` tells Vite to scaffold into the current directory.
> When prompted "Current directory is not empty. Remove existing files and continue?" — type `y` (the only existing content is the `Plans/` folder which Vite will not touch).

This installs the following base stack:
- **React 18**
- **TypeScript 5**
- **Vite 5**

---

## 2. Install Base Dependencies

```bash
npm install
```

No additional packages are needed. The entire app is built with:
- React (included)
- TypeScript (included)
- Canvas API (browser built-in)
- CSS (no CSS framework)

---

## 3. Clean Up Vite Boilerplate

After scaffolding, remove files that won't be used:

```bash
# Delete boilerplate files
rm src/assets/react.svg
rm public/vite.svg
rm src/App.css          # We will replace with our own
```

Replace `src/App.tsx` content with an empty component — the boilerplate Vite App component will be replaced entirely during development.

---

## 4. Run the Development Server

```bash
npm run dev
```

The app will be available at:
- **Local**: http://localhost:5173
- **Network** (for testing on phone): http://[your-local-IP]:5173

To expose on your local network for mobile testing:

```bash
npm run dev -- --host
```

---

## 5. Project Scripts

| Script | Command | Purpose |
|---|---|---|
| Dev server | `npm run dev` | Hot-reload dev server at localhost:5173 |
| Build | `npm run build` | Compile + bundle to `dist/` |
| Preview build | `npm run preview` | Serve the production `dist/` locally |
| Type check | `npm run tsc` | Run TypeScript compiler without emitting |

---

## 6. Recommended IDE Setup

**VS Code** with these extensions:
- **ESLint** (`dbaeumer.vscode-eslint`) — lint errors in editor
- **Prettier** (`esbenp.prettier-vscode`) — auto-format on save
- **TypeScript Vue Plugin** is NOT needed (this is plain React, not Vue)

VS Code settings (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## 7. TypeScript Configuration

The Vite template generates `tsconfig.json` and `tsconfig.node.json`. Keep defaults — they are already configured for modern React + TypeScript.

Verify strict mode is on in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

---

## 8. Browser Compatibility Target

The app uses:
- `ResizeObserver` — Chrome 64+, Firefox 69+, Safari 13.1+
- `crypto.randomUUID()` — Chrome 92+, Firefox 95+, Safari 15.4+
- `Canvas 2D API` — all modern browsers
- `localStorage` — all modern browsers

No polyfills needed for any of these on modern devices.

---

## 9. Mobile Testing

Two options:

**Option A — Same Wi-Fi network:**
```bash
npm run dev -- --host
# Navigate to http://[your-local-IP]:5173 on your phone
```

**Option B — Browser DevTools:**
- Chrome: F12 → Toggle Device Toolbar (Ctrl+Shift+M)
- Resize to common mobile widths: 375px (iPhone SE), 390px (iPhone 14), 412px (Pixel 7)

---

## 10. Production Build

```bash
npm run build
```

Output in `dist/`. Files are:
- `dist/index.html`
- `dist/assets/index-[hash].js` (~150KB estimated, no external deps)
- `dist/assets/index-[hash].css`

To deploy: copy the `dist/` folder to any static hosting service (Netlify, Vercel, GitHub Pages, any web server).

---

## File Structure After Setup

```
RandomPicker/
├── Plans/                    ← Planning documents (not deployed)
├── dist/                     ← Production build output (gitignored)
├── node_modules/             ← Dependencies (gitignored)
├── public/
│   └── favicon.ico
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── App.css
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── color.ts
│   │   ├── wheel.ts
│   │   └── storage.ts
│   ├── hooks/
│   │   ├── useWheelConfig.ts
│   │   └── useSpinWheel.ts
│   └── components/
│       ├── Wheel/
│       ├── SpinButton/
│       ├── ConfigPanel/
│       ├── ItemRow/
│       └── WinnerModal/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```
