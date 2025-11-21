/**
 * Information about a cryptocurrency
 */
export interface CoinInfo {
  id: string;        // CoinGecko API ID (e.g., 'bitcoin')
  symbol: string;    // Ticker symbol (e.g., 'btc')
  name: string;      // Full name (e.g., 'Bitcoin')
  icon: string;      // Emoji or icon identifier (e.g., '🟠')
}

/**
 * Cryptocurrency price data from API
 */
export interface CryptoPrice {
  coinId: string;      // CoinGecko API ID
  price: number;       // Current USD price
  change24h: number;   // 24-hour price change percentage
  timestamp: number;   // Unix timestamp (ms)
}

/**
 * Popular cryptocurrencies supported by the app
 */
export const COINS: CoinInfo[] = [
  { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', icon: '🟠' },
  { id: 'ethereum', symbol: 'eth', name: 'Ethereum', icon: '💎' },
  { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', icon: '🐕' },
  { id: 'litecoin', symbol: 'ltc', name: 'Litecoin', icon: '💰' },
  { id: 'ripple', symbol: 'xrp', name: 'Ripple', icon: '🌊' },
  { id: 'cardano', symbol: 'ada', name: 'Cardano', icon: '🔷' },
  { id: 'polkadot', symbol: 'dot', name: 'Polkadot', icon: '⚫' },
  { id: 'chainlink', symbol: 'link', name: 'Chainlink', icon: '🔗' },
  { id: 'stellar', symbol: 'xlm', name: 'Stellar', icon: '⭐' },
  { id: 'uniswap', symbol: 'uni', name: 'Uniswap', icon: '🦄' },
  { id: 'solana', symbol: 'sol', name: 'Solana', icon: '◎' },
  { id: 'avalanche', symbol: 'avax', name: 'Avalanche', icon: '🔺' },
  { id: 'polygon', symbol: 'matic', name: 'Polygon', icon: '🔷' },
  { id: 'cosmos', symbol: 'atom', name: 'Cosmos', icon: '⚛️' },
  { id: 'algorand', symbol: 'algo', name: 'Algorand', icon: '🔵' },
];

/**
 * Get coin info by ID
 */
export const getCoinById = (id: string): CoinInfo | undefined => {
  return COINS.find(coin => coin.id === id);
};

/**
 * Get coin info by symbol
 */
export const getCoinBySymbol = (symbol: string): CoinInfo | undefined => {
  return COINS.find(coin => coin.symbol.toLowerCase() === symbol.toLowerCase());
};

/**
 * Validate if coin ID is supported
 */
export const isSupportedCoin = (id: string): boolean => {
  return COINS.some(coin => coin.id === id);
};

