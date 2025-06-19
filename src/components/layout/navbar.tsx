import { Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-20">
          {/* Left Section: Logo and Main Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo - Clean text-based design with interactive elements */}
            <Link to="/" className="flex items-center group">
              <div className="flex items-baseline">
                <span className="text-3xl font-black tracking-tight">
                  {/* FLEX with custom styling and interactive animation */}
                  <span className="text-blue-600 inline-flex">
                    <span className="transform transition-all duration-300 hover:scale-y-110 inline-block origin-bottom">F</span>
                    <span className="transform transition-all duration-300 hover:scale-y-110 inline-block origin-bottom delay-75">L</span>
                    <span className="transform transition-all duration-300 hover:scale-y-110 inline-block origin-bottom delay-100">E</span>
                    <span className="transform transition-all duration-300 hover:scale-y-110 inline-block origin-bottom delay-150">X</span>
                  </span>
                  {/* TASKER with standard styling */}
                  <span className="text-gray-900 ml-0.5">TASKER</span>
                </span>
                {/* Small animated indicator dot - adds personality and energy */}
                <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex lg:items-center lg:space-x-6">
              {/* Post Task as a prominent button matching Join FlexTasker style */}
              <button
                onClick={() => navigate('/post-task')}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Post Task
              </button>
              <Link
                to="/find-tasks"
                className="text-base font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600"
              >
                Browse Task
              </Link>
              <Link
                to="/how-it-works"
                className="text-base font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600"
              >
                How It Works
              </Link>
            </div>
          </div>

          {/* Right Section: Auth Buttons */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-base font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2.5 text-base font-medium text-white bg-blue-600 rounded-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Join FlexTasker
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={toggleMenu}
            className="inline-flex items-center justify-center p-2 text-gray-700 transition-colors duration-200 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="py-4 border-t border-gray-200 lg:hidden">
            <div className="space-y-3">
              {/* Post Task button maintains same style on mobile */}
              <button
                onClick={() => {
                  navigate('/post-task');
                  setIsMenuOpen(false);
                }}
                className="block w-full px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg transition-all duration-200 hover:bg-blue-700 text-center"
              >
                Post Task
              </button>
              <Link
                to="/find-tasks"
                className="block px-4 py-2 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-blue-600 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Task
              </Link>
              <Link
                to="/how-it-works"
                className="block px-4 py-2 text-base font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-blue-600 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </Link>
              
              {/* Mobile Auth Buttons */}
              <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => {
                    navigate('/login');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-base font-medium text-gray-700 text-center transition-colors duration-200 hover:text-blue-600"
                >
                  Log in
                </button>
                <button
                  onClick={() => {
                    navigate('/register');
                    setIsMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2.5 text-base font-medium text-white bg-blue-600 rounded-lg text-center transition-all duration-200 hover:bg-blue-700"
                >
                  Join FlexTasker
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};