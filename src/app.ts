import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { fetchAllQuotes } from './scrapers';
import { cache } from './cache';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Types
interface Quote {
  buy_price: number;
  sell_price: number;
  source: string;
}

interface Average {
  average_buy_price: number;
  average_sell_price: number;
  currency: string;
}

interface Slippage {
  buy_price_slippage: number;
  sell_price_slippage: number;
  source: string;
}

// Helper functions
function calculateAverage(quotes: Quote[]): Average | null {
  if (quotes.length === 0) return null;

  const avgBuy = quotes.reduce((sum, q) => sum + q.buy_price, 0) / quotes.length;
  const avgSell = quotes.reduce((sum, q) => sum + q.sell_price, 0) / quotes.length;

  return {
    average_buy_price: Math.round(avgBuy * 100) / 100,
    average_sell_price: Math.round(avgSell * 100) / 100,
    currency: '',
  };
}

function calculateSlippage(quotes: Quote[], average: Average): Slippage[] {
  return quotes.map((quote) => ({
    buy_price_slippage: Math.round(((quote.buy_price - average.average_buy_price) / average.average_buy_price) * 10000) / 10000,
    sell_price_slippage: Math.round(((quote.sell_price - average.average_sell_price) / average.average_sell_price) * 10000) / 10000,
    source: quote.source,
  }));
}

// Endpoints
app.get('/quotes', async (req: Request, res: Response) => {
  try {
    const currency = (req.query.currency as string)?.toUpperCase() || 'ARS';

    // Check cache
    const cached = cache.get(`quotes_${currency}`);
    if (cached) {
      return res.json({
        currency,
        quotes: cached,
        fromCache: true,
      });
    }

    // Fetch fresh data
    const allQuotes = await fetchAllQuotes();
    const quotes = currency === 'BRL' ? allQuotes.BRL : allQuotes.ARS;

    if (quotes.length === 0) {
      return res.status(503).json({
        error: 'Unable to fetch quotes from sources',
        currency,
      });
    }

    // Cache the results
    cache.set(`quotes_${currency}`, quotes);

    res.json({
      currency,
      quotes,
      count: quotes.length,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/average', async (req: Request, res: Response) => {
  try {
    const currency = (req.query.currency as string)?.toUpperCase() || 'ARS';

    // Check cache
    const cached = cache.get(`average_${currency}`);
    if (cached) {
      return res.json({
        ...cached,
        fromCache: true,
      });
    }

    // Fetch fresh data
    const allQuotes = await fetchAllQuotes();
    const quotes = currency === 'BRL' ? allQuotes.BRL : allQuotes.ARS;

    if (quotes.length === 0) {
      return res.status(503).json({
        error: 'Unable to fetch quotes from sources',
        currency,
      });
    }

    const average = calculateAverage(quotes);
    if (!average) {
      return res.status(503).json({ error: 'Unable to calculate average' });
    }

    average.currency = currency;

    // Cache the results
    cache.set(`average_${currency}`, average);

    res.json({
      ...average,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error calculating average:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/slippage', async (req: Request, res: Response) => {
  try {
    const currency = (req.query.currency as string)?.toUpperCase() || 'ARS';

    // Check cache
    const cached = cache.get(`slippage_${currency}`);
    if (cached) {
      return res.json({
        currency,
        slippage: cached,
        fromCache: true,
      });
    }

    // Fetch fresh data
    const allQuotes = await fetchAllQuotes();
    const quotes = currency === 'BRL' ? allQuotes.BRL : allQuotes.ARS;

    if (quotes.length === 0) {
      return res.status(503).json({
        error: 'Unable to fetch quotes from sources',
        currency,
      });
    }

    const average = calculateAverage(quotes);
    if (!average) {
      return res.status(503).json({ error: 'Unable to calculate average' });
    }

    average.currency = currency;
    const slippage = calculateSlippage(quotes, average);

    // Cache the results
    cache.set(`slippage_${currency}`, slippage);

    res.json({
      currency,
      slippage,
      count: slippage.length,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error calculating slippage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Currency Exchange API',
    endpoints: {
      quotes: 'GET /quotes?currency=ARS|BRL',
      average: 'GET /average?currency=ARS|BRL',
      slippage: 'GET /slippage?currency=ARS|BRL',
      health: 'GET /health',
    },
    documentation: 'https://github.com/yourusername/currency-exchange-api',
  });
});

export default app;
