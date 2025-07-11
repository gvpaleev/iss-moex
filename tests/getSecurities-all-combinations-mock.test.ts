// Mock tests for getSecurities - all Engine/Market combinations
jest.mock('undici');

import { getSecurities, Engine, Market } from '../src/moex-api';

// Get mocked fetch
const undici = require('undici') as { fetch: jest.MockedFunction<typeof fetch> };
const mockFetch = undici.fetch;

// Get all engine values
const allEngines = Object.values(Engine);
// Get all market values
const allMarkets = Object.values(Market);

describe('getSecurities - All Engine/Market Combinations (Mock)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mock Tests', () => {
    // Test successful responses for all combinations
    allEngines.forEach(engine => {
      describe(`Engine: ${engine}`, () => {
        allMarkets.forEach(market => {
          it(`should construct correct URL for ${engine}/${market}`, async () => {
            const mockData = {
              securities: {
                columns: ['SECID', 'BOARDID', 'SHORTNAME'],
                data: [
                  [`TEST_${engine}_${market}`, 'BOARD1', 'Test Security']
                ]
              }
            };

            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => mockData
            } as any);

            const result = await getSecurities(engine, market, 10);

            // Verify URL construction
            expect(mockFetch).toHaveBeenCalledWith(
              expect.stringContaining(`/engines/${engine}/markets/${market}/securities.json`)
            );
            expect(mockFetch).toHaveBeenCalledWith(
              expect.stringContaining('limit=10')
            );

            // Verify result
            expect(result).toHaveLength(1);
            expect(result[0].SECID).toBe(`TEST_${engine}_${market}`);
          });

          it(`should handle empty response for ${engine}/${market}`, async () => {
            const mockData = {
              securities: {
                columns: [],
                data: []
              }
            };

            mockFetch.mockResolvedValueOnce({
              ok: true,
              json: async () => mockData
            } as any);

            const result = await getSecurities(engine, market);

            expect(result).toEqual([]);
          });

          it(`should handle HTTP errors for ${engine}/${market}`, async () => {
            mockFetch.mockResolvedValueOnce({
              ok: false,
              status: 404
            } as any);

            await expect(getSecurities(engine, market)).rejects.toThrow('HTTP error! status: 404');
          });
        });
      });
    });

    // Test with different limit values
    describe('Limit parameter tests', () => {
      const testLimits = [1, 10, 50, 100, 500];
      
      testLimits.forEach(limit => {
        it(`should use limit=${limit} in URL`, async () => {
          const mockData = {
            securities: {
              columns: ['SECID'],
              data: Array(limit).fill(['TEST'])
            }
          };

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockData
          } as any);

          await getSecurities(Engine.STOCK, Market.SHARES, limit);

          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining(`limit=${limit}`)
          );
        });
      });
    });

    // Test error handling
    describe('Error handling', () => {
      it('should handle network errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

        await expect(getSecurities(Engine.STOCK, Market.SHARES))
          .rejects.toThrow('Failed to fetch securities: Network timeout');
      });

      it('should handle malformed JSON', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => { throw new Error('Invalid JSON'); }
        } as any);

        await expect(getSecurities(Engine.STOCK, Market.SHARES))
          .rejects.toThrow('Failed to fetch securities: Invalid JSON');
      });

      it('should handle missing data structure', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ unexpected: 'structure' })
        } as any);

        const result = await getSecurities(Engine.STOCK, Market.SHARES);
        expect(result).toEqual([]);
      });

      it('should handle different HTTP error codes', async () => {
        const errorCodes = [400, 401, 403, 404, 500, 502, 503];
        
        for (const code of errorCodes) {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: code
          } as any);

          await expect(getSecurities(Engine.STOCK, Market.SHARES))
            .rejects.toThrow(`HTTP error! status: ${code}`);
        }
      });
    });

    // Test URL parameter encoding
    describe('URL construction tests', () => {
      it('should include all required query parameters', async () => {
        const mockData = {
          securities: { columns: [], data: [] }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        } as any);

        await getSecurities(Engine.STOCK, Market.SHARES, 100);

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        
        // Check for required parameters
        expect(calledUrl).toContain('iss.meta=off');
        expect(calledUrl).toContain('iss.only=securities');
        expect(calledUrl).toContain('securities.columns=');
        expect(calledUrl).toContain('start=0');
        expect(calledUrl).toContain('limit=100');
        
        // Check base URL structure
        expect(calledUrl).toMatch(/^https:\/\/iss\.moex\.com\/iss\/engines\/stock\/markets\/shares\/securities\.json\?/);
      });

      it('should include all security columns in request', async () => {
        const mockData = {
          securities: { columns: [], data: [] }
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockData
        } as any);

        await getSecurities(Engine.STOCK, Market.SHARES);

        const calledUrl = mockFetch.mock.calls[0][0] as string;
        const expectedColumns = [
          'SECID', 'BOARDID', 'SHORTNAME', 'PREVPRICE', 'LOTSIZE',
          'FACEVALUE', 'STATUS', 'BOARDNAME', 'DECIMALS', 'SECNAME',
          'REMARKS', 'MARKETCODE', 'INSTRID', 'SECTORID', 'MINSTEP',
          'PREVWAPRICE', 'FACEUNIT', 'PREVDATE', 'ISSUESIZE', 'ISIN',
          'LATNAME', 'REGNUMBER', 'PREVLEGALCLOSEPRICE', 'CURRENCYID',
          'SECTYPE', 'LISTLEVEL', 'SETTLEDATE'
        ];
        
        expectedColumns.forEach(column => {
          expect(calledUrl).toContain(column);
        });
      });
    });
  });
});

// Summary test to ensure all combinations are covered
describe('Test Coverage Summary', () => {
  it('should have tested all engine/market combinations', () => {
    const totalCombinations = allEngines.length * allMarkets.length;
    console.log(`Total Engine/Market combinations tested: ${totalCombinations}`);
    console.log(`Engines (${allEngines.length}):`, allEngines);
    console.log(`Markets (${allMarkets.length}):`, allMarkets);
    
    expect(totalCombinations).toBe(78); // 6 engines * 13 markets
  });
});
