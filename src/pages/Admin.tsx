import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Milk, Users, TrendingUp, DollarSign } from 'lucide-react';
import { AddCollectionForm } from '@/components/AddCollectionForm';
import { ManageSuppliers } from '@/components/ManageSuppliers';
import { CollectionsTable } from '@/components/CollectionsTable';
import { UserProfile } from '@/components/UserProfile';

const Admin = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Admin User');
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    todayCollection: 0,
    todayPayment: 0,
    avgFatPercentage: 0,
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
      const avgFat = todayCollections?.length 
        ? todayCollections.reduce((sum, col) => sum + Number(col.fat_percentage), 0) / todayCollections.length
        : 0;

      setStats({
        totalSuppliers: suppliersCount || 0,
        todayCollection: todayLiters,
        todayPayment: todayAmount,
        avgFatPercentage: avgFat,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Milk className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">MilkFlow Manager</h1>
              <p className="text-sm text-muted-foreground">Admin Dashboard</p>
            </div>
          </div>
          <UserProfile userName={userName} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8 animate-fade-in">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSuppliers}</div>
              <p className="text-xs text-muted-foreground">Total registered</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Collection</CardTitle>
              <Milk className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCollection.toFixed(2)} L</div>
              <p className="text-xs text-muted-foreground">Liters collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Payment</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.todayPayment.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total amount</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Fat %</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgFatPercentage.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Today's average</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="entry" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entry">Add Collection</TabsTrigger>
            <TabsTrigger value="collections">View Collections</TabsTrigger>
            <TabsTrigger value="suppliers">Manage Suppliers</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4">
            <AddCollectionForm onSuccess={fetchDashboardStats} />
          </TabsContent>

          <TabsContent value="collections" className="space-y-4">
            <CollectionsTable />
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