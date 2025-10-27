// TODO: Implement login page with form handling
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Header from '../components/common/Header';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to intended page after login
  const from = location.state?.from?.pathname || '/dashboard';

  // Client-side validation schema mirrors backend login schema
  const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  });

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields, isSubmitted },
    getValues,
  } = useForm({ resolver: zodResolver(loginSchema), mode: 'onChange' });

  // Reuse existing handler; react-hook-form will call this on submit
  const onSubmit = (data) => handleLogin(data);

  const getActiveErrors = () => {
    return Object.entries(errors)
      .filter(([fieldName]) => touchedFields[fieldName] || isSubmitted)
      .map(([fieldName, error]) => ({
        field: fieldName,
        message: error?.message,
      }));
  };

  const handleLogin = async (formData) => {
    try {
      setIsLoading(true);
      setError('');

      const result = await login({
        email: formData.email,
        password: formData.password,
      });

      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-indigo-600">SkillWise</h1>
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to continue your learning journey
            </p>
          </div>

          {isLoading ? (
            <LoadingSpinner message="Signing you in..." />
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...registerField('email')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  {...registerField('password')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign In
              </button>

              <div className="space-y-1">
                {getActiveErrors().map((errItem, idx) => (
                  <div key={idx} className="text-sm text-red-600">
                    {errItem.message}
                  </div>
                ))}
              </div>

              {error && (
                <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
                  <p>{error ? error : ''}</p>
                </div>
              )}
            </form>
          )}

          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign up here
              </Link>
            </p>

            <p className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </Link>
            </p>
          </div>

          <div className="w-full mt-12 text-center">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <blockquote className="text-lg font-medium text-gray-900 italic">
                "SkillWise transformed how I learn. The AI feedback is
                incredibly helpful!"
              </blockquote>
              <cite className="block mt-3 text-sm text-gray-600 not-italic">
                — Sarah K., Software Developer
              </cite>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
