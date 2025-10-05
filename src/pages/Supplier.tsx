import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Milk, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { UserProfile } from '@/components/UserProfile';

interface SupplierData {
  id: string;
  supplier_code: string;
  full_name: string;
  phone: string;
}

interface Collection {
  id: string;
  collection_date: string;
  quantity_liters: number;
  fat_percentage: number;
  rate_per_liter: number;
  total_amount: number;
  created_by: string | null;
  admin_name?: string;
}

const Supplier = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<SupplierData | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalAmount: 0,
    avgFatPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (userRole && userRole !== 'supplier') {
      navigate('/admin');
      return;
    }
    
    fetchSupplierData();
  }, [user, userRole, navigate]);

  // Set up realtime subscription for new collections
  useEffect(() => {
    if (!supplier?.id) return;

    const channel = supabase
      .channel('milk-collections-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'milk_collections',
          filter: `supplier_id=eq.${supplier.id}`,
        },
        async (payload) => {
          console.log('New collection added:', payload);
          
          // Fetch admin name for the new collection
          let adminName = 'Admin';
          if (payload.new.created_by) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', payload.new.created_by)
              .single();
            
            adminName = profileData?.full_name || 'Admin';
          }

          const newCollection = {
            ...payload.new,
            admin_name: adminName,
          } as Collection;

          setCollections((prev) => [newCollection, ...prev].slice(0, 30));
          
          // Update stats
          setStats((prev) => ({
            totalCollections: prev.totalCollections + Number(newCollection.quantity_liters),
            totalAmount: prev.totalAmount + Number(newCollection.total_amount),
            avgFatPercentage: prev.avgFatPercentage, // Recalculate on next full fetch
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supplier?.id]);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      
      // Get supplier data
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (supplierError) throw supplierError;
      setSupplier(supplierData);

      // Get collections with admin name
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('milk_collections')
        .select('*')
        .eq('supplier_id', supplierData.id)
        .order('collection_date', { ascending: false })
        .limit(30);

      if (collectionsError) throw collectionsError;

      // Fetch admin names for each collection
      const collectionsWithAdmins = await Promise.all(
        (collectionsData || []).map(async (collection) => {
          if (collection.created_by) {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', collection.created_by)
              .single();
            
            return {
              ...collection,
              admin_name: profileData?.full_name || 'Admin',
            };
          }
          return collection;
        })
      );

      setCollections(collectionsWithAdmins);

      // Calculate stats
      const totalLiters = collectionsWithAdmins?.reduce((sum, col) => sum + Number(col.quantity_liters), 0) || 0;
      const totalAmt = collectionsWithAdmins?.reduce((sum, col) => sum + Number(col.total_amount), 0) || 0;
      const avgFat = collectionsWithAdmins?.length
        ? collectionsWithAdmins.reduce((sum, col) => sum + Number(col.fat_percentage), 0) / collectionsWithAdmins.length
        : 0;

      setStats({
        totalCollections: totalLiters,
        totalAmount: totalAmt,
        avgFatPercentage: avgFat,
      });
    } catch (error) {
      console.error('Error fetching supplier data:', error);
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
              <p className="text-sm text-muted-foreground">
                {supplier?.full_name} ({supplier?.supplier_code})
              </p>
            </div>
          </div>
          <UserProfile userName={supplier?.full_name || 'Supplier'} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8 animate-fade-in">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collection</CardTitle>
              <Milk className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCollections.toFixed(2)} L</div>
              <p className="text-xs text-muted-foreground">Last 30 entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Last 30 entries</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Fat %</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgFatPercentage.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">Last 30 entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Collections Table */}
        <Card>
          <CardHeader>
            <CardTitle>Collection History</CardTitle>
            <CardDescription>Your recent milk collection records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Quantity (L)</TableHead>
                    <TableHead>Fat %</TableHead>
                    <TableHead>Rate/L</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No collections yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    collections.map((collection) => (
                      <TableRow key={collection.id}>
                        <TableCell>
                          {format(new Date(collection.collection_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{Number(collection.quantity_liters).toFixed(2)}</TableCell>
                        <TableCell>{Number(collection.fat_percentage).toFixed(2)}%</TableCell>
                        <TableCell>${Number(collection.rate_per_liter).toFixed(2)}</TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {collection.admin_name || 'Admin'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(collection.total_amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Supplier;