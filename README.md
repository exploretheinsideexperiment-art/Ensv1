# ENSv1 - Explore Network Simulator

A browser-based network simulation laboratory for designing, connecting, configuring, and testing virtual routers, switches, firewalls, and hosts.

## 🚀 GitHub Pages Deployment Guide

Jab aap is repository ko GitHub par push karte hain aur page open nahi hota (404 ya blank page), toh neeche diye gaye simple steps follow karein:

### 🎯 Method 1: Instant 10-Second Fix (Sabse Asan - Zero Setup)
Humne project me pehle se hi compiled **`docs/`** folder create kar diya hai:
1. GitHub repository me **Settings** ➔ **Pages** par jayein.
2. **Build and deployment**:
   - **Source**: `Deploy from a branch` hi rehne dein.
   - **Branch**: `main` (ya `master`) select karein.
   - **Folder**: Dropdown me **`/docs`** select karein (root ki jagah).
3. **Save** par click karein.
4. Bas 15 second me page live ho jayega bina kisi configuration ke!

---

### ⚙️ Method 2: GitHub Actions (Automated Deployment)
1. Repository **Settings** ➔ **Pages** me jayein.
2. **Source**: Dropdown me **`GitHub Actions`** select karein.
3. Repository **Settings** ➔ **Actions** ➔ **General** me jayein ➔ Neeche **Workflow permissions** me **"Read and write permissions"** select karke Save karein.
4. **Actions** tab me workflow automatically run hokar green ho jayega aur live URL mil jayega.

### 3. Alternative (Direct Terminal Deploy)
Agar aap local machine se direct deploy karna chahte hain bina GitHub Actions ke:
```bash
npm run deploy
```
Yeh command automatically project build karke `gh-pages` branch par push kar dega. Fir Settings -> Pages me jakar **Source** me **Deploy from a branch** aur branch **gh-pages** select kar lijiye.

### 3. Local Development & Build
- Development server run karne ke liye: `npm run dev`
- Production build generate karne ke liye: `npm run build`
- Linter check: `npm run lint`
