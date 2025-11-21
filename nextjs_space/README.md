
# 📊 Stock Insights Dashboard

A sleek, data-rich dashboard for tracking real-time stock insights for **Meta (META)** and **Nvidia (NVDA)**. Built with Next.js 14, TypeScript, and Tailwind CSS.

![Dashboard Preview](public/og-image.png)

## 🚀 Features

### Real-Time Stock Tracking
- **Price Movement**: Current prices, daily changes, 52-week high/low
- **Interactive Charts**: 30-day price movement visualization with Recharts
- **Analyst Recommendations**: Buy/Hold/Sell ratings with consensus and price targets
- **Social Sentiment**: Aggregated sentiment analysis from social media
- **Latest News**: Recent articles from credible financial sources
- **Emerging Trends**: Key factors affecting each stock
- **Daily Recommendations**: AI-generated investment guidance

### Design Highlights
- 🌙 Dark, sophisticated theme with slate/blue gradients
- 📱 Fully responsive layout
- 📈 Interactive data visualizations
- ⚡ Fast, optimized performance
- 🎨 Modern UI with Tailwind CSS and Radix UI components

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Data Format**: JSON-based

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/aldopredator/WEB.portfolio-intelligence.git
cd WEB.portfolio-intelligence

# Install dependencies
yarn install

# Run development server
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## 🏗️ Project Structure

```
├── app/
│   ├── page.tsx          # Main dashboard page
│   ├── layout.tsx        # Root layout with metadata
│   └── globals.css       # Global styles
├── components/
│   ├── price-card.tsx           # Price display component
│   ├── price-chart.tsx          # Interactive price chart
│   ├── analyst-card.tsx         # Analyst recommendations
│   ├── sentiment-card.tsx       # Social sentiment analysis
│   ├── trends-card.tsx          # Emerging trends display
│   └── recommendation-card.tsx  # Investment recommendations
├── lib/
│   ├── types.ts          # TypeScript interfaces
│   └── stock-utils.ts    # Utility functions
└── public/
    ├── stock_insights_data.json  # Stock data source
    ├── og-image.png              # Social preview image
    └── favicon.svg               # Site favicon
```

## 📊 Data Structure

The dashboard reads from `public/stock_insights_data.json` with the following structure:

```json
{
  "meta": {
    "ticker": "META",
    "company": "Meta Platforms Inc.",
    "current_price": 589.15,
    "change": 12.45,
    "change_percent": 2.16,
    "week_52_high": 638.40,
    "week_52_low": 279.44,
    "price_movements": [...],
    "analyst_recommendation": {...},
    "social_sentiment": {...},
    "latest_news": [...],
    "emerging_trends": [...]
  },
  "nvidia": {...}
}
```

## 🔄 Automatic Updates

The dashboard is configured to automatically refresh data daily at 9:00 AM PDT through an automated script:

```bash
# Manual refresh
python3 /home/ubuntu/stock_dashboard_auto_refresh.py
```

## 🚢 Deployment

The dashboard is deployed at: **[portfolio-intelligence.co.uk](https://portfolio-intelligence.co.uk)**

### Build for Production

```bash
# Create production build
yarn build

# Start production server
yarn start
```

## 📝 Environment Variables

No environment variables required for basic functionality. The dashboard reads data from the local JSON file.

## 🎨 Customization

### Adding New Stocks

1. Update `public/stock_insights_data.json` with new stock data
2. Add new sections in `app/page.tsx`
3. Reuse existing components for consistency

### Styling

- Global styles: `app/globals.css`
- Component styles: Inline Tailwind classes
- Theme colors: Configured in `tailwind.config.ts`

## 📈 Component Documentation

### Price Card
Displays current price, daily change, and 52-week range.

### Price Chart
Interactive area chart showing 30-day price movements with hover tooltips.

### Analyst Card
Visualizes analyst ratings distribution with bar chart and consensus rating.

### Sentiment Card
Pie chart showing social sentiment breakdown (positive/neutral/negative).

### Trends Card
Lists key emerging trends affecting the stock with emoji indicators.

### Recommendation Card
Generates investment recommendation (BUY/HOLD/SELL) with reasoning.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Charts powered by [Recharts](https://recharts.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Last Updated**: November 21, 2025  
**Version**: 1.0.0
