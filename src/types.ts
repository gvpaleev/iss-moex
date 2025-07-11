/**
 * Enum для торговых систем MOEX
 */
export enum Engine {
  /** Фондовый рынок */
  STOCK = 'stock',
  /** Рынок государственных ценных бумаг */
  STATE = 'state',
  /** Валютный рынок */
  CURRENCY = 'currency',
  /** Срочный рынок */
  FUTURES = 'futures',
  /** Товарный рынок */
  COMMODITY = 'commodity',
  /** Товарные интервенции */
  INTERVENTIONS = 'interventions'
}

/**
 * Enum для рынков MOEX
 */
export enum Market {
  /** Рынок акций */
  SHARES = 'shares',
  /** Рынок облигаций */
  BONDS = 'bonds',
  /** Режим переговорных сделок (Negotiated Deal Market) */
  NDM = 'ndm',
  /** Внебиржевой рынок (Over The Counter) */
  OTC = 'otc',
  /** Центральный контрагент (Central Counterparty) */
  CCP = 'ccp',
  /** Депозитный рынок */
  DEPOSIT = 'deposit',
  /** Рынок сделок РЕПО */
  REPO = 'repo',
  /** Квалифицированный режим торгов (Qualified Investors Trading) */
  QNV = 'qnv',
  /** Рынок M&A и прямых инвестиций (Mergers & Acquisitions Market) */
  MAMC = 'mamc',
  /** Валютный рынок */
  FOREIGNEXCHANGE = 'foreignexchange',
  /** Система электронных лотовых торгов (System of Electronic Lot Trading) */
  SELT = 'selt',
  /** Рынок госзакупок (Public Sector Database) */
  PSDB = 'psdb',
  /** Смешанный режим торгов */
  MIXED = 'mixed'
}

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
