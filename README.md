# Bitespeed Identity Reconciliation Service

A backend service that identifies and tracks customers across multiple purchases using different contact information (email/phone). Built for the Bitespeed Backend Task.

## Hosted Endpoint

> **URL**: `https://bitespeed-identity-reconciliation-9n03.onrender.com/identify`

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
git clone https://github.com/ganesh-7985/BiteSpeed-Identity_Reconciliation.git
cd BiteSpeed-Identity_Reconciliation
npm install
```

### 2. Create `.env` File

```bash
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
PORT=3000
```

### 3. Sync Database & Start

```bash
npx prisma db push
npm run dev
```

Server runs at `http://localhost:3000`

---

## Deployment to Render.com

### Step 1: Create PostgreSQL Database (Neon)

1. Go to [neon.tech](https://neon.tech) and sign up (free tier)
2. Create a new project
3. Copy the connection string

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and sign up
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Configure:
   - **Name**: `bitespeed-identity-reconciliation`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add Environment Variable:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string
6. Click **Create Web Service**

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
curl -X POST https://bitespeed-identity-reconciliation-9n03.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'

# Link by phone (creates secondary)
curl -X POST https://bitespeed-identity-reconciliation-9n03.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'

# Lookup by email only
curl -X POST https://bitespeed-identity-reconciliation-9n03.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu"}'
```

---

## License

ISC
