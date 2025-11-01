# Currency Exchange API

USD exchange rate aggregation service for ARS and BRL.

## Setup

```bash
npm install
npm run build
npm start
```

Environment variables (see `.env.example`):
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `PORT` (default: 3000)
- `NODE_ENV`

## Endpoints

### GET /quotes
Returns quotes from all sources for a currency.

```bash
curl http://localhost:3000/quotes?currency=ARS
```

Response:
```json
{
  "currency": "ARS",
  "quotes": [
    {
      "buy_price": 140.3,
      "sell_price": 144,
      "source": "https://www.ambito.com/contenidos/dolar.html"
    }
  ],
  "count": 3
}
```

### GET /average
Average buy/sell prices across all sources.

```bash
curl http://localhost:3000/average?currency=BRL
```

### GET /slippage
Percentage deviation of each source from average.

```bash
curl http://localhost:3000/slippage?currency=ARS
```

### GET /health
Health check endpoint.

## Data Sources

**ARS:**
- https://www.ambito.com/contenidos/dolar.html
- https://www.dolarhoy.com
- https://www.cronista.com/MercadosOnline/moneda.html?id=ARSB

**BRL:**
- https://wise.com/es/currency-converter/brl-to-usd-rate
- https://nubank.com.br/taxas-conversao/
- https://www.nomadglobal.com

## Local Development

```bash
docker-compose up
```

Starts PostgreSQL and Node.js API on port 3000.

## Deployment

Push to GitHub and deploy on Render.com or Railway.

## License

MIT
