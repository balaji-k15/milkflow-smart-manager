import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface DailyTotal {
  date: string;
  totalLiters: number;
  totalAmount: number;
  collectionCount: number;
}

export const DailyPaymentSummary = () => {
  const [dailyTotals, setDailyTotals] = useState<DailyTotal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyTotals();
  }, []);

  const fetchDailyTotals = async () => {
    try {
      setLoading(true);
      
      // Fetch all collections
      const { data, error } = await supabase
        .from('milk_collections')
        .select('collection_date, quantity_liters, total_amount')
        .order('collection_date', { ascending: false });

      if (error) throw error;

      // Group by date
      const grouped = (data || []).reduce((acc: { [key: string]: DailyTotal }, curr) => {
        const date = curr.collection_date;
        if (!acc[date]) {
          acc[date] = {
            date,
            totalLiters: 0,
            totalAmount: 0,
            collectionCount: 0,
          };
        }
        acc[date].totalLiters += Number(curr.quantity_liters);
        acc[date].totalAmount += Number(curr.total_amount);
        acc[date].collectionCount += 1;
        return acc;
      }, {});

      // Convert to array and sort by date
      const totalsArray = Object.values(grouped).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setDailyTotals(totalsArray);
    } catch (error) {
      console.error('Error fetching daily totals:', error);
      toast.error('Failed to load daily totals');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const csvContent = [
      ['Date', 'Collections', 'Total Liters', 'Total Payment'].join(','),
      ...dailyTotals.map(d => [
        format(new Date(d.date), 'MMM dd, yyyy'),
        d.collectionCount,
        Number(d.totalLiters).toFixed(2),
        Number(d.totalAmount).toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-payment-summary-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Daily summary downloaded successfully');
  };

  return (
    <Card className="shadow-lg border-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Payment Summary</CardTitle>
            <CardDescription>Day-wise collection and payment totals</CardDescription>
          </div>
          <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Download CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Collections</TableHead>
                <TableHead>Total Liters</TableHead>
                <TableHead className="text-right">Total Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : dailyTotals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                dailyTotals.map((daily) => (
                  <TableRow key={daily.date}>
                    <TableCell className="font-medium">
                      {format(new Date(daily.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{daily.collectionCount}</TableCell>
                    <TableCell>{Number(daily.totalLiters).toFixed(2)} L</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{Number(daily.totalAmount).toFixed(2)}
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
