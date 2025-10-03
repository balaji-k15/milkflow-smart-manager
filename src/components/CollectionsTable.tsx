import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

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

  const handleDeleteClick = (id: string) => {
    setCollectionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!collectionToDelete) return;

    try {
      const { error } = await supabase
        .from('milk_collections')
        .delete()
        .eq('id', collectionToDelete);

      if (error) throw error;

      toast.success('Collection record deleted successfully');
      fetchCollections();
    } catch (error: any) {
      console.error('Error deleting collection:', error);
      toast.error(error.message || 'Failed to delete collection');
    } finally {
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
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
                <TableHead>Rate/L</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>₹{Number(collection.rate_per_liter).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{Number(collection.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(collection.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this collection record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};