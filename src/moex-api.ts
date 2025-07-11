/**
 * Интерфейс для данных о ценной бумаге
 */
export interface Security {
  SECID: string;
  BOARDID: string;
  SHORTNAME: string;
  PREVPRICE: number;
  LOTSIZE: number;
  FACEVALUE: number;
  STATUS: string;
  BOARDNAME: string;
  DECIMALS: number;
  SECNAME: string;
  REMARKS: string;
  MARKETCODE: string;
  INSTRID: string;
  SECTORID: string;
  MINSTEP: number;
  PREVWAPRICE: number;
  FACEUNIT: string;
  PREVDATE: string;
  ISSUESIZE: number;
  ISIN: string;
  LATNAME: string;
  REGNUMBER: string;
  PREVLEGALCLOSEPRICE: number;
  CURRENCYID: string;
  SECTYPE: string;
  LISTLEVEL: number;
  SETTLEDATE: string;
}

/**
 * Интерфейс для рыночных данных
 */
export interface MarketData {
  SECID: string;
  BOARDID: string;
  BID: number;
  BIDDEPTH: number;
  OFFER: number;
  OFFERDEPTH: number;
  SPREAD: number;
  BIDDEPTHT: number;
  OFFERDEPTHT: number;
  OPEN: number;
  LOW: number;
  HIGH: number;
  LAST: number;
  LASTCHANGE: number;
  LASTCHANGEPRCNT: number;
  QTY: number;
  VALUE: number;
  VALUE_USD: number;
  WAPRICE: number;
  LASTCNGTOLASTWAPRICE: number;
  WAPTOPREVWAPRICEPRCNT: number;
  WAPTOPREVWAPRICE: number;
  CLOSEPRICE: number;
  MARKETPRICETODAY: number;
  MARKETPRICE: number;
  LASTTOPREVPRICE: number;
  NUMTRADES: number;
  VOLTODAY: number;
  VALTODAY: number;
  VALTODAY_USD: number;
  ETFSETTLEPRICE: number;
  TRADINGSTATUS: string;
  UPDATETIME: string;
  LASTBID: number;
  LASTOFFER: number;
  LCLOSEPRICE: number;
  LCURRENTPRICE: number;
  MARKETPRICE2: number;
  NUMBIDS: number;
  NUMOFFERS: number;
  CHANGE: number;
  TIME: string;
  HIGHBID: number;
  LOWOFFER: number;
  PRICEMINUSPREVWAPRICE: number;
  OPENPERIODPRICE: number;
  SEQNUM: number;
  SYSTIME: string;
  CLOSINGAUCTIONPRICE: number;
  CLOSINGAUCTIONVOLUME: number;
  ISSUECAPITALIZATION: number;
  ISSUECAPITALIZATION_UPDATETIME: string;
  ETFSETTLECURRENCY: string;
  VALTODAY_RUR: number;
  TRADINGSESSION: string;
}

import { fetch } from 'undici';

/**
 * Базовый URL для API MOEX
 */
const MOEX_API_BASE_URL = 'https://iss.moex.com/iss';

/**
 * Получает список ценных бумаг с MOEX
 * @param engine - торговая система (stock, state, currency, futures, commodity, interventions)
 * @param market - рынок (shares, bonds, ndm, otc, ccp, deposit, repo, qnv, mamc, foreignexchange, selt, psdb, mixed)
 * @param limit - количество записей (по умолчанию 100)
 * @returns Promise с массивом ценных бумаг
 */
export async function getSecurities(
  engine: string = 'stock',
  market: string = 'shares',
  limit: number = 100
): Promise<Security[]> {
  try {
    const url = `${MOEX_API_BASE_URL}/engines/${engine}/markets/${market}/securities.json?iss.meta=off&iss.only=securities&securities.columns=SECID,BOARDID,SHORTNAME,PREVPRICE,LOTSIZE,FACEVALUE,STATUS,BOARDNAME,DECIMALS,SECNAME,REMARKS,MARKETCODE,INSTRID,SECTORID,MINSTEP,PREVWAPRICE,FACEUNIT,PREVDATE,ISSUESIZE,ISIN,LATNAME,REGNUMBER,PREVLEGALCLOSEPRICE,CURRENCYID,SECTYPE,LISTLEVEL,SETTLEDATE&start=0&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    if (!data.securities || !data.securities.data) {
      return [];
    }
    
    const columns = data.securities.columns;
    const rows = data.securities.data;
    
    return rows.map((row: any[]) => {
      const security: any = {};
      columns.forEach((column: string, index: number) => {
        security[column] = row[index];
      });
      return security as Security;
    });
  } catch (error) {
    throw new Error(`Failed to fetch securities: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Получает рыночные данные для конкретной ценной бумаги
 * @param secid - идентификатор ценной бумаги
 * @param engine - торговая система (по умолчанию stock)
 * @param market - рынок (по умолчанию shares)
 * @returns Promise с рыночными данными
 */
export async function getMarketData(
  secid: string,
  engine: string = 'stock',
  market: string = 'shares'
): Promise<MarketData | null> {
  try {
    const url = `${MOEX_API_BASE_URL}/engines/${engine}/markets/${market}/securities/${secid}.json?iss.meta=off&iss.only=marketdata`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    if (!data.marketdata || !data.marketdata.data || data.marketdata.data.length === 0) {
      return null;
    }
    
    const columns = data.marketdata.columns;
    const row = data.marketdata.data[0];
    
    const marketData: any = {};
    columns.forEach((column: string, index: number) => {
      marketData[column] = row[index];
    });
    
    return marketData as MarketData;
  } catch (error) {
    throw new Error(`Failed to fetch market data for ${secid}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Получает информацию о торговых сессиях
 * @param engine - торговая система
 * @param market - рынок
 * @returns Promise с информацией о торговых сессиях
 */
export async function getTradingSessions(
  engine: string = 'stock',
  market: string = 'shares'
): Promise<any[]> {
  try {
    const url = `${MOEX_API_BASE_URL}/engines/${engine}/markets/${market}/sessions.json?iss.meta=off`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    if (!data.sessions || !data.sessions.data) {
      return [];
    }
    
    const columns = data.sessions.columns;
    const rows = data.sessions.data;
    
    return rows.map((row: any[]) => {
      const session: any = {};
      columns.forEach((column: string, index: number) => {
        session[column] = row[index];
      });
      return session;
    });
  } catch (error) {
    throw new Error(`Failed to fetch trading sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
