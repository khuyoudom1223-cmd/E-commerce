# SleekCart Production Deployment Guide

This guide details the step-by-step process of deploying the **SleekCart** backend to production using **Render**, **MongoDB Atlas**, and **Cloudflare**. It includes production configurations, security guidelines, and performance optimization techniques (such as preventing cold starts on free tiers).

---

## 📂 Project Structure Overview

The compiled backend uses a multi-layered, production-ready structure:
```text
E-commerce/
├── server/                     # Backend Source Code (TypeScript)
│   ├── config/                 # Configurations (e.g., db.config.ts)
│   ├── database/               # Mongoose Connection & Seed Scripts
│   ├── repositories/           # Data Access Layer (Mongoose Repositories)
│   ├── routes/                 # REST API Routers
│   ├── server.ts               # Express Server & Production Middlewares
│   └── db.ts                   # Types and Models Schema
├── dist-server/                # Compiled JavaScript Output (Production)
├── tsconfig.server.json        # Backend TypeScript Compiler Config
├── package.json                # Project Scripts & Dependencies
├── .env                        # Local Environment Variables (Git ignored)
└── .env.example                # Template for Production Environment Variables
```

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Push the Project to GitHub
1. Create a new repository on your GitHub account.
2. Initialize and push your project to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "chore: prepare production deployment setup"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step 2: Create a MongoDB Atlas Cluster
1. Sign in to your [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas).
2. Click **Create** to spin up a new Cluster:
   * **Cloud Provider:** AWS or Google Cloud.
   * **Tier:** Shared (M10/M0 Free Tier).
   * **Region:** Select a region close to your target audience or Render's region (e.g., `us-east-1` or `singapore`).
3. Under **Security > Database Access**:
   * Click **Add New Database User**.
   * Choose **Password Authentication**, configure a username and secure password, and select **Read and Write to Any Database** permissions.
4. Under **Security > Network Access**:
   * Click **Add IP Address**.
   * Add `0.0.0.0/0` (Allow Access from Anywhere) so Render can connect.
     * *Note: Render does not offer static IP addresses on the free tier. To limit access, you can upgrade Render to use a static IP proxy or stick to the secure password with `0.0.0.0/0`.*
5. Under **Deployment > Databases**:
   * Click **Connect** on your cluster.
   * Select **Drivers** (Node.js).
   * Copy the connection string. It will look like this:
     ```text
     mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/sleekcart?retryWrites=true&w=majority
     ```

### Step 3: Deploy the Backend to Render
1. Sign in to your [Render Dashboard](https://render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your repository.
4. Configure the Web Service settings:
   * **Name:** `sleekcart-backend` (or your preferred name)
   * **Language:** `Node`
   * **Region:** Choose a region close to your database cluster.
   * **Branch:** `main`
   * **Build Command:** `npm install && npm run build:backend`
   * **Start Command:** `npm run start`
   * **Instance Type:** `Free` (or higher)

### Step 4: Configure Production Environment Variables on Render
Inside your Web Service dashboard on Render, navigate to **Environment** and click **Add Environment Variable**:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables Express production optimizations |
| `PORT` | `5000` | Render will automatically assign a port, but defaults to this if not set |
| `MONGODB_URI` | `mongodb+srv://db_user:secure_pwd@cluster.mongodb.net/sleekcart` | MongoDB Atlas Connection String |
| `JWT_SECRET` | `your_ultra_secure_random_hash` | Secret key used to sign and verify JSON Web Tokens |
| `FRONTEND_URL` | `https://your-frontend-domain.pages.dev` | The Cloudflare Pages domain of your frontend (locks down CORS) |

*Note: Render automatically injects `RENDER_EXTERNAL_URL` (the public URL of your service). Our backend uses this to self-ping every 10 minutes, preventing the container from spinning down and avoiding cold start delays.*

---

## 🌐 Cloudflare DNS & Proxy Setup

Connect your custom domain (e.g., `api.yourdomain.com`) to point securely to Render through Cloudflare.

### 1. Configure Cloudflare DNS
1. In your Cloudflare dashboard, navigate to **DNS > Records**.
2. Click **Add Record**:
   * **Type:** `CNAME`
   * **Name:** `api` (creates sub-domain `api.yourdomain.com`)
   * **Target:** `sleekcart-backend.onrender.com` (Your Render Web Service URL)
   * **Proxy Status:** Proxied (Enabled proxy protection)

### 2. Configure Cloudflare Security & Optimization Settings
Navigate to the following tabs in your Cloudflare dashboard to optimize performance and security:
* **SSL/TLS > Overview:** Set mode to **Full** or **Full (strict)**.
* **SSL/TLS > Edge Certificates:** Enable **Always Use HTTPS** and **Automatic HTTPS Rewrites**.
* **Speed > Optimization:**
  * Enable **Brotli Compression** (highly efficient compression for API responses).
  * Under **Auto Minify**, check **JavaScript**, **CSS**, and **HTML**.
* **Caching > Configuration:**
  * Enable **Tiered Cache** to utilize Cloudflare's global network.

---

## 🔒 Production Best Practices Implemented

Our backend code has been optimized to implement strict industry security and performance standards:

1. **Helmet Security Headers:** Restricts script sources, prevents iframe clickjacking, disables MIME sniffing, and enforces strict HTTP Transport Security (HSTS).
2. **Rate Limiting:** Protects the endpoints from DDoS or brute-force attacks by limiting clients to 100 requests per 15 minutes.
3. **CORS Isolation:** Limits origin access strictly to your `FRONTEND_URL` in production (prevents third-party scripts from reading API responses).
4. **Environment-Aware Error Sanitization:** When `NODE_ENV=production`, stack traces are stripped, and sensitive error messages are replaced with generic messages like `Internal Server Error` to hide directory paths and database details.
5. **Database Resilience:** Mongoose options are set for production:
   * `autoIndex` is disabled (prevents indexing overhead on startup).
   * Connection pooling is capped at a max of 10 concurrent requests to optimize Atlas resource limits.
   * Auto-reconnect automatically recovers the connection if the server drops offline temporarily.
