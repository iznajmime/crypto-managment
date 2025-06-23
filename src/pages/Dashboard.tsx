import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { fetchCryptoPrices } from '@/lib/cryptoApi';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Types
type Profile = {
  id: string;
  name: string;
};

type Transaction = {
  id: string;
  profile_id: string | null;
  transaction_type: 'DEPOSIT' | 'WITHDRAW' | 'BUY' | 'SELL';
  asset: string;
  asset_quantity: number;
  price_per_asset_usd: number;
  transaction_value_usd: number;
  created_at: string;
};

type AssetHolding = {
  name: string;
  quantity: number;
  marketValue: number;
};

type ClientBreakdown = {
  name: string;
  capitalDeposited: number;
  ownershipPercentage: number;
  equityValue: number;
};

type AssetAllocation = {
  name: string;
  value: number;
}

type RealizedPnL = {
  x: string;
  y: number; // Now represents percentage
}

const MONOCHROMATIC_BLUE_PALETTE = ['#A8D1E7', '#7AB8DB', '#4F9ECB', '#2E85B8', '#166498', '#0A4A7A'];

const ValueCard = ({ title, value, subtext, valueClassName }: { title: string; value: string; subtext?: string; valueClassName?: string }) => (
  <Card className="card-component">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </CardContent>
  </Card>
);

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-[108px] card-component" />
      <Skeleton className="h-[108px] card-component" />
      <Skeleton className="h-[108px] card-component" />
    </div>
    <Skeleton className="h-[400px] card-component" />
    <Skeleton className="h-[400px] card-component" />
    <Skeleton className="h-[300px] card-component" />
  </div>
);

