# ENSv1 - Explore Network Simulator

A browser-based network simulation laboratory for designing, connecting, configuring, and testing virtual routers, switches, firewalls, and hosts.

## 🚀 GitHub Pages Deployment Guide

Jab aap is repository ko GitHub par push karte hain aur page open nahi hota (404 ya blank page), toh neeche diye gaye simple steps follow karein:

### 1. GitHub Pages Setting Enable Karein
1. Apni repository me **Settings** tab par jayein.
2. Left sidebar me **Pages** par click karein.
3. **Build and deployment** section ke andar:
   - **Source**: Select karein **GitHub Actions** (Agar `Deploy from a branch` selected hai toh use badal kar `GitHub Actions` karein).

### 2. Workflow Trigger Check Karein
- Jaise hi aap `main` ya `master` branch par code push karenge, **Actions** tab me `Deploy to GitHub Pages` workflow automatically run hoga.
- Jab build complete ho jayega (green checkmark), aapka live page link wahi dikhayi dega:
  `https://<username>.github.io/<repository-name>/`

### 3. Local Development & Build
- Development server run karne ke liye: `npm run dev`
- Production build generate karne ke liye: `npm run build`
- Linter check: `npm run lint`
