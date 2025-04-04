import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function Callback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleCallback, error, loading } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    console.log("Auth code received:", code);
    
    if (code) {
      handleCallback(code).then(() => {
        navigate('/dashboard');
      });
    } else {
      console.error('No code found in URL');
      navigate('/');
    }
  }, [searchParams, handleCallback, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Logging you in...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Login Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return null;
} 