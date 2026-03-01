# Bitespeed Identity Reconciliation Service

A web service that identifies and consolidates customer contact information across multiple purchases, even when different email addresses and phone numbers are used.

## USE OF AI: Claude Opus 4.6
## WORK SEGREGATION:
- **AI :** Refining the code, handling postgresql for deployment, assistive use in debugging, writing render config, suggesting ideal tsconfig, getting a required package.json and generating package-lock.json, improvising readme.

- **Self-Done :** Implementation logic, Initial Typescript code implementing my logic (index.ts, database.ts, Contact.ts, identify.ts), debugging self written code, debugging and safety-checking AI refined code, handling git commits and render deployment, writing sqlite script for local deployment.
  
## Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **ORM:** Sequelize
- **Database:** PostgreSQL (production) / SQLite (local development)

## Live Endpoint

**Base URL:** `https://bitespeed-submission.onrender.com/`

### `POST /identify`

Receives contact information and returns a consolidated contact profile.

**Request Body (JSON):**
```json
{
  "email": "example@email.com",
  "phoneNumber": "1234567890"
}
```

Both fields are optional, but at least one must be provided.

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["example@email.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode (uses SQLite)
npm run dev

# Build and run production
npm run build
npm start
```

## Environment Variables

| Variable       | Description                          | Default              |
|----------------|--------------------------------------|----------------------|
| `PORT`         | Server port                          | `3000`               |
| `DATABASE_URL` | PostgreSQL connection string         | Falls back to SQLite |

## How It Works

1. **New customer:** If no existing contact matches the email or phone, a new `primary` contact is created.
2. **Returning customer with new info:** If a match is found by email or phone but the request contains new information, a `secondary` contact is created and linked to the primary.
3. **Merging two primaries:** If a request links two previously independent primary contacts (e.g., one matched by email, another by phone), the older one stays `primary` and the newer one is converted to `secondary`.
