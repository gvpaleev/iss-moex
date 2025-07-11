import { getSecurities, getMarketData, getTradingSessions, Security, MarketData, Engine, Market } from '../src/moex-api';

// Mock undici
jest.mock('undici');
const { fetch: mockFetch } = require('undici') as { fetch: jest.MockedFunction<typeof fetch> };

describe('MOEX API Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSecurities', () => {
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

      mockFetch.mockResolvedValueOnce({
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyData
      } as any);

      const result = await getSecurities();

      expect(result).toEqual([]);
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      } as any);

      await expect(getSecurities()).rejects.toThrow('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getSecurities()).rejects.toThrow('Failed to fetch securities: Network error');
    });

    it('should use custom parameters', async () => {
      const mockData = {
        securities: {
          columns: ['SECID'],
          data: [['TEST']]
        }
      };

      mockFetch.mockResolvedValueOnce({
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
  });

  describe('getMarketData', () => {
    it('should return market data successfully', async () => {
      const mockMarketData = {
        marketdata: {
          columns: ['SECID', 'BOARDID', 'LAST', 'BID', 'OFFER'],
          data: [
            ['SBER', 'TQBR', 250.5, 250.0, 251.0]
          ]
        }
      };

      mockFetch.mockResolvedValueOnce({
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyData
      } as any);

      const result = await getMarketData('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      } as any);

      await getMarketData('USD000UTSTOM', Engine.CURRENCY, Market.SELT);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/engines/currency/markets/selt/securities/USD000UTSTOM.json')
      );
    });
  });

  describe('getTradingSessions', () => {
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

      mockFetch.mockResolvedValueOnce({
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEmptyData
      } as any);

      const result = await getTradingSessions();

      expect(result).toEqual([]);
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      } as any);

      await getTradingSessions(Engine.CURRENCY, Market.SELT);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/engines/currency/markets/selt/sessions.json')
      );
    });
  });

  describe('Integration tests', () => {
    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as any);

      await expect(getSecurities()).rejects.toThrow('Failed to fetch securities: Invalid JSON');
    });

    it('should handle missing response properties', async () => {
      mockFetch.mockResolvedValueOnce({
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

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      } as any);

      await getSecurities(Engine.STOCK, Market.SHARES, 10);

      const expectedUrl = 'https://iss.moex.com/iss/engines/stock/markets/shares/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,BOARDID,SHORTNAME,PREVPRICE,LOTSIZE,FACEVALUE,STATUS,BOARDNAME,DECIMALS,SECNAME,REMARKS,MARKETCODE,INSTRID,SECTORID,MINSTEP,PREVWAPRICE,FACEUNIT,PREVDATE,ISSUESIZE,ISIN,LATNAME,REGNUMBER,PREVLEGALCLOSEPRICE,CURRENCYID,SECTYPE,LISTLEVEL,SETTLEDATE&start=0&limit=10';
      
      expect(mockFetch).toHaveBeenCalledWith(expectedUrl);
    });
  });
});
