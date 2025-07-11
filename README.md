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

# Тестирование с мокированными данными (по умолчанию)
npm test

# Тестирование против реального API MOEX
npm run test:real

# Тестирование только с моками (явно)
npm run test:mock

# Разработка с автоматической пересборкой
npm run dev
```

### Тестирование

Библиотека поддерживает два режима тестирования:

#### Режим с мокированными данными (по умолчанию)
```bash
npm test
# или
npm run test:mock
```

В этом режиме все HTTP-запросы мокируются, что позволяет:
- Быстро выполнять тесты без сетевых запросов
- Тестировать различные сценарии ошибок
- Проверять корректность формирования URL и параметров запросов

#### Режим с реальным API
```bash
npm run test:real
```

В этом режиме тесты выполняются против реального API MOEX, что позволяет:
- Проверить актуальную работу с API
- Убедиться в корректности парсинга реальных данных
- Выявить изменения в структуре ответов API

**Особенности режима реального API:**
- Включает ограничение частоты запросов (максимум 2 одновременных запроса)
- Увеличенные таймауты для сетевых операций (10 секунд)
- Адаптивные проверки (учитывает, что рынок может быть закрыт)
- Фокус на проверке структуры данных, а не конкретных значений

## Лицензия

ISC
