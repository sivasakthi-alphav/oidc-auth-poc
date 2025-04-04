import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Middleware to verify JWT tokens
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token with Auth Server's JWKS
    const response = await fetch('http://localhost:3001/.well-known/openid-configuration');
    const config = await response.json();
    const jwksResponse = await fetch(config.jwks_uri);
    const jwks = await jwksResponse.json();

    // For simplicity, we're using the first key. In production, match by kid
    const key = jwks.keys[0];
    const publicKey = key.n; // This is simplified. In production, properly construct the public key

    const decoded = jwt.verify(token, publicKey);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Protected route example
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({
    message: 'This is a protected resource',
    user: req.user
  });
});

// User profile endpoint
app.get('/api/profile', verifyToken, (req, res) => {
  res.json({
    id: req.user.sub,
    email: req.user.email,
    name: req.user.name,
    // Add any other user-specific data
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.listen(PORT, () => {
  console.log(`API Server is running at http://localhost:${PORT}`);
}); 