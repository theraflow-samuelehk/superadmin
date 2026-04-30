# AromaFit · HUSH — Landing

Landing page for **AromaFit HUSH**, a capsule-based aromatherapy diffuser.
Built for the US market. Wellness positioning, not medical claims.

Stack: **Vite + React + Tailwind + React Router**.

---

## 🚀 Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## 🏗️ Build

```bash
npm run build
npm run preview
```

The static site is generated in `dist/`.

---

## 📸 Product images

Save your 7 product photos in `public/images/` with these exact filenames:

| Filename                | What it is                                        |
| ----------------------- | ------------------------------------------------- |
| `hero-diffuser.jpg`     | Single diffuser releasing aromatic vapor          |
| `family-shot.jpg`       | Full family / bundle shot                         |
| `discovery-pack.jpg`    | HUSH Discovery Pack (3 capsules in box)           |
| `capsule-insert.jpg`    | Hand inserting a capsule into the diffuser        |
| `packaging-trio.jpg`    | 3 packaging boxes (Mint / Citrus / Spice)         |
| `lifestyle-sofa.jpg`    | Woman relaxing on sofa with diffuser nearby      |
| `lifestyle-bedside.jpg` | Diffuser on a bedside table                       |

While these are missing, the page renders graceful placeholders showing
where each image goes. Edit `src/images.js` if you want to use different
filenames.

---

## 🗺️ Pages

- `/` → Home (hero, story, how-it-works, scents, science, reviews, pricing, FAQ)
- `/hush` → Product detail (variants, bundles, gallery, accordions)

---

## ⚖️ Compliance note

All copy is written for the **wellness** category, not as medical or
weight-loss claims. The brand voice references aromatic traditions and
personal rituals. Customer testimonials may include personal experiences.
Avoid editing copy to make direct medical or weight-loss claims — the FTC
takes a strong line on these in the appetite/supplement space.

---

## 🚢 Deploy on Hostinger

```bash
npm run build
rsync -avz --delete dist/ hostinger-thomas:/home/u749757264/domains/<dominio>/public_html/
```

For SPA routing to work on Hostinger Apache, add an `.htaccess` rewrite
inside `dist/` before uploading.
