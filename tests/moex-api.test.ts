// Check if we should use real API
const USE_REAL_API = process.env.USE_REAL_API === 'true';

// Conditional mocking - only mock when not using real API
if (!USE_REAL_API) {
  jest.mock('undici');
}

import { getSecurities, getMarketData, getTradingSessions, Security, MarketData, Engine, Market } from '../src/moex-api';

// Simple rate limiter for real API calls (max 2 concurrent requests)
class SimpleRateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  async limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          this.running++;
          const result = await fn();
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

let limit: SimpleRateLimiter | undefined;

// Initialize rate limiter only for real API tests
if (USE_REAL_API) {
  limit = new SimpleRateLimiter(2);
}

// Get mocked fetch only if not using real API
let mockFetch: jest.MockedFunction<typeof fetch> | undefined;
if (!USE_REAL_API) {
  const undici = require('undici') as { fetch: jest.MockedFunction<typeof fetch> };
  mockFetch = undici.fetch;
}

// Helper function to wrap API calls with rate limiting for real API
const rateLimitedCall = <T>(apiCall: () => Promise<T>): Promise<T> => {
  if (USE_REAL_API && limit) {
    return limit.limit(() => apiCall());
  }
  return apiCall();
};

describe('MOEX API Library', () => {
  beforeEach(() => {
    if (!USE_REAL_API && mockFetch) {
      jest.clearAllMocks();
    }
  });

  describe('getSecurities', () => {
    if (USE_REAL_API) {
      // Real API tests
      it('should return securities data from real API', async () => {
        const result = await rateLimitedCall(() => getSecurities(Engine.STOCK, Market.SHARES, 5));
        
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('SECID');
          expect(result[0]).toHaveProperty('BOARDID');
          expect(typeof result[0].SECID).toBe('string');
        }
      }, 10000);

      it('should return market data for SBER from real API', async () => {
        const result = await rateLimitedCall(() => getMarketData('SBER'));
        
        if (result) {
          expect(result).toHaveProperty('SECID');
          expect(result.SECID).toBe('SBER');
        }
        // Note: result can be null if market is closed or security not found
      }, 10000);

      it('should return trading sessions from real API', async () => {
        const result = await rateLimitedCall(() => getTradingSessions());
        
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('BOARDID');
        }
      }, 10000);

      it('should handle custom parameters with real API', async () => {
        const result = await rateLimitedCall(() => getSecurities(Engine.CURRENCY, Market.SELT, 3));
        
        expect(Array.isArray(result)).toBe(true);
        // Should not throw errors with valid parameters
      }, 10000);
    } else {
      // Mock tests
      it('should return securities data successfully', async () => {
        const mockSecuritiesData = {
          securities: {
            columns: ['SECID', 'BOARDID', 'SHORTNAME', 'PREVPRICE'],
            data: [
              ['SBER', 'TQBR', 'Сбербанк', 250.5],
              ['GAZP', 'TQBR', 'Газпром', 180.2]
            ]
          }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSecuritiesData
        } as any);

        const result = await getSecurities();

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          SECID: 'SBER',
          BOARDID: 'TQBR',
          SHORTNAME: 'Сбербанк',
          PREVPRICE: 250.5
        });
        expect(result[1]).toEqual({
          SECID: 'GAZP',
          BOARDID: 'TQBR',
          SHORTNAME: 'Газпром',
          PREVPRICE: 180.2
        });
      });

      it('should return empty array when no securities data', async () => {
        const mockEmptyData = {
          securities: {
            columns: [],
            data: []
          }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyData
        } as any);

        const result = await getSecurities();

        expect(result).toEqual([]);
      });

      it('should handle HTTP errors', async () => {
        mockFetch!.mockResolvedValueOnce({
          ok: false,
          status: 404
        } as any);

        await expect(getSecurities()).rejects.toThrow('HTTP error! status: 404');
      });

      it('should handle network errors', async () => {
        mockFetch!.mockRejectedValueOnce(new Error('Network error'));

        await expect(getSecurities()).rejects.toThrow('Failed to fetch securities: Network error');
      });

      it('should use custom parameters', async () => {
        const mockData = {
          securities: {
            columns: ['SECID'],
            data: [['TEST']]
          }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        } as any);

        await getSecurities(Engine.CURRENCY, Market.SELT, 50);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/engines/currency/markets/selt/securities.json')
        );
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=50')
        );
      });
    }
  });

  describe('getMarketData', () => {
    if (USE_REAL_API) {
      // Real API tests
      it('should return market data for popular security from real API', async () => {
        const result = await rateLimitedCall(() => getMarketData('SBER'));
        
        // Market data can be null when market is closed
        if (result) {
          expect(result).toHaveProperty('SECID');
          expect(result.SECID).toBe('SBER');
        }
      }, 10000);

      it('should handle custom engine and market parameters with real API', async () => {
        const result = await rateLimitedCall(() => getMarketData('USD000UTSTOM', Engine.CURRENCY, Market.SELT));
        
        // Should not throw errors with valid parameters
        if (result) {
          expect(result).toHaveProperty('SECID');
        }
      }, 10000);
    } else {
      // Mock tests
      it('should return market data successfully', async () => {
        const mockMarketData = {
          marketdata: {
            columns: ['SECID', 'BOARDID', 'LAST', 'BID', 'OFFER'],
            data: [
              ['SBER', 'TQBR', 250.5, 250.0, 251.0]
            ]
          }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockMarketData
        } as any);

        const result = await getMarketData('SBER');

        expect(result).toEqual({
          SECID: 'SBER',
          BOARDID: 'TQBR',
          LAST: 250.5,
          BID: 250.0,
          OFFER: 251.0
        });
      });

      it('should return null when no market data', async () => {
        const mockEmptyData = {
          marketdata: {
            columns: [],
            data: []
          }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyData
        } as any);

        const result = await getMarketData('NONEXISTENT');

        expect(result).toBeNull();
      });

      it('should handle HTTP errors', async () => {
        mockFetch!.mockResolvedValueOnce({
          ok: false,
          status: 500
        } as any);

        await expect(getMarketData('SBER')).rejects.toThrow('HTTP error! status: 500');
      });

      it('should use custom engine and market parameters', async () => {
        const mockData = {
          marketdata: {
            columns: ['SECID'],
            data: [['USD000UTSTOM']]
          }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        } as any);

        await getMarketData('USD000UTSTOM', Engine.CURRENCY, Market.SELT);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/engines/currency/markets/selt/securities/USD000UTSTOM.json')
        );
      });
    }
  });

  describe('getTradingSessions', () => {
    if (USE_REAL_API) {
      // Real API tests
      it('should return trading sessions from real API', async () => {
        const result = await rateLimitedCall(() => getTradingSessions());
        
        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty('BOARDID');
        }
      }, 10000);

      it('should handle custom engine and market parameters with real API', async () => {
        const result = await rateLimitedCall(() => getTradingSessions(Engine.CURRENCY, Market.SELT));
        
        expect(Array.isArray(result)).toBe(true);
        // Should not throw errors with valid parameters
      }, 10000);
    } else {
      // Mock tests
      it('should return trading sessions successfully', async () => {
        const mockSessionsData = {
          sessions: {
            columns: ['BOARDID', 'BOARD_TITLE', 'IS_PRIMARY'],
            data: [
              ['TQBR', 'Т+: Акции и ДР - безадрес.', 1],
              ['TQTF', 'Т+: ETF - безадрес.', 0]
            ]
          }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockSessionsData
        } as any);

        const result = await getTradingSessions();

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          BOARDID: 'TQBR',
          BOARD_TITLE: 'Т+: Акции и ДР - безадрес.',
          IS_PRIMARY: 1
        });
      });

      it('should return empty array when no sessions data', async () => {
        const mockEmptyData = {
          sessions: {
            columns: [],
            data: []
          }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockEmptyData
        } as any);

        const result = await getTradingSessions();

        expect(result).toEqual([]);
      });

      it('should handle HTTP errors', async () => {
        mockFetch!.mockResolvedValueOnce({
          ok: false,
          status: 403
        } as any);

        await expect(getTradingSessions()).rejects.toThrow('HTTP error! status: 403');
      });

      it('should use custom engine and market parameters', async () => {
        const mockData = {
          sessions: {
            columns: ['BOARDID'],
            data: [['CETS']]
          }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        } as any);

        await getTradingSessions(Engine.CURRENCY, Market.SELT);

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/engines/currency/markets/selt/sessions.json')
        );
      });
    }
  });

  if (!USE_REAL_API) {
    describe('Integration tests (Mock only)', () => {
      it('should handle malformed JSON response', async () => {
        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => { throw new Error('Invalid JSON'); }
        } as any);

        await expect(getSecurities()).rejects.toThrow('Failed to fetch securities: Invalid JSON');
      });

      it('should handle missing response properties', async () => {
        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => ({})
        } as any);

        const result = await getSecurities();
        expect(result).toEqual([]);
      });

      it('should construct correct URLs with parameters', async () => {
        const mockData = {
          securities: { columns: [], data: [] }
        };

        mockFetch!.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        } as any);

        await getSecurities(Engine.STOCK, Market.SHARES, 10);

        const expectedUrl = 'https://iss.moex.com/iss/engines/stock/markets/shares/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,BOARDID,SHORTNAME,PREVPRICE,LOTSIZE,FACEVALUE,STATUS,BOARDNAME,DECIMALS,SECNAME,REMARKS,MARKETCODE,INSTRID,SECTORID,MINSTEP,PREVWAPRICE,FACEUNIT,PREVDATE,ISSUESIZE,ISIN,LATNAME,REGNUMBER,PREVLEGALCLOSEPRICE,CURRENCYID,SECTYPE,LISTLEVEL,SETTLEDATE&start=0&limit=10';
        
        expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
      });
    });
  }
});
