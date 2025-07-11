# ISS MOEX API Library

TypeScript библиотека для работы с API Московской биржи (MOEX ISS).

## Установка

```bash
npm install iss-moex
```

## Использование

```typescript
import { getSecurities, getMarketData, getTradingSessions } from 'iss-moex';

// Получение списка ценных бумаг
const securities = await getSecurities('stock', 'shares', 10);
console.log(securities);

// Получение рыночных данных для конкретной ценной бумаги
const marketData = await getMarketData('SBER');
console.log(marketData);

// Получение информации о торговых сессиях
const sessions = await getTradingSessions('stock', 'shares');
console.log(sessions);
```

## API

### getSecurities(engine?, market?, limit?)

Получает список ценных бумаг с MOEX.

**Параметры:**
- `engine` (string, optional) - торговая система (по умолчанию 'stock')
- `market` (string, optional) - рынок (по умолчанию 'shares')  
- `limit` (number, optional) - количество записей (по умолчанию 100)

**Возвращает:** `Promise<Security[]>`

### getMarketData(secid, engine?, market?)

Получает рыночные данные для конкретной ценной бумаги.

**Параметры:**
- `secid` (string) - идентификатор ценной бумаги
- `engine` (string, optional) - торговая система (по умолчанию 'stock')
- `market` (string, optional) - рынок (по умолчанию 'shares')

**Возвращает:** `Promise<MarketData | null>`

### getTradingSessions(engine?, market?)

Получает информацию о торговых сессиях.

**Параметры:**
- `engine` (string, optional) - торговая система (по умолчанию 'stock')
- `market` (string, optional) - рынок (по умолчанию 'shares')

**Возвращает:** `Promise<any[]>`

## Типы данных

### Security

Интерфейс для данных о ценной бумаге, включает поля:
- `SECID` - идентификатор ценной бумаги
- `SHORTNAME` - краткое наименование
- `PREVPRICE` - цена предыдущего дня
- И другие поля согласно API MOEX

### MarketData

Интерфейс для рыночных данных, включает поля:
- `LAST` - цена последней сделки
- `BID` - лучшая цена покупки
- `OFFER` - лучшая цена продажи
- И другие поля согласно API MOEX

## Разработка

```bash
# Установка зависимостей
npm install

# Сборка
npm run build

# Тестирование
npm test

# Разработка с автоматической пересборкой
npm run dev
```

## Лицензия

ISC
