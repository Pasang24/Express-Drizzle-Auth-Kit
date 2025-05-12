# Express Drizzle Auth Kit

A Node.js backend authentication kit using Express, Drizzle ORM, PostgreSQL, and OAuth (Google & GitHub). This project provides secure authentication APIs with JWT-based session management and supports email/password login as well as social logins.

## Features

- Email/password authentication
- Google OAuth2 login
- GitHub OAuth2 login
- JWT session cookies (httpOnly, secure)
- PostgreSQL database via Drizzle ORM
- Centralized error handling
- Environment-based configuration

## Project Structure

```
.
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── db/
│   │   ├── index.ts
│   │   └── schema/
│   │       └── user.ts
│   ├── middlewares/
│   │   └── errorHandler.ts
│   ├── routes/
│   │   └── auth.route.ts
│   ├── types/
│   │   ├── github.ts
│   │   └── google.ts
│   └── utils/
│       ├── ApiError.ts
│       └── generateSession.ts
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── .env
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=4000
NODE_ENV=development
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
DATABASE_URL=postgresql://user:password@localhost:5432/your_db
```

## Installation

```sh
git clone https://github.com/Pasang24/Express-Drizzle-Auth-Kit.git
cd express-drizzle-auth-kit
npm install
```

## Scripts

- `npm run dev` — Start the server in development mode (with nodemon)
- `npm run build` — Compile TypeScript to JavaScript in the `dist` folder
- `npm start` — Run the compiled server from `dist/server.js`

## API Routes

### Base URL

```
http://localhost:4000/
```

### Auth Routes

All authentication routes are prefixed with `/auth`.

#### 1. Email/Password Login

**POST** `/auth/email`

- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  ```
- **Response:**  
  Returns user data (without password) and sets a `session` cookie.

#### 2. Google OAuth Login

**GET** `/auth/google`

- Redirects user to Google OAuth consent screen.

**GET** `/auth/google/callback`

- Handles Google OAuth callback.
- On success, sets a `session` cookie and redirects to `FRONTEND_URL`.

#### 3. GitHub OAuth Login

**GET** `/auth/github`

- Redirects user to GitHub OAuth consent screen.

**GET** `/auth/github/callback`

- Handles GitHub OAuth callback.
- On success, sets a `session` cookie and redirects to `FRONTEND_URL`.

### Example: Email Login

```sh
curl -X POST http://localhost:4000/auth/email \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}' \
  -c cookie.txt
```

## Database

- Uses PostgreSQL.
- User schema defined in [`src/db/schema/user.ts`](src/db/schema/user.ts).
- Migrations managed via Drizzle Kit.

## Error Handling

All errors are returned in the following format:

```json
{
  "success": false,
  "message": "Error message"
}
```

## Notes

- Make sure to set correct OAuth credentials in your `.env`.
- The `session` cookie is httpOnly and secure in production.
- Update `FRONTEND_URL` and `BACKEND_URL` as per your deployment.

---

**Author:** Pasang Lama

---
