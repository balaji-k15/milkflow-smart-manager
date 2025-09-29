import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Milk, TrendingUp, Users, Zap } from 'lucide-react';

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole) {
      // Redirect logged-in users to their dashboard
      navigate(userRole === 'admin' ? '/admin' : '/supplier');
    }
  }, [user, userRole, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Milk className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            MilkFlow Smart Manager
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-2xl mx-auto">
            Streamline your dairy operations with intelligent collection tracking, 
            automated payments, and real-time analytics
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90 shadow-xl"
            onClick={() => navigate('/auth')}
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose MilkFlow?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Instant Processing</CardTitle>
                <CardDescription>
                  Record milk collections in seconds with automatic payment calculations 
                  based on quantity and fat content
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle>Real-Time Analytics</CardTitle>
                <CardDescription>
                  Track daily collections, monitor supplier performance, and analyze 
                  trends with beautiful, easy-to-understand dashboards
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>Supplier Portal</CardTitle>
                <CardDescription>
                  Give suppliers access to their own data with personalized portals 
                  showing transaction history and payment details
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Modernize Your Dairy?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join forward-thinking dairy operations using MilkFlow to save time, 
            reduce errors, and improve supplier relationships
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/auth')}
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2025 MilkFlow Smart Manager. Built with Lovable & Supabase.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
