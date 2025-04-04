import express from 'express';
import { Provider } from 'oidc-provider';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory user store (replace with MongoDB in production)
const users = new Map();
users.set('test@example.com', {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
});

// OIDC Configuration
const configuration = {
  clients: [
    {
      client_id: 'client',
      client_secret: 'secret',
      grant_types: ['authorization_code', 'refresh_token'],
      redirect_uris: ['http://localhost:5173/callback'],
      post_logout_redirect_uris: ['http://localhost:5173'],
      response_types: ['code'],
      scope: 'openid email profile',
      token_endpoint_auth_method: 'none'
    }
  ],
  pkce: {
    required: () => false,
  },
  features: {
    devInteractions: { enabled: false },
    clientCredentials: { enabled: true },
    introspection: { enabled: true },
    revocation: { enabled: true }
  },
  cookies: {
    keys: ['some-secure-key'],
    long: { signed: true, secure: false },
    short: { signed: true, secure: false }
  },
  claims: {
    openid: ['sub'],
    email: ['email', 'email_verified'],
    profile: ['name']
  },
  ttl: {
    AccessToken: 1 * 60 * 60, // 1 hour in seconds
    AuthorizationCode: 10 * 60, // 10 minutes in seconds
    IdToken: 1 * 60 * 60, // 1 hour in seconds
    DeviceCode: 10 * 60, // 10 minutes in seconds
    RefreshToken: 1 * 24 * 60 * 60, // 1 day in seconds
  },
  findAccount: async (ctx, id) => {
    const account = users.get(id);
    if (!account) return undefined;
    
    return {
      accountId: id,
      async claims() {
        return {
          sub: id,
          email: account.email,
          email_verified: true,
          name: account.name,
        };
      },
    };
  },
  interactions: {
    url(ctx, interaction) {
      return `/interaction/${interaction.uid}`;
    }
  }
};

const oidc = new Provider(`http://localhost:${PORT}`, configuration);

// Enable debug logging
oidc.on('grant.success', (ctx) => {
  console.log('Grant Success:', ctx.oidc.entities);
});

oidc.on('grant.error', (ctx, err) => {
  console.error('Grant Error:', err);
});

oidc.on('server_error', (ctx, err) => {
  console.error('Server Error:', err);
});

// Custom interaction routes FIRST
app.get('/interaction/:uid', async (req, res) => {
  debugger;
  try {
    const { uid } = req.params;
    const details = await oidc.interactionDetails(req, res);
    console.log('Interaction details:', details);
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Login</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: #f5f5f5;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              width: 100%;
              max-width: 320px;
            }
            form {
              display: flex;
              flex-direction: column;
              gap: 1rem;
            }
            h2 {
              margin: 0 0 1.5rem;
              color: #333;
              text-align: center;
            }
            input {
              width: 100%;
              padding: 0.75rem;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 1rem;
              box-sizing: border-box;
            }
            button {
              width: 100%;
              padding: 0.75rem;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 1rem;
              cursor: pointer;
              transition: background-color 0.2s;
            }
            button:hover {
              background: #0056b3;
            }
            .error {
              color: #dc3545;
              margin-top: 0.5rem;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <form autocomplete="off" action="/interaction/${uid}/login" method="post">
              <h2>Sign In</h2>
              <input required type="email" name="email" placeholder="Email" value="test@example.com" />
              <input required type="password" name="password" placeholder="Password" value="password123" />
              <button type="submit">Sign In</button>
              <div id="error" class="error"></div>
            </form>
          </div>
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    console.error('Interaction page error:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/interaction/:uid/login', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    debugger
    const { uid } = req.params;
    const { email, password } = req.body;
    const details = await oidc.interactionDetails(req, res);
    console.log('Login attempt for:', email);
    
    const user = users.get(email);
    
    if (user && user.password === password) {
      const result = {
        login: {
          accountId: email,
          acr: 'urn:mace:incommon:iap:bronze',
          amr: ['pwd'],
          ts: Math.floor(Date.now() / 1000),
          remember: false
        },
        consent: {
          rejectedScopes: [],
          rejectedClaims: [],
          replace: true,
          grantedScopes: details.params.scope.split(' ')
        }
      };
      
      console.log('Login successful, finishing interaction with result:', result);
      return await oidc.interactionFinished(req, res, result);
    } else {
      console.log('Login failed: Invalid credentials');
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }
  } catch (err) {
    console.error('Login error:', err);
    if (err.status === 401) {
      res.status(401).json({ error: 'Invalid email or password' });
    } else {
      res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  }
});

// Mount OIDC provider routes LAST
app.use('/', oidc.callback());

// Start server
app.listen(PORT, () => {
  console.log(`Auth Server is running at http://localhost:${PORT}`);
});
