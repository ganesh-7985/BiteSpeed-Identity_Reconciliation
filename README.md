# Bitespeed Identity Reconciliation Service

A backend service that identifies and tracks customers across multiple purchases using different contact information (email/phone). Built for the Bitespeed Backend Task.

## Hosted Endpoint

> **URL**: `https://YOUR-APP-NAME.onrender.com/identify`

_(Update this after deploying)_

---

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: PostgreSQL (Neon)

---

## Local Development Setup

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/bitespeed.git
cd bitespeed
npm install
```

### 2. Set Up Local Database

For local dev, you can use SQLite. Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### 3. Create `.env` File

```bash
DATABASE_URL="file:./dev.db"
PORT=3000
```

### 4. Run Migrations & Start

```bash
npx prisma migrate dev --name init
npm run dev
```

Server runs at `http://localhost:3000`

---

## Deployment to Render.com

### Step 1: Create PostgreSQL Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (free tier)
2. Create a new project
3. Copy the connection string:
   ```
   postgresql://username:password@host/database?sslmode=require
   ```

### Step 2: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/bitespeed.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Render

1. Go to [render.com](https://render.com) and sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `bitespeed-identity`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npm run render:migrate`
   - **Start Command**: `npm start`
5. Add Environment Variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string
6. Click **Create Web Service**

Deployment takes 2-3 minutes. Your endpoint will be:
```
https://bitespeed-identity.onrender.com/identify
```

---

## API Reference

### POST `/identify`

**Request Body** (JSON):
```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

At least one field must be provided.

**Response** (200 OK):
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["123456", "789012"],
    "secondaryContactIds": [2, 3]
  }
}
```

### Example Requests

```bash
# New customer
curl -X POST https://YOUR-APP.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'

# Link by phone (creates secondary)
curl -X POST https://YOUR-APP.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'

# Lookup by email only
curl -X POST https://YOUR-APP.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu"}'
```

---

## License

ISC
