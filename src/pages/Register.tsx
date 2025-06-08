import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from '@/hooks/use-auth';
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { UserRole } from "../types";

const Register = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const success = await register({
        firstName,
        lastName,
        email,
        role,
        password,
      });
      if (success) {
        navigate("/dashboard");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again."
      );
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
              <CardTitle className="text-2xl font-bold text-center text-neutral-900 font-heading">
                Create an account
              </CardTitle>
              <CardDescription className="text-center text-neutral-600 font-body">
                Enter your details to create your FlexTasker account
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
                  <Label htmlFor="name" className="text-neutral-900 font-medium font-body">First Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="First Name*"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-lg font-body transition-all duration-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-neutral-900 font-medium font-body">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last Name*"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-lg font-body transition-all duration-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-neutral-900 font-medium font-body">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email*"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-lg font-body transition-all duration-200"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-neutral-900 font-medium font-body">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-lg font-body transition-all duration-200"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-neutral-900 font-medium font-body">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-2 border-neutral-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-lg font-body transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-neutral-900 font-medium font-body">I want to join as</Label>
                  <RadioGroup
                    defaultValue="worker"
                    value={role}
                    onValueChange={(value) => setRole(value as UserRole)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="client" id="client" />
                      <Label htmlFor="client" className="text-neutral-600 font-body">Client (post tasks)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="worker" id="worker" />
                      <Label htmlFor="worker" className="text-neutral-600 font-body">Worker (find work)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 hover:shadow-lg" disabled={loading}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col bg-neutral-50">
              <div className="text-sm text-neutral-600 text-center mt-2 font-body">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Register;
