import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../components/ui/select';
import { Lock, Mail, User, CheckCircle, XCircle} from 'lucide-react';
import { toast } from 'sonner';
import BackgroundCircles from '../components/ui/BackgroundCircles';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [campaign, setCampaign] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // validation helpers
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{}|;':",.<>/?`~]/.test(password);
  const noNameEmail =
    password &&
    !password.toLowerCase().includes(fullName.toLowerCase()) &&
    !password.toLowerCase().includes(email.toLowerCase());
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName || !email || !campaign || !password || !confirmPassword) {
      const msg = 'Please fill in all fields';
      setError(msg);
      toast.error(msg, { duration: 5000 });
      return;
    }

    if (password !== confirmPassword) {
      const msg = 'Passwords do not match';
      setError(msg);
      toast.error(msg, { duration: 5000 });
      return;
    }

    // password policy: length >=8, uppercase, number, symbol, not containing name/email
    const policy = /(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;':",.<>/?`~]).{8,}/;
    if (!policy.test(password)) {
      const msg = 'Password must be 8+ characters, include uppercase, number and symbol';
      setError(msg);
      toast.error(msg, { duration: 5000 });
      return;
    }
    if (password.toLowerCase().includes(fullName.toLowerCase()) ||
        password.toLowerCase().includes(email.toLowerCase())) {
      const msg = 'Password must not contain your name or email';
      setError(msg);
      toast.error(msg, { duration: 5000 });
      return;
    }

    setIsLoading(true);
    try {
      await register(fullName, email, password, campaign);
      toast.success('Registration successful! Please log in', { duration: 5000 });
      navigate('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      toast.error(err instanceof Error ? err.message : 'Registration failed', { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <BackgroundCircles />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-teal-600 mb-2">Create Account</h1>
          <p className="text-teal-600">Fill in the form to create a new account</p>
        </div>

        <Card className="bg-gray-900 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Register</CardTitle>
            <CardDescription className="text-teal-200">Enter your details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="!text-white">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-gray-800 text-white border-teal-500"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign" className="!text-white">Campaign</Label>
                <Select
                  value={campaign}
                  onValueChange={(val) => setCampaign(val)}
                >
                  <SelectTrigger className="bg-white text-gray-900 border-teal-500">
                    <SelectValue className="bg-white text-gray-900" placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="T-Mobile">T-Mobile</SelectItem>
                    <SelectItem value="ARS">ARS</SelectItem>
                    <SelectItem value="ATYT">ATYT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="!text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@institutional.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-800 text-white border-teal-500"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="!text-white">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordTouched(true)}
                    className="pl-10 pr-10 bg-gray-800 text-white border-teal-500"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-400"
                  >
                    
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="!text-white">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400 w-4 h-4" /> {/*dibujado del candado*/}
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-gray-800 text-white border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-400"
                  >
            
                  </button>
                </div>
              </div>

              {/* password policy checklist (visible once password field touched) */}
              {passwordTouched && (
                <div className="mt-1 text-sm space-y-1">
                <p className={hasLength ? 'flex items-center text-green-400' : 'flex items-center text-red-400'}>
                  {hasLength ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}8+ characters
                </p>
                <p className={hasUpper ? 'flex items-center text-green-400' : 'flex items-center text-red-400'}>
                  {hasUpper ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}Uppercase letter
                </p>
                <p className={hasNumber ? 'flex items-center text-green-400' : 'flex items-center text-red-400'}>
                  {hasNumber ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}Number
                </p>
                <p className={hasSymbol ? 'flex items-center text-green-400' : 'flex items-center text-red-400'}>
                  {hasSymbol ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}Symbol
                </p>
                <p className={noNameEmail ? 'flex items-center text-green-400' : 'flex items-center text-red-400'}>
                  {noNameEmail ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}Does not contain name/email
                </p>
                <p className={passwordsMatch ? 'flex items-center text-green-400' : 'flex items-center text-red-400'}>
                  {passwordsMatch ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}Passwords match
                </p>
              </div>
              )}

              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={isLoading}>
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-teal-600 mt-4">
          Already have an account?{' '}
          <button
            className="text-teal-400 hover:text-teal-300 hover:underline"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
