import { useState, useEffect, useCallback } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supabase } from '@/lib/supabaseClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

// Type definitions
export type Transaction = {
  id: string;
  created_at: string;
  profile_id: string | null;
  transaction_type: 'DEPOSIT' | 'WITHDRAW' | 'BUY' | 'SELL';
  asset: string;
  transaction_value_usd: number;
  asset_quantity: number;
  price_per_asset_usd: number;
};

const tradeFormSchema = z.object({
  transaction_type: z.enum(['BUY', 'SELL'], {
    required_error: 'You need to select a transaction type.',
  }),
  transaction_value_usd: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .positive({ message: 'Amount must be a positive number.' }),
  asset: z.string().min(2, { message: 'Asset must be at least 2 characters.' }),
  price_per_asset_usd: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .positive({ message: 'Asset price must be a positive number.' }),
});

const defaultFormValues = {
  transaction_type: 'BUY' as const,
  transaction_value_usd: 0,
  asset: '',
  price_per_asset_usd: 0,
};

export default function TradesPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isDialogOpen, setDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof tradeFormSchema>>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: defaultFormValues,
  });

  const fetchTransactions = useCallback(async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .in('transaction_type', ['BUY', 'SELL'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch recent trades.');
    } else if (data) {
      setTransactions(data as Transaction[]);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleNewClick = () => {
    form.reset(defaultFormValues);
    setDialogOpen(true);
  };

  async function onSubmit(values: z.infer<typeof tradeFormSchema>) {
    try {
      const asset_quantity = values.transaction_value_usd / (values.price_per_asset_usd || 1);
      const transactionPayload = {
        transaction_type: values.transaction_type,
        asset: values.asset.toUpperCase(),
        transaction_value_usd: values.transaction_value_usd,
        price_per_asset_usd: values.price_per_asset_usd,
        asset_quantity: asset_quantity,
      };

      const { error: transactionError } = await supabase.from('transactions').insert(transactionPayload);
      if (transactionError) throw transactionError;
      toast.success('Transaction logged successfully!');

      setDialogOpen(false);
      form.reset(defaultFormValues);
      await fetchTransactions();
    } catch (error: any) {
      console.error('Error saving transaction:', error);
      toast.error(error.message || 'Failed to save transaction. Please try again.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Log New Trade</h1>
          <p className="text-muted-foreground">Record asset trades for the portfolio.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> New Trade
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Trade</DialogTitle>
              <DialogDescription>
                Log a new asset trade for the portfolio.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="transaction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trade Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a trade type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BUY">Buy</SelectItem>
                          <SelectItem value="SELL">Sell</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="transaction_value_usd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 1000" {...field} onChange={event => field.onChange(+event.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="asset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. BTC, ETH, SOL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price_per_asset_usd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Price (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 65000" {...field} onChange={event => field.onChange(+event.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Transaction'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>The 10 most recent buy/sell transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trade Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Amount (USD)</TableHead>
                <TableHead className="text-right">Asset Price (USD)</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${trade.transaction_type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {trade.transaction_type}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{trade.asset}</TableCell>
                  <TableCell className="text-right font-mono">
                    {trade.asset_quantity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${trade.transaction_value_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${trade.price_per_asset_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>{new Date(trade.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
