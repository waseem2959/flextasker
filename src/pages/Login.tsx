
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Lock, User } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const success = await login({ email, password });
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 via-white to-primary-50 font-body">
        <div className="w-full max-w-md">
          <Card className="border-2 border-neutral-200 shadow-xl hover:shadow-2xl transition-shadow duration-300 rounded-xl overflow-hidden">
            <CardHeader className="space-y-1 bg-white">
              <CardTitle className="text-2xl font-bold text-center text-neutral-900 font-heading">Sign in to your account</CardTitle>
              <CardDescription className="text-center text-neutral-600 font-body">
                Enter your email and password to sign in
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-white">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-body">
                  {error}
                </div>
              )}
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-900 font-medium font-body">Email</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-lg font-body transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-neutral-900 font-medium font-body">Password</Label>
                    <Link to="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 h-4 w-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-lg font-body transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              {/* For demo purposes, add quick login buttons */}
              <div className="space-y-2">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-200"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-neutral-500 font-body">Demo Accounts</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="border-2 border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 transition-all duration-200"
                    onClick={() => {
                      setEmail('pawan@example.com');
                      setPassword('password');
                    }}
                  >
                    Client Demo
                  </Button>
                  <Button
                    variant="outline"
                    className="border-2 border-primary-200 text-primary-700 hover:bg-primary-50 hover:border-primary-300 transition-all duration-200"
                    onClick={() => {
                      setEmail('samudragupta@example.com');
                      setPassword('password');
                    }}
                  >
                    Worker Demo
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col bg-neutral-50">
              <div className="text-sm text-neutral-600 text-center mt-2 font-body">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Login;
