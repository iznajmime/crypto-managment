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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabaseClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

export type Profile = {
  id: string;
  created_at: string;
  name: string;
  total_deposited_usd: number;
  email?: string | null;
  phoneNumber?: string | null;
};

const clientFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Client name must be at least 2 characters.',
  }),
  initialDeposit: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .positive({ message: 'Initial deposit must be a positive number.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }).optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
});

const depositWithdrawFormSchema = z.object({
  transaction_type: z.enum(['DEPOSIT', 'WITHDRAW']),
  amount: z.coerce
    .number({ invalid_type_error: 'Please enter a valid number.' })
    .positive({ message: 'Amount must be a positive number.' }),
});

export default function ClientsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isDepositWithdrawDialogOpen, setDepositWithdrawDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const createClientForm = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      initialDeposit: undefined,
      email: '',
      phoneNumber: '',
    },
  });

  const depositWithdrawForm = useForm<z.infer<typeof depositWithdrawFormSchema>>({
    resolver: zodResolver(depositWithdrawFormSchema),
    defaultValues: {
      transaction_type: 'DEPOSIT',
      amount: undefined,
    },
  });

  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to fetch clients.');
    } else if (data) {
      setProfiles(data);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  async function onCreateClientSubmit(values: z.infer<typeof clientFormSchema>) {
    try {
      const newProfilePayload = {
        name: values.name,
        total_deposited_usd: values.initialDeposit,
        email: values.email || null,
        phoneNumber: values.phoneNumber || null,
      };

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert(newProfilePayload)
        .select()
        .single();

      if (profileError) throw profileError;
      if (!profileData) {
        throw new Error("Failed to retrieve profile after creation. RLS policies might be misconfigured.");
      }

      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          profile_id: profileData.id,
          transaction_type: 'DEPOSIT',
          asset: 'USD',
          transaction_value_usd: values.initialDeposit,
        });

      if (transactionError) throw transactionError;

      toast.success('Client added successfully!');
      setCreateDialogOpen(false);
      createClientForm.reset();
      await fetchProfiles();
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast.error(error.message || 'Failed to add client. Please try again.');
    }
  }

  const handleDepositWithdrawClick = (profile: Profile) => {
    setSelectedProfile(profile);
    depositWithdrawForm.reset({ transaction_type: 'DEPOSIT', amount: undefined });
    setDepositWithdrawDialogOpen(true);
  };

  async function onDepositWithdrawSubmit(values: z.infer<typeof depositWithdrawFormSchema>) {
    if (!selectedProfile) {
      toast.error("No client selected.");
      return;
    }

    try {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          profile_id: selectedProfile.id,
          transaction_type: values.transaction_type,
          asset: 'USD',
          transaction_value_usd: values.amount,
        });

      if (transactionError) throw transactionError;

      const amountToUpdate = values.transaction_type === 'DEPOSIT' ? values.amount : -values.amount;
      const { error: rpcError } = await supabase.rpc('update_client_deposit', {
        client_id: selectedProfile.id,
        deposit_amount: amountToUpdate,
      });

      if (rpcError) throw rpcError;

      toast.success(`${values.transaction_type.charAt(0).toUpperCase() + values.transaction_type.slice(1).toLowerCase()} successful!`);
      setDepositWithdrawDialogOpen(false);
      await fetchProfiles();
    } catch (error: any) {
      console.error('Error processing transaction:', error);
      toast.error(error.message || `Failed to process ${values.transaction_type.toLowerCase()}. Please try again.`);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage your client profiles and view their performance.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Client</DialogTitle>
              <DialogDescription>
                Enter the client's details and their initial deposit. This will create a new profile and log the first transaction.
              </DialogDescription>
            </DialogHeader>
            <Form {...createClientForm}>
              <form onSubmit={createClientForm.handleSubmit(onCreateClientSubmit)} className="space-y-4">
                <FormField
                  control={createClientForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createClientForm.control}
                  name="initialDeposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Deposit (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 50000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createClientForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. client@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createClientForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. +1 234 567 890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={createClientForm.formState.isSubmitting}>
                    {createClientForm.formState.isSubmitting ? 'Saving...' : 'Save Client'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Client Overview</CardTitle>
          <CardDescription>A list of all your managed clients from the database.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead className="text-right">Total Deposited</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{profile.name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{profile.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${profile.total_deposited_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleDepositWithdrawClick(profile)}>
                      Deposit / Withdraw
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDepositWithdrawDialogOpen} onOpenChange={setDepositWithdrawDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Deposit / Withdraw for {selectedProfile?.name}</DialogTitle>
            <DialogDescription>
              Select transaction type and enter the amount in USD.
            </DialogDescription>
          </DialogHeader>
          <Form {...depositWithdrawForm}>
            <form onSubmit={depositWithdrawForm.handleSubmit(onDepositWithdrawSubmit)} className="space-y-4 py-4">
              <FormField
                control={depositWithdrawForm.control}
                name="transaction_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DEPOSIT">Deposit</SelectItem>
                        <SelectItem value="WITHDRAW">Withdraw</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={depositWithdrawForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={depositWithdrawForm.formState.isSubmitting}>
                  {depositWithdrawForm.formState.isSubmitting ? 'Processing...' : 'Submit Transaction'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
