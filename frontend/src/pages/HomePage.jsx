// TODO: Implement home/landing page
import React from 'react';
import Header from '../components/common/Header';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-6">Welcome to SkillWise</h1>
          <p className="text-xl mb-8 text-indigo-100">
            Your AI-powered learning companion for skill development
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-3 bg-white text-indigo-600 font-semibold rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
            <button className="px-8 py-3 bg-indigo-500 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-400 transition-colors border-2 border-white">
              Learn More
            </button>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* TODO: Add feature cards */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                AI-Powered Feedback
              </h3>
              <p className="text-gray-600">
                Get personalized feedback on your work
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Goal Tracking
              </h3>
              <p className="text-gray-600">Set and track your learning goals</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Peer Reviews
              </h3>
              <p className="text-gray-600">
                Learn from your peers through collaborative reviews
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
