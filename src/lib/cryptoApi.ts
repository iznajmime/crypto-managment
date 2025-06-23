import { fetchCryptoPrices, fetchHistoricalPrice, fetchHistoricalChartData } from '@/lib/cryptoApi';
const API_BASE_URL = 'https://api.coingecko.com/api/v3';

// A mapping from asset symbols (like 'BTC') to CoinGecko API IDs (like 'bitcoin')
const ASSET_ID_MAP: { [key: string]: string } = {
  btc: 'bitcoin',
  eth: 'ethereum',
  sol: 'solana',
  // Add other assets here as needed
};

/**
 * Fetches the current market price for a list of assets.
 * @param assets - An array of asset symbols (e.g., ['btc', 'eth']).
 * @returns A promise that resolves to an object mapping asset symbols to their USD price.
 */
export const fetchCryptoPrices = async (assets: string[]): Promise<{ [key: string]: number }> => {
  const ids = assets.map(asset => ASSET_ID_MAP[asset.toLowerCase()]).filter(Boolean).join(',');
  if (!ids) return {};

  try {
    const response = await fetch(`${API_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd`);
    if (!response.ok) {
      throw new Error(`CoinGecko API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    
    // The API returns prices keyed by ID, so we map them back to symbols
    const prices: { [key: string]: number } = {};
    for (const asset of assets) {
      const id = ASSET_ID_MAP[asset.toLowerCase()];
      if (id && data[id]) {
        prices[asset.toLowerCase()] = data[id].usd;
      }
    }
    return prices;
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
    return {};
  }
};

/**
 * Fetches the historical price of a single asset on a specific date.
 * @param asset - The asset symbol (e.g., 'btc').
 * @param date - The date for which to fetch the price.
 * @returns A promise that resolves to the price in USD.
 */
export const fetchHistoricalPrice = async (asset: string, date: Date): Promise<number> => {
  const id = ASSET_ID_MAP[asset.toLowerCase()];
  if (!id) return 0;

  const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

  try {
    const response = await fetch(`${API_BASE_URL}/coins/${id}/history?date=${dateString}&localization=false`);
    if (!response.ok) {
      // CoinGecko might return 404 if no data is available for that day, which is fine.
      if (response.status === 404) return 0;
      throw new Error(`CoinGecko API request failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data.market_data?.current_price?.usd || 0;
  } catch (error) {
    console.error(`Failed to fetch historical price for ${asset}:`, error);
    return 0;
  }
};

/**
 * Fetches historical market data (prices) for a single asset over a number of days.
 * @param asset - The asset symbol (e.g., 'btc').
 * @param days - The number of days of data to retrieve.
 * @returns A promise that resolves to an array of [timestamp, price] tuples.
 */
export const fetchHistoricalChartData = async (asset: string, days: number = 90): Promise<[number, number][]> => {
  const id = ASSET_ID_MAP[asset.toLowerCase()];
  if (!id) return [];

  try {
    // Fetching with a daily interval reduces the data points
    const response = await fetch(`${API_BASE_URL}/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=daily`);
    if (!response.ok) {
      throw new Error(`CoinGecko API request failed for market_chart: ${response.statusText}`);
    }
    const data = await response.json();
    return data.prices || [];
  } catch (error) {
    console.error(`Failed to fetch historical chart data for ${asset}:`, error);
    return [];
  }
};
