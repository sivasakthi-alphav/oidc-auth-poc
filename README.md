# OpenID Connect Authentication System

This project implements a complete OpenID Connect authentication system with three separate servers:

1. **Auth Server** (Port 3001) - OpenID Connect Provider
2. **API Server** (Port 3002) - Protected Resource Server
3. **React Client** (Port 3000) - Client Application

## Project Structure
```
.
├── auth-server/    # OpenID Connect Provider
├── api-server/     # Protected API Server
└── client/         # React Client Application
```

## Prerequisites
- Node.js 16+
- MongoDB (optional)
- npm or yarn

## Setup & Running

1. Install dependencies for all services:
```bash
npm install
```

2. Start the Auth Server:
```bash
npm run start:auth
```

3. Start the API Server:
```bash
npm run start:api
```

4. Start the React Client:
```bash
npm run start:client
```

## Server URLs
- Auth Server: http://localhost:3001
- API Server: http://localhost:3002
- React Client: http://localhost:3000

## Features
- Complete OpenID Connect implementation
- Protected API endpoints
- Secure token handling
- User authentication flow
- JWT validation 