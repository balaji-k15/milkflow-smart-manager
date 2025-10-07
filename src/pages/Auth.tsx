import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Milk } from 'lucide-react';
import { toast } from 'sonner';
import { signInSchema, signUpSchema } from '@/lib/validation';

const Auth = () => {
  const { signIn, signUp, user, userRole, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginOTP, setLoginOTP] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  
  // Signup form state
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<'admin' | 'supplier'>('supplier');

  // Redirect if already logged in
  useEffect(() => {
    if (user && userRole) {
      navigate(userRole === 'admin' ? '/admin' : '/supplier');
    }
  }, [user, userRole, navigate]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate phone number
      const validation = signInSchema.safeParse({ phone: loginPhone, password: 'temp123' });
      if (!validation.success) {
        toast.error('Please enter a valid 10-digit phone number');
        return;
      }
      
      await sendOTP(loginPhone);
      setOtpSent(true);
    } catch (error) {
      console.error('OTP error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (loginOTP.length !== 6) {
        toast.error('Please enter a valid 6-digit OTP');
        return;
      }

      const verified = await verifyOTP(loginPhone, loginOTP);
      if (verified) {
        setOtpVerified(true);
        toast.success('Phone verified! Please enter your password.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate input
      const validation = signInSchema.safeParse({ phone: loginPhone, password: loginPassword });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
      
      await signIn(loginPhone, loginPassword);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Validate input
      const validation = signUpSchema.safeParse({
        phone: signupPhone,
        password: signupPassword,
        fullName: signupName,
        role: signupRole
      });
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }
      
      await signUp(signupPhone, signupPassword, signupName, signupRole);
    } catch (error) {
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-hero">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-4">
            <Milk className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">MilkFlow Manager 2025</CardTitle>
          <CardDescription>Indian Dairy Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-phone">Mobile Number</Label>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="9876543210"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                  </Button>
                </form>
              ) : !otpVerified ? (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-otp">Enter OTP</Label>
                    <Input
                      id="login-otp"
                      type="text"
                      placeholder="000000"
                      value={loginOTP}
                      onChange={(e) => setLoginOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      OTP sent to {loginPhone}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        setOtpSent(false);
                        setLoginOTP('');
                      }}
                    >
                      Change Number
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Phone verified: {loginPhone} ✓
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter full name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Mobile Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="9876543210"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Account Type</Label>
                  <Select value={signupRole} onValueChange={(value: 'admin' | 'supplier') => setSignupRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Secure authentication powered by Supabase
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;