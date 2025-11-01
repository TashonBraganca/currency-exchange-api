import axios from 'axios';
import * as cheerio from 'cheerio';
import { saveQuote } from './db';

const TIMEOUT = 10000;

export interface Quote {
  buy_price: number;
  sell_price: number;
  source: string;
}

// ARS Scrapers
async function scrapeAmbito(): Promise<Quote | null> {
  try {
    const response = await axios.get('https://www.ambito.com/contenidos/dolar.html', {
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    // Look for price values in the page
    const buyPrice = parseFloat(
      $('span:contains("Compra")').next().text().trim().replace(',', '.') || '0'
    );
    const sellPrice = parseFloat(
      $('span:contains("Venta")').next().text().trim().replace(',', '.') || '0'
    );

    if (buyPrice > 0 && sellPrice > 0) {
      return { buy_price: buyPrice, sell_price: sellPrice, source: 'https://www.ambito.com/contenidos/dolar.html' };
    }
  } catch (error) {
    console.error('Ambito scrape error:', error);
  }
  return null;
}

async function scrapeDolarHoy(): Promise<Quote | null> {
  try {
    const response = await axios.get('https://www.dolarhoy.com', {
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    // DolarHoy has specific structure
    const buyPrice = parseFloat(
      $('[data-compra]').first().text().trim().replace(',', '.') || '0'
    );
    const sellPrice = parseFloat(
      $('[data-venta]').first().text().trim().replace(',', '.') || '0'
    );

    if (buyPrice > 0 && sellPrice > 0) {
      return { buy_price: buyPrice, sell_price: sellPrice, source: 'https://www.dolarhoy.com' };
    }
  } catch (error) {
    console.error('DolarHoy scrape error:', error);
  }
  return null;
}

async function scrapeCronista(): Promise<Quote | null> {
  try {
    const response = await axios.get('https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB', {
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    const buyPrice = parseFloat($('td').eq(0).text().trim().replace(',', '.') || '0');
    const sellPrice = parseFloat($('td').eq(1).text().trim().replace(',', '.') || '0');

    if (buyPrice > 0 && sellPrice > 0) {
      return { buy_price: buyPrice, sell_price: sellPrice, source: 'https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB' };
    }
  } catch (error) {
    console.error('Cronista scrape error:', error);
  }
  return null;
}

// BRL Scrapers
async function scrapeWise(): Promise<Quote | null> {
  try {
    const response = await axios.get('https://wise.com/es/currency-converter/brl-to-usd-rate', {
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    // Wise shows the exchange rate
    const rateText = $('span[data-test-id="mid-market-rate"]').text();
    const rate = parseFloat(rateText.split(' ')[0].replace(',', '.') || '0');

    if (rate > 0) {
      return { buy_price: rate, sell_price: rate, source: 'https://wise.com/es/currency-converter/brl-to-usd-rate' };
    }
  } catch (error) {
    console.error('Wise scrape error:', error);
  }
  return null;
}

async function scrapeNubank(): Promise<Quote | null> {
  try {
    const response = await axios.get('https://nubank.com.br/taxas-conversao/', {
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    const rate = parseFloat(
      $('span').filter((i, el) => $(el).text().includes('USD')).first().text().split(' ')[1] || '0'
    );

    if (rate > 0) {
      return { buy_price: rate, sell_price: rate, source: 'https://nubank.com.br/taxas-conversao/' };
    }
  } catch (error) {
    console.error('Nubank scrape error:', error);
  }
  return null;
}

async function scrapeNomadGlobal(): Promise<Quote | null> {
  try {
    const response = await axios.get('https://www.nomadglobal.com', {
      timeout: TIMEOUT,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const $ = cheerio.load(response.data);

    const rateElement = $('span:contains("BRL")').closest('div').find('span').eq(1);
    const rate = parseFloat(rateElement.text().replace(',', '.') || '0');

    if (rate > 0) {
      return { buy_price: rate, sell_price: rate, source: 'https://www.nomadglobal.com' };
    }
  } catch (error) {
    console.error('NomadGlobal scrape error:', error);
  }
  return null;
}

export async function fetchARSQuotes(): Promise<Quote[]> {
  const scrapers = [scrapeAmbito, scrapeDolarHoy, scrapeCronista];
  const quotes: Quote[] = [];

  for (const scraper of scrapers) {
    const quote = await scraper();
    if (quote) {
      quotes.push(quote);
      await saveQuote('ARS', quote.buy_price, quote.sell_price, quote.source);
    }
  }

  return quotes;
}

export async function fetchBRLQuotes(): Promise<Quote[]> {
  const scrapers = [scrapeWise, scrapeNubank, scrapeNomadGlobal];
  const quotes: Quote[] = [];

  for (const scraper of scrapers) {
    const quote = await scraper();
    if (quote) {
      quotes.push(quote);
      await saveQuote('BRL', quote.buy_price, quote.sell_price, quote.source);
    }
  }

  return quotes;
}

export async function fetchAllQuotes(): Promise<{ ARS: Quote[]; BRL: Quote[] }> {
  const [arsQuotes, brlQuotes] = await Promise.all([fetchARSQuotes(), fetchBRLQuotes()]);
  return { ARS: arsQuotes, BRL: brlQuotes };
}
