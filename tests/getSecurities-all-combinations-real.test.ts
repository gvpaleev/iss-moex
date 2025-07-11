// Real API tests for getSecurities - all Engine/Market combinations
import { getSecurities, Engine, Market } from '../src/moex-api';

// Simple rate limiter for real API calls
class SimpleRateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private maxConcurrent: number;
  private delay: number;

  constructor(maxConcurrent: number, delay: number = 100) {
    this.maxConcurrent = maxConcurrent;
    this.delay = delay;
  }

  async limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await fn();
          // Add delay between requests
          await new Promise(r => setTimeout(r, this.delay));
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.running--;
          this.processQueue();
        }
      });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.running < this.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

// Initialize rate limiter
const limit = new SimpleRateLimiter(1, 200); // 1 request at a time with 200ms delay

// Helper function to wrap API calls with rate limiting
const rateLimitedCall = <T>(apiCall: () => Promise<T>): Promise<T> => {
  return limit.limit(() => apiCall());
};

// Get all engine values
const allEngines = Object.values(Engine);
// Get all market values
const allMarkets = Object.values(Market);

// Track valid and invalid combinations
const validCombinations: Array<{ engine: Engine; market: Market }> = [];
const invalidCombinations: Array<{ engine: Engine; market: Market; error: string }> = [];

describe('getSecurities - All Engine/Market Combinations (Real API)', () => {
  describe('Real API Tests', () => {
    // Test each engine
    allEngines.forEach(engine => {
      describe(`Engine: ${engine}`, () => {
        allMarkets.forEach(market => {
          it(`should handle ${engine}/${market} combination`, async () => {
            try {
              const result = await rateLimitedCall(() => getSecurities(engine, market, 5));
              
              // Should always return an array
              expect(Array.isArray(result)).toBe(true);
              
              // Track valid combination
              validCombinations.push({ engine, market });
              
              // If we got data, verify structure
              if (result.length > 0) {
                const security = result[0];
                expect(security).toHaveProperty('SECID');
                expect(security).toHaveProperty('BOARDID');
                expect(typeof security.SECID).toBe('string');
                expect(typeof security.BOARDID).toBe('string');
                
                // Log first security for reference
                console.log(`✓ ${engine}/${market}: Found ${result.length} securities (e.g., ${security.SECID})`);
              } else {
                console.log(`✓ ${engine}/${market}: Valid but empty (0 securities)`);
              }
            } catch (error) {
              // Some combinations might return 404 or other errors
              // This is expected for invalid engine/market combinations
              expect(error).toBeInstanceOf(Error);
              if (error instanceof Error) {
                expect(error.message).toMatch(/Failed to fetch securities|HTTP error/);
                
                // Track invalid combination
                invalidCombinations.push({ engine, market, error: error.message });
                console.log(`✗ ${engine}/${market}: ${error.message}`);
              }
            }
          }, 30000); // Increased timeout for real API calls
        });
      });
    });

    // Test specific known valid combinations with more detail
    describe('Known Valid Combinations', () => {
      const knownValidPairs = [
        { engine: Engine.STOCK, market: Market.SHARES, expectedSecurities: ['SBER', 'GAZP'] },
        { engine: Engine.STOCK, market: Market.BONDS, expectedSecurities: ['RU000A0JXN21'] },
        { engine: Engine.CURRENCY, market: Market.SELT, expectedSecurities: ['USD000UTSTOM'] },
      ];

      knownValidPairs.forEach(({ engine, market, expectedSecurities }) => {
        it(`should return data for ${engine}/${market}`, async () => {
          const result = await rateLimitedCall(() => getSecurities(engine, market, 100));
          
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBeGreaterThan(0);
          
          // Check if we can find some expected securities
          const secids = result.map(s => s.SECID);
          const foundExpected = expectedSecurities.filter(sec => secids.includes(sec));
          
          console.log(`${engine}/${market}: Found ${result.length} securities, including: ${foundExpected.join(', ')}`);
          
          // Verify data structure in detail
          const firstSecurity = result[0];
          expect(firstSecurity).toMatchObject({
            SECID: expect.any(String),
            BOARDID: expect.any(String),
            SHORTNAME: expect.any(String),
          });
        }, 30000);
      });
    });

    // Test with different limits
    describe('Limit Parameter Tests', () => {
      const limits = [1, 5, 10, 50];
      
      limits.forEach(limit => {
        it(`should respect limit=${limit} for stock/shares`, async () => {
          const result = await rateLimitedCall(() => getSecurities(Engine.STOCK, Market.SHARES, limit));
          
          expect(Array.isArray(result)).toBe(true);
          expect(result.length).toBeLessThanOrEqual(limit);
          
          if (result.length > 0) {
            console.log(`Limit ${limit}: Returned ${result.length} securities`);
          }
        }, 30000);
      });
    });
  });

  // Summary of results
  describe('Test Results Summary', () => {
    it('should report valid and invalid combinations', () => {
      console.log('\n=== SUMMARY ===');
      console.log(`Total combinations tested: ${allEngines.length * allMarkets.length}`);
      console.log(`Valid combinations: ${validCombinations.length}`);
      console.log(`Invalid combinations: ${invalidCombinations.length}`);
      
      if (validCombinations.length > 0) {
        console.log('\nValid combinations:');
        validCombinations.forEach(({ engine, market }) => {
          console.log(`  - ${engine}/${market}`);
        });
      }
      
      if (invalidCombinations.length > 0) {
        console.log('\nInvalid combinations:');
        const errorGroups = invalidCombinations.reduce((acc, { engine, market, error }) => {
          const errorType = error.includes('404') ? 'HTTP 404' : 'Other error';
          if (!acc[errorType]) acc[errorType] = [];
          acc[errorType].push(`${engine}/${market}`);
          return acc;
        }, {} as Record<string, string[]>);
        
        Object.entries(errorGroups).forEach(([errorType, combinations]) => {
          console.log(`  ${errorType}: ${combinations.length} combinations`);
          combinations.slice(0, 5).forEach(combo => console.log(`    - ${combo}`));
          if (combinations.length > 5) {
            console.log(`    ... and ${combinations.length - 5} more`);
          }
        });
      }
    });
  });
});

// Performance test
describe('Performance Tests', () => {
  it('should handle multiple concurrent requests efficiently', async () => {
    const startTime = Date.now();
    const requests = [
      getSecurities(Engine.STOCK, Market.SHARES, 5),
      getSecurities(Engine.STOCK, Market.BONDS, 5),
      getSecurities(Engine.CURRENCY, Market.SELT, 5),
    ];
    
    const results = await Promise.all(requests.map(req => rateLimitedCall(() => req)));
    const endTime = Date.now();
    
    results.forEach(result => {
      expect(Array.isArray(result)).toBe(true);
    });
    
    console.log(`Completed 3 concurrent requests in ${endTime - startTime}ms`);
    expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
  }, 15000);
});
