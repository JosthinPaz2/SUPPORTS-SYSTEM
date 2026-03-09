import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Lock, AlertCircle, Mail, Eye, EyeOff, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import BackgroundCircles from '../components/ui/BackgroundCircles';


type ModalState = 'forgot' | 'verify' | 'reset';

export default function Login() {
  const navigate = useNavigate();
  const { login, requestPasswordRecovery, verifyCode, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);

  // Password validation helpers for reset
  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSymbol = /[!@#$%^&*()_+\-=[\]{}|;':",.<>/?`~]/.test(newPassword);
  const noNameEmail =
    newPassword &&
    !newPassword.toLowerCase().includes(resetEmail.split('@')[0].toLowerCase()) &&
    !newPassword.toLowerCase().includes(resetEmail.toLowerCase());
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      const msg = 'Please enter email and password';
      setError(msg);
      toast.error(msg,{duration:5000});
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      toast.success('Login successful!', { duration: 5000 });
      navigate('/admin'); // Navigate to admin dashboard after successful login
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      setError(msg);
      toast.error(msg, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address', { duration: 5000 });
      return;
    }

    setIsLoading(true);
    try {
      await requestPasswordRecovery(resetEmail);
      toast.success('Recovery code sent to your email', { duration: 5000 });
      setModalState('verify');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send recovery email', { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode) {
      toast.error('Please enter the verification code', { duration: 5000 });
      return;
    }

    setIsLoading(true);
    try {
      await verifyCode(resetEmail, verificationCode);
      toast.success('Code verified successfully', { duration: 5000 });
      setModalState('reset');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid code', { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields', { duration: 5000 });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match', { duration: 5000 });
      return;
    }

    // Validate password policy: 8+ chars, uppercase, number, symbol, not containing name/email
    if (!hasLength) {
      toast.error('Password must be at least 8 characters long', { duration: 5000 });
      return;
    }
    if (!hasUpper) {
      toast.error('Password must contain at least one uppercase letter', { duration: 5000 });
      return;
    }
    if (!hasNumber) {
      toast.error('Password must contain at least one number', { duration: 5000 });
      return;
    }
    if (!hasSymbol) {
      toast.error('Password must contain at least one special character (!@#$%^&*)', { duration: 5000 });
      return;
    }
    if (!noNameEmail) {
      toast.error('Password cannot contain your email or username', { duration: 5000 });
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(resetEmail, verificationCode, newPassword);
      toast.success('Password reset successfully! Please login with your new password', { duration: 5000 });
      setModalState(null);
      setResetEmail('');
      setVerificationCode('');
      setNewPassword('');
      setConfirmPassword('');
      setNewPasswordTouched(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password', { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setModalState(null);
    setResetEmail('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setNewPasswordTouched(false);
  };

return (

  
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Background */}
      <BackgroundCircles />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-teal-500 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-teal-600 mb-2">
            IT Support System
          </h1>
          <p className="text-teal-600">
            Sign in to continue
          </p>
        </div>

        <Card className="bg-gray-900 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-teal-200">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
                      className="pl-10 pr-10 bg-gray-800 text-white border-teal-500"
                      autoComplete="current-password"
                      disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setModalState('forgot')}
                  className="text-sm text-teal-400 hover:text-teal-300 hover:underline"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </div>

              <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600 text-white" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-teal-600 mt-4">
          Don't have an account?{' '}
          <button
            className="text-teal-400 hover:text-teal-300 hover:underline"
            onClick={() => navigate('/register')}
          >
            Register
          </button>
        </p>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      <Dialog open={modalState === 'forgot'} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Reset Password</DialogTitle>
            <DialogDescription className="text-black">
              Enter your institutional email address and we'll send you a recovery code
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email" className="text-teal-200">Institutional Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400 w-4 h-4" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="correo@institucional.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="pl-10 bg-gray-800 text-white border-teal-500"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Code'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Verificación de Código */}
      <Dialog open={modalState === 'verify'} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">Verify Code</DialogTitle>
            <DialogDescription className="text-black">
              Enter the 6-digit code sent to {resetEmail}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verification-code" className="text-teal-200">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="bg-gray-800 text-white border-teal-500 text-center text-lg tracking-widest"
                maxLength={6}
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalState('forgot')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Reset de Contraseña */}
      <Dialog open={modalState === 'reset'} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-white">New Password</DialogTitle>
            <DialogDescription className="text-black">
              Enter your new password (must meet security requirements)
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-teal-200">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400 w-4 h-4" />
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onFocus={() => setNewPasswordTouched(true)}
                  className="pl-10 pr-10 bg-white text-gray-900 border-teal-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-teal-200">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-teal-400 w-4 h-4" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 bg-white text-gray-900 border-teal-500"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {newPasswordTouched && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Password Requirements:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {hasLength ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={hasLength ? 'text-green-700' : 'text-red-700'}>8+ characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasUpper ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={hasUpper ? 'text-green-700' : 'text-red-700'}>One uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasNumber ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={hasNumber ? 'text-green-700' : 'text-red-700'}>One number</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasSymbol ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={hasSymbol ? 'text-green-700' : 'text-red-700'}>One special character (!@#$%^&*)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {noNameEmail ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={noNameEmail ? 'text-green-700' : 'text-red-700'}>No email or username</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {passwordsMatch ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <X className="w-4 h-4 text-red-600" />
                    )}
                    <span className={passwordsMatch ? 'text-green-700' : 'text-red-700'}>Passwords match</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalState('verify')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button type="submit" className="bg-teal-500 hover:bg-teal-600 text-white" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}