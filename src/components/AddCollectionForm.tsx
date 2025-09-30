import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calculator } from 'lucide-react';

interface Supplier {
  id: string;
  supplier_code: string;
  full_name: string;
}

interface AddCollectionFormProps {
  onSuccess: () => void;
}

export const AddCollectionForm = ({ onSuccess }: AddCollectionFormProps) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [quantity, setQuantity] = useState('');
  const [ratePerLiter, setRatePerLiter] = useState('35');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, supplier_code, full_name')
        .eq('is_active', true)
        .order('supplier_code');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const calculateAmount = () => {
    if (!quantity || !ratePerLiter) {
      return 0;
    }
    
    const qty = parseFloat(quantity);
    const rate = parseFloat(ratePerLiter);
    
    return qty * rate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSupplier || !quantity || !ratePerLiter) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const totalAmount = calculateAmount();
      
      const { error } = await supabase.from('milk_collections').insert({
        supplier_id: selectedSupplier,
        quantity_liters: parseFloat(quantity),
        fat_percentage: null,
        rate_per_liter: parseFloat(ratePerLiter),
        total_amount: totalAmount,
        notes: notes || null,
      });

      if (error) throw error;

      toast.success('Collection added successfully!');
      
      // Reset form
      setSelectedSupplier('');
      setQuantity('');
      setNotes('');
      
      onSuccess();
    } catch (error: any) {
      console.error('Error adding collection:', error);
      toast.error(error.message || 'Failed to add collection');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = calculateAmount();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Milk Collection</CardTitle>
        <CardDescription>Record a new milk collection entry</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplier_code} - {supplier.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (Liters) *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Rate per Liter (₹) *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="35.00"
                value={ratePerLiter}
                onChange={(e) => setRatePerLiter(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Calculation Display */}
          {quantity && ratePerLiter && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calculator className="w-4 h-4" />
                <span>Total Amount</span>
              </div>
              <div className="text-2xl font-bold text-primary">
                ₹{totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                {quantity} liters × ₹{parseFloat(ratePerLiter).toFixed(2)}/liter
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Adding...' : 'Add Collection'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};