import { useState } from 'react';
import { cryptoService, type CryptoPrice } from '../../services';
import './CryptoServiceTest.css';

export function CryptoServiceTest() {
  const [result, setResult] = useState<CryptoPrice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string>('');
  const [testCoinId, setTestCoinId] = useState('bitcoin');

  const testFetch = async (coinId: string, isCachedTest = false) => {
    setLoading(true);
    setError(null);
    setCacheStatus('');
    const startTime = Date.now();

    try {
      const priceData = await cryptoService.fetchPrice(coinId);
      const duration = Date.now() - startTime;

      if (priceData) {
        setResult(priceData);
        if (isCachedTest) {
          if (duration < 100) {
            setCacheStatus('✅ Cache hit (fast response)');
          } else {
            setCacheStatus('⚠️ Cache miss (API call made)');
          }
        }
      } else {
        setError('Failed to fetch price data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testCache = async () => {
    // First call - should hit API
    await testFetch(testCoinId, false);
    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Second call - should hit cache
    await testFetch(testCoinId, true);
  };

  const clearCache = () => {
    cryptoService.clearCache(testCoinId);
    setCacheStatus('Cache cleared');
    setResult(null);
  };

  return (
    <div className="cryptoServiceTest">
      <h2>CryptoService Test</h2>
      
      <div className="testControls">
        <label>
          Coin ID:
          <input
            type="text"
            value={testCoinId}
            onChange={(e) => setTestCoinId(e.target.value)}
            placeholder="bitcoin, ethereum, etc."
          />
        </label>
        
        <div className="buttonGroup">
          <button onClick={() => testFetch(testCoinId)} disabled={loading}>
            {loading ? 'Loading...' : 'Fetch Price'}
          </button>
          <button onClick={testCache} disabled={loading}>
            Test Cache
          </button>
          <button onClick={clearCache}>Clear Cache</button>
        </div>
      </div>

      {cacheStatus && (
        <div className="cacheStatus">{cacheStatus}</div>
      )}

      {error && (
        <div className="error">Error: {error}</div>
      )}

      {result && (
        <div className="result">
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
          <div className="resultDetails">
            <p><strong>Coin:</strong> {result.coinId}</p>
            <p><strong>Price:</strong> ${result.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>24h Change:</strong> {result.change24h >= 0 ? '+' : ''}{result.change24h.toFixed(2)}%</p>
            <p><strong>Timestamp:</strong> {new Date(result.timestamp).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

