import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRoles } from '../hooks/useRoles';
import { Header } from '../components/Header';
import { Loader2 } from 'lucide-react';
import { signInWithGoogle, signInWithLinkedIn, supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRoles();
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !roleLoading) {
      redirectBasedOnRole(role);
    }
  }, [user, role, roleLoading, navigate]);

  const redirectBasedOnRole = (userRole: string | null) => {
    console.log("Redirecting based on role:", userRole);
    
    switch(userRole) {
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      case 'organizer':
        navigate('/admin', { replace: true });
        break;
      case 'moderator':
        navigate('/moderator', { replace: true });
        break;
      case 'attendee':
        navigate('/attendee/program', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  const validateForm = () => {
    if (!email || !password) {
      setError(t('auth.validation.fill_all_fields'));
      return false;
    }
    
    if (!email.includes('@')) {
      setError(t('auth.validation.valid_email'));
      return false;
    }
    
    if (password.length < 6) {
      setError(t('auth.validation.password_length'));
      return false;
    }
    
    if (isSignUp && password !== confirmPassword) {
      setError(t('auth.validation.passwords_match'));
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(username, email, password);
        // Show success message for sign up
        setError(t('auth.signup.check_email'));
      } else {
        await signIn(email, password);
        // Redirection will happen in the useEffect
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.error.occurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signInWithGoogle();
      // // Check if user profile exists, if not create one
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session:", session);
      if (session?.user) {
        const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userData?.id)
          .single();
        
        if (!profile) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
              {
                user_id: userData?.id,
                full_name: userData?.full_name,
                role: 'attendee',
                is_default: true
              }
            ]);

          if (profileError) {
            console.error('Error creating profile:', profileError);
            throw new Error('Failed to create user profile');
          }
        }
      }
      // Redirection will happen in the useEffect
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      setError(null);
      setIsLoading(true);
      await signInWithLinkedIn();
      // Redirection will happen in the useEffect
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with LinkedIn';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen from-indigo-100 via-purple-50 to-pink-100">
      {/* <Header /> */}
      <div className="flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="px-8 pt-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
              >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Bienvenue sur Lamody H&H
                </h1>
                <p className="text-gray-600 mt-2">
                  {isSignUp ? 'Create your account' : 'Sign in to your account'}
                </p>
              </motion.div>

              {/* Social Sign In Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50 transition-colors"
                >
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="w-5 h-5 mr-3"
                  />
                  Continue with Google
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-600 p-3 rounded-lg text-sm"
                  >
                    {error}
                  </motion.div>
                )}
                {isSignUp && (
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors ${
                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Processing...
                    </span>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      resetForm();
                    }}
                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {isSignUp
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Sign up"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-gray-50 px-6 py-4 text-center">
              <p className="text-sm text-gray-600">
                By continuing, you agree to our{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-800">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-indigo-600 hover:text-indigo-800">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};