import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Milk, Users, IndianRupee, Download } from 'lucide-react';
import { AddCollectionForm } from '@/components/AddCollectionForm';
import { ManageSuppliers } from '@/components/ManageSuppliers';
import { CollectionsTable } from '@/components/CollectionsTable';
import { DailyPaymentSummary } from '@/components/DailyPaymentSummary';
import { UserProfile } from '@/components/UserProfile';
import { ThemeToggle } from '@/components/ThemeToggle';

const Admin = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Admin User');
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    todayCollection: 0,
    todayPayment: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole && userRole !== 'admin') {
      navigate('/supplier');
      return;
    }
    
    fetchUserProfile();
    fetchDashboardStats();
  }, [user, userRole, navigate]);

  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      if (data) setUserName(data.full_name);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Total suppliers
      const { count: suppliersCount } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Today's collections
      const today = new Date().toISOString().split('T')[0];
      const { data: todayCollections } = await supabase
        .from('milk_collections')
        .select('quantity_liters, total_amount, fat_percentage')
        .eq('collection_date', today);

      const todayLiters = todayCollections?.reduce((sum, col) => sum + Number(col.quantity_liters), 0) || 0;
      const todayAmount = todayCollections?.reduce((sum, col) => sum + Number(col.total_amount), 0) || 0;

      setStats({
        totalSuppliers: suppliersCount || 0,
        todayCollection: todayLiters,
        todayPayment: todayAmount,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-glow">
              <Milk className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">MilkFlow Manager</h1>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserProfile userName={userName} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8 animate-fade-in">
          <Card className="hover:shadow-lg transition-shadow border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{stats.totalSuppliers}</div>
              <p className="text-xs text-muted-foreground">Total registered</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
              <Milk className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{stats.todayCollection.toFixed(2)} L</div>
              <p className="text-xs text-muted-foreground">Liters collected</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Payment</CardTitle>
              <IndianRupee className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">₹{stats.todayPayment.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total amount</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="entry" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entry">Add Collection</TabsTrigger>
            <TabsTrigger value="collections">View Collections</TabsTrigger>
            <TabsTrigger value="daily">Daily Summary</TabsTrigger>
            <TabsTrigger value="suppliers">Manage Suppliers</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4">
            <AddCollectionForm onSuccess={fetchDashboardStats} />
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <CollectionsTable />
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <DailyPaymentSummary />
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <ManageSuppliers onUpdate={fetchDashboardStats} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;