export default function DashboardPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const profilesPromise = supabase.from('profiles').select('id, name');
        const transactionsPromise = supabase.from('transactions').select('*');

        const [{ data: profilesData, error: profilesError }, { data: transactionsData, error: transactionsError }] = await Promise.all([profilesPromise, transactionsPromise]);

        if (profilesError) throw profilesError;
        if (transactionsError) throw transactionsError;

        setProfiles(profilesData || []);
        setTransactions(transactionsData || []);

        const uniqueAssets = [...new Set(transactionsData?.filter(t => t.asset !== 'USD').map(t => t.asset.toLowerCase()) || [])];
        if (uniqueAssets.length > 0) {
          const fetchedPrices = await fetchCryptoPrices(uniqueAssets);
          setPrices(fetchedPrices);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const {
    totalPortfolioValue,
    totalCash,
    allTimePL,
    assetHoldings,
    assetAllocation,
    clientBreakdown,
    realizedPnLData,
  } = useMemo(() => {
    if (loading || !transactions.length) {
      return { totalPortfolioValue: 0, totalCash: 0, allTimePL: 0, assetHoldings: [], assetAllocation: [], clientBreakdown: [], realizedPnLData: [] };
    }

    const deposits = transactions.filter(t => t.transaction_type === 'DEPOSIT').reduce((sum, t) => sum + t.transaction_value_usd, 0);
    const withdrawals = transactions.filter(t => t.transaction_type === 'WITHDRAW').reduce((sum, t) => sum + t.transaction_value_usd, 0);
    const buys = transactions.filter(t => t.transaction_type === 'BUY').reduce((sum, t) => sum + t.transaction_value_usd, 0);
    const sells = transactions.filter(t => t.transaction_type === 'SELL').reduce((sum, t) => sum + t.transaction_value_usd, 0);
    const calculatedTotalCash = deposits + sells - withdrawals - buys;

    const cryptoHoldingsMap: { [asset: string]: number } = {};
    transactions.forEach(t => {
      if (t.asset === 'USD') return;
      if (!cryptoHoldingsMap[t.asset]) cryptoHoldingsMap[t.asset] = 0;
      if (t.transaction_type === 'BUY') cryptoHoldingsMap[t.asset] += t.asset_quantity;
      if (t.transaction_type === 'SELL') cryptoHoldingsMap[t.asset] -= t.asset_quantity;
    });

    const costBasisMap: { [asset: string]: number } = {};
    Object.keys(cryptoHoldingsMap).forEach(asset => {
      const buyTransactions = transactions.filter(t => t.asset === asset && t.transaction_type === 'BUY');
      const totalUsdSpent = buyTransactions.reduce((sum, t) => sum + t.transaction_value_usd, 0);
      const totalQuantityBought = buyTransactions.reduce((sum, t) => sum + t.asset_quantity, 0);
      costBasisMap[asset] = totalQuantityBought > 0 ? totalUsdSpent / totalQuantityBought : 0;
    });

    const calculatedAssetHoldings: AssetHolding[] = Object.entries(cryptoHoldingsMap)
      .map(([asset, quantity]) => {
        const livePrice = prices[asset.toLowerCase()];
        const costBasis = costBasisMap[asset] || 0;
        const priceToUse = livePrice !== undefined ? livePrice : costBasis;
        return { name: asset, quantity: quantity, marketValue: quantity * priceToUse };
      })
      .filter(h => h.quantity > 1e-6);

    const cryptoValue = calculatedAssetHoldings.reduce((sum, asset) => sum + asset.marketValue, 0);
    const calculatedTPV = cryptoValue + calculatedTotalCash;
    const netCapitalInvested = deposits - withdrawals;
    const calculatedAllTimePL = calculatedTPV - netCapitalInvested;

    const calculatedAssetAllocation: AssetAllocation[] = calculatedAssetHoldings.map(h => ({ name: h.name, value: h.marketValue }));
    if (calculatedTotalCash > 0.01) {
      calculatedAssetAllocation.push({ name: 'Cash', value: calculatedTotalCash });
    }

    const clientDeposits: { [profileId: string]: number } = {};
    transactions
      .filter(t => t.transaction_type === 'DEPOSIT' && t.profile_id)
      .forEach(t => {
        clientDeposits[t.profile_id!] = (clientDeposits[t.profile_id!] || 0) + t.transaction_value_usd;
      });
    const totalDeposits = Object.values(clientDeposits).reduce((sum, d) => sum + d, 0);
    const calculatedClientBreakdown: ClientBreakdown[] = profiles.map(profile => {
      const capitalDeposited = clientDeposits[profile.id] || 0;
      const ownershipPercentage = totalDeposits > 0 ? (capitalDeposited / totalDeposits) * 100 : 0;
      const equityValue = (ownershipPercentage / 100) * calculatedTPV;
      return { name: profile.name, capitalDeposited, ownershipPercentage, equityValue };
    }).sort((a, b) => b.equityValue - a.equityValue);

    // Calculate Realized P&L as a Percentage
    const calculatedRealizedPnL: RealizedPnL[] = [];
    const runningCosts: { [asset: string]: { totalQuantity: number; totalCost: number } } = {};
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    sortedTransactions.forEach(t => {
      if (t.asset === 'USD') return;
      if (!runningCosts[t.asset]) {
        runningCosts[t.asset] = { totalQuantity: 0, totalCost: 0 };
      }

      if (t.transaction_type === 'BUY') {
        runningCosts[t.asset].totalQuantity += t.asset_quantity;
        runningCosts[t.asset].totalCost += t.transaction_value_usd;
      } else if (t.transaction_type === 'SELL') {
        const assetCosts = runningCosts[t.asset];
        if (assetCosts && assetCosts.totalQuantity > 0) {
          const averageCostPerUnit = assetCosts.totalCost / assetCosts.totalQuantity;
          const costOfSoldAssets = t.asset_quantity * averageCostPerUnit;
          
          const pnlPercentage = costOfSoldAssets > 0 
            ? ((t.transaction_value_usd - costOfSoldAssets) / costOfSoldAssets) * 100 
            : 0;

          calculatedRealizedPnL.push({
            x: `${t.asset} (${new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
            y: pnlPercentage,
          });

          assetCosts.totalQuantity -= t.asset_quantity;
          assetCosts.totalCost -= costOfSoldAssets;
          if (assetCosts.totalQuantity < 1e-9) {
            assetCosts.totalQuantity = 0;
            assetCosts.totalCost = 0;
          }
        }
      }
    });

    return {
      totalPortfolioValue: calculatedTPV,
      totalCash: calculatedTotalCash,
      allTimePL: calculatedAllTimePL,
      assetHoldings: calculatedAssetHoldings,
      assetAllocation: calculatedAssetAllocation,
      clientBreakdown: calculatedClientBreakdown,
      realizedPnLData: calculatedRealizedPnL,
    };
  }, [profiles, transactions, prices, loading]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const netDeposits = transactions.filter(t => t.transaction_type === 'DEPOSIT').reduce((s, t) => s + t.transaction_value_usd, 0) - transactions.filter(t => t.transaction_type === 'WITHDRAW').reduce((s, t) => s + t.transaction_value_usd, 0);
  const plReturn = netDeposits > 0 ? (allTimePL / netDeposits) * 100 : 0;

  const apexTreemapSeries = [{
    data: assetAllocation.map(a => ({ x: a.name, y: a.value }))
  }];

  const apexTreemapOptions: ApexOptions = {
    chart: { type: 'treemap', background: 'transparent', toolbar: { show: false } },
    colors: MONOCHROMATIC_BLUE_PALETTE,
    plotOptions: { treemap: { distributed: true, enableShades: false, useFillColorAsStroke: true } },
    tooltip: {
      y: { formatter: (value) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) },
      theme: 'dark',
    },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      style: { fontSize: '14px', fontFamily: 'inherit', fontWeight: 'bold', colors: ['#fff'] },
      formatter: function(text, op) {
        const { seriesIndex, dataPointIndex, w } = op;
        const value = w.globals.series[seriesIndex][dataPointIndex];
        const total = w.globals.seriesTotals[seriesIndex];
        const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
        return `${text} (${percentage}%)`;
      },
      offsetY: -4
    }
  };

  const tradePerformanceSeries = [{
    name: 'Realized P&L (%)',
    data: realizedPnLData.map(d => parseFloat(d.y.toFixed(2)))
  }];

  const tradePerformanceOptions: ApexOptions = {
    chart: { type: 'bar', height: 350, background: 'transparent', toolbar: { show: false } },
    plotOptions: {
      bar: {
        colors: {
          ranges: [{ from: 0, to: Infinity, color: '#2E85B8' }, { from: -Infinity, to: -0.01, color: '#A8D1E7' }]
        },
        columnWidth: '80%',
      }
    },
    dataLabels: { enabled: false },
    yaxis: {
      title: { text: 'Profit/Loss (%)', style: { color: 'hsl(var(--muted-foreground))' } },
      labels: {
        style: { colors: 'hsl(var(--muted-foreground))' },
        formatter: (value) => `${value.toFixed(0)}%`
      }
    },
    xaxis: {
      categories: realizedPnLData.map(d => d.x),
      labels: { style: { colors: 'hsl(var(--muted-foreground))' }, rotate: -45, hideOverlappingLabels: true, trim: true }
    },
    grid: { borderColor: 'hsl(var(--border))', yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    tooltip: {
      theme: 'dark',
      y: { formatter: (value) => `${value.toFixed(2)}%` }
    }
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ValueCard
          title="Total Portfolio Value"
          value={totalPortfolioValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          subtext="Live value of all crypto and cash"
        />
        <ValueCard
          title="Total Cash (USD)"
          value={totalCash.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          subtext="Current available cash balance"
        />
        <ValueCard
          title="All-Time P&L"
          value={allTimePL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          subtext={`${plReturn.toFixed(2)}% return on net capital`}
          valueClassName={allTimePL >= 0 ? 'text-green-400' : 'text-red-400'}
        />
      </div>

      <Card className="card-component">
        <CardHeader>
          <CardTitle>Asset Overview</CardTitle>
          <CardDescription>A breakdown of asset holdings and portfolio allocation.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold mb-4">Asset Holdings</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead className="text-right">Quantity Held</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetHoldings.map((asset) => (
                  <TableRow key={asset.name}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="text-right font-mono">{asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</TableCell>
                    <TableCell className="text-right font-mono">
                      {totalPortfolioValue > 0 ? ((asset.marketValue / totalPortfolioValue) * 100).toFixed(2) : '0.00'}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-center">
            <div style={{ minHeight: '300px', width: '100%' }}>
              <ReactApexChart options={apexTreemapOptions} series={apexTreemapSeries} type="treemap" height={350} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-component">
        <CardHeader>
          <CardTitle>Trade Performance</CardTitle>
          <CardDescription>Realized Profit &amp; Loss from individual sell transactions, shown as a percentage return.</CardDescription>
        </CardHeader>
        <CardContent>
          <ReactApexChart options={tradePerformanceOptions} series={tradePerformanceSeries} type="bar" height={350} />
        </CardContent>
      </Card>

      <Card className="card-component">
        <CardHeader>
          <CardTitle>Client Ownership</CardTitle>
          <CardDescription>Each client's stake and equity in the fund.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead className="text-right">Capital Deposited</TableHead>
                <TableHead className="text-right">Ownership</TableHead>
                <TableHead className="text-right">Current Equity Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientBreakdown.map((client) => (
                <TableRow key={client.name}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-right font-mono">{client.capitalDeposited.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                  <TableCell className="text-right font-mono">{`${client.ownershipPercentage.toFixed(2)}%`}</TableCell>
                  <TableCell className="text-right font-mono">{client.equityValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
