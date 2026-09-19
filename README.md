# ENSv1 - Explore Network Simulator

A browser-based network simulation laboratory for designing, connecting, configuring, and testing virtual routers, switches, firewalls, and hosts.

## 🚀 GitHub Pages Deployment Guide

Jab aap is repository ko GitHub par push karte hain aur page open nahi hota (404 ya blank page), toh neeche diye gaye simple steps follow karein:

### 1. GitHub Pages Setting Enable Karein (Sabse Zaroori)
1. Apni GitHub repository me **Settings** tab par click karein.
2. Left sidebar me **Pages** par click karein.
3. **Build and deployment** section ke andar:
   - **Source**: Dropdown me **GitHub Actions** select karein.
   *(Agar `Deploy from a branch` select tha aur branch `main` thi, toh page blank ata tha kyunki TypeScript code directly browser me nahi chal sakta. `GitHub Actions` select karne se compiled bundle deploy hota hai).*

### 2. Workflow Permissions Check Karein
1. Repository **Settings** -> **Actions** -> **General** me jayein.
2. Sabse neeche **Workflow permissions** me **Read and write permissions** ko tick karein aur **Save** karein.

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
