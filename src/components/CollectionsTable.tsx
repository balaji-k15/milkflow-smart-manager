import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Search, Trash2, Download, Calendar as CalendarIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Collection {
  id: string;
  collection_date: string;
  quantity_liters: number;
  fat_percentage: number;
  rate_per_liter: number;
  total_amount: number;
  created_by: string | null;
  suppliers: {
    supplier_code: string;
    full_name: string;
  };
  admin_name?: string;
}

export const CollectionsTable = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filteredCollections, setFilteredCollections] = useState<Collection[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    let filtered = collections;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((collection) =>
        collection.suppliers.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.suppliers.supplier_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by date
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      filtered = filtered.filter((collection) => collection.collection_date === dateStr);
    }
    
    setFilteredCollections(filtered);
  }, [searchTerm, selectedDate, collections]);

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

      // Fetch admin names for each collection
      const collectionsWithAdmins = await Promise.all(
        (data || []).map(async (collection) => {
          if (collection.created_by) {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', collection.created_by)
              .maybeSingle();
            
            return {
              ...collection,
              admin_name: profileData?.full_name || 'N/A',
            };
          }
          return { ...collection, admin_name: 'N/A' };
        })
      );

      setCollections(collectionsWithAdmins);
      setFilteredCollections(collectionsWithAdmins);
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

  const handleDownload = () => {
    const csvContent = [
      ['Date', 'Supplier', 'Code', 'Quantity (L)', 'Rate/L', 'Amount', 'Added By'].join(','),
      ...filteredCollections.map(c => [
        format(new Date(c.collection_date), 'MMM dd, yyyy'),
        c.suppliers.full_name,
        c.suppliers.supplier_code,
        Number(c.quantity_liters).toFixed(2),
        Number(c.rate_per_liter).toFixed(2),
        Number(c.total_amount).toFixed(2),
        c.admin_name || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collections-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Collections downloaded successfully');
  };

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Collection Records</CardTitle>
            <CardDescription>Recent milk collection entries</CardDescription>
          </div>
          <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Download CSV
          </Button>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by supplier name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {selectedDate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate(undefined)}
              title="Clear date filter"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
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
                <TableHead>Added By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCollections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                    <TableCell>
                      <span className="text-sm font-medium">
                        {collection.admin_name || 'N/A'}
                      </span>
                    </TableCell>
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