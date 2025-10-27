// Signup page with client-side zod validation
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const SignupPage = () => {
  const registerSchema = z
    .object({
      firstName: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name too long'),
      lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name too long'),
      email: z.string().email('Invalid email format'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain uppercase, lowercase, and a number',
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields, isSubmitted },
    getValues,
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const getActiveErrors = () => {
    return Object.entries(errors)
      .filter(([fieldName]) => touchedFields[fieldName] || isSubmitted)
      .map(([fieldName, error]) => ({
        field: fieldName,
        message: error.message,
      }));
  };

  const onSubmit = async (data) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (result && result.success) {
        navigate('/dashboard');
      } else {
        setError(result?.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center">
            <Link to="/" className="inline-block">
              <h1 className="text-4xl font-bold text-indigo-600">SkillWise</h1>
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Create Your Account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Start your personalized learning journey today
            </p>
          </div>

          {isLoading || isSubmitting ? (
            <LoadingSpinner message="Creating your account..." />
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    {...registerField('firstName')}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    {...registerField('lastName')}
                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  {...registerField('confirmPassword')}
                  className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Account
              </button>

              <div className="space-y-1">
                {getActiveErrors().map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    {error.message}
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

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="w-full mt-12 text-center">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What you'll get:
              </h3>
              <ul className="space-y-2 text-left">
                <li className="text-sm text-gray-700">
                  ✅ Personalized learning paths
                </li>
                <li className="text-sm text-gray-700">
                  ✅ AI-powered feedback
                </li>
                <li className="text-sm text-gray-700">✅ Progress tracking</li>
                <li className="text-sm text-gray-700">
                  ✅ Peer learning community
                </li>
                <li className="text-sm text-gray-700">✅ Achievement system</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
