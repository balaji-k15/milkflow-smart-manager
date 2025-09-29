import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { Search } from 'lucide-react';

interface Collection {
  id: string;
  collection_date: string;
  quantity_liters: number;
  fat_percentage: number;
  rate_per_liter: number;
  total_amount: number;
  suppliers: {
    supplier_code: string;
    full_name: string;
  };
}

export const CollectionsTable = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = collections.filter((collection) =>
        collection.suppliers.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.suppliers.supplier_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCollections(filtered);
    } else {
      setFilteredCollections(collections);
    }
  }, [searchTerm, collections]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('milk_collections')
        .select(`
          *,
          suppliers (
            supplier_code,
            full_name
          )
        `)
        .order('collection_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCollections(data || []);
      setFilteredCollections(data || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collection Records</CardTitle>
        <CardDescription>Recent milk collection entries</CardDescription>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by supplier name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Quantity (L)</TableHead>
                <TableHead>Fat %</TableHead>
                <TableHead>Rate/L</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {searchTerm ? 'No collections found matching your search' : 'No collections yet'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCollections.map((collection) => (
                  <TableRow key={collection.id}>
                    <TableCell>
                      {format(new Date(collection.collection_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{collection.suppliers.full_name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {collection.suppliers.supplier_code}
                    </TableCell>
                    <TableCell>{Number(collection.quantity_liters).toFixed(2)}</TableCell>
                    <TableCell>{Number(collection.fat_percentage).toFixed(2)}%</TableCell>
                    <TableCell>${Number(collection.rate_per_liter).toFixed(4)}</TableCell>
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
  );
};