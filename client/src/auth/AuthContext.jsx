import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(() => {
    const params = new URLSearchParams({
      client_id: 'client',
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: 'http://localhost:5173/callback'
    });

    window.location.href = `http://localhost:3001/auth?${params.toString()}`;
  }, []);

  const handleCallback = useCallback(async (code) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('client_id', 'client');
      params.append('code', code);
      params.append('redirect_uri', 'http://localhost:5173/callback');

      const response = await fetch('http://localhost:3001/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to exchange code for token');
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('No access token received');
      }

      localStorage.setItem('access_token', data.access_token);
      setIsAuthenticated(true);
      await fetchUserProfile(data.access_token);
    } catch (err) {
      console.error('Callback error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (accessToken) => {
    try {
      const response = await fetch('http://localhost:3001/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userInfo = await response.json();
      setUser(userInfo);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.message);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    handleCallback,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 