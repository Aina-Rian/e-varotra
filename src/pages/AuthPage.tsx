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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-gray-900 dark:via-black dark:to-gray-900">
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="px-6 sm:px-8 pt-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
              >
                <div className="flex justify-center mb-4">
                  <img
                    src="/LLogo_light.png"
                    alt="Lamody Logo"
                    className="h-16 w-auto dark:hidden"
                  />
                  <img
                    src="/LLogo_dark.png"
                    alt="Lamody Logo"
                    className="h-16 w-auto hidden dark:block"
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  Bienvenue sur Lamody H&H
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
                  {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre compte'}
                </p>
              </motion.div>

              {/* Social Sign In Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-200 font-medium"
                >
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="w-5 h-5 mr-3"
                  />
                  Continuer avec Google
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-black text-gray-500 dark:text-gray-400">Ou continuer avec</span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm border border-red-200 dark:border-red-800"
                  >
                    {error}
                  </motion.div>
                )}
                {isSignUp && (
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom d'utilisateur
                    </label>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="Entrez votre nom d'utilisateur"
                      required
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Entrez votre email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Entrez votre mot de passe"
                    required
                  />
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirmer le mot de passe
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                      placeholder="Confirmez votre mot de passe"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full bg-blue-600 dark:bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-medium shadow-lg hover:shadow-xl ${
                    isLoading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                      Traitement...
                    </span>
                  ) : (
                    isSignUp ? 'Créer un compte' : 'Se connecter'
                  )}
                </button>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      resetForm();
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
                  >
                    {isSignUp
                      ? 'Vous avez déjà un compte ? Se connecter'
                      : "Vous n'avez pas de compte ? S'inscrire"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 text-center border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                En continuant, vous acceptez nos{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                  Conditions d'utilisation
                </a>{' '}
                et notre{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                  Politique de confidentialité
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};