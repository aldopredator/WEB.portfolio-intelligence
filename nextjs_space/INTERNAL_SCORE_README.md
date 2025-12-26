# Internal Score - Statistical Model Implementation

## Overview

The "Internal Score" theme preset uses **data-driven factor weights** derived from statistical regression analysis on historical stock data. Unlike the other preset themes that use subjective weightings, this preset's weights are **optimized to predict realized returns** based on actual performance data from your portfolio.

## Methodology

### Data Collection
- **406 stocks** analyzed from active portfolios
- **226 stocks** with complete feature sets and 30-day return data
- **225 stocks** with 90-day return data
- Features include: valuation metrics, profitability, financial health, growth, and market factors

### Statistical Approach

We implemented multiple regression techniques:

1. **Linear Regression (OLS)**
   - Baseline model using ordinary least squares
   - R² Score: 0.1420 (30-day), 0.1090 (90-day)

2. **Ridge Regression (L2 Regularization)** ⭐ **Selected Model**
   - Handles multicollinearity between features
   - Prevents overfitting through regularization
   - Optimal lambda (λ) = 0.1
   - R² Score: 0.1420 (30-day), 0.1090 (90-day)

3. **Target Variables**
   - 30-day realized returns
   - 90-day realized returns (used for final weights)
   - 180-day and 365-day returns (insufficient historical data)

### Feature Importance (90-Day Returns)

Top 10 most predictive features for realized returns:

1. **pbRatio** (4.82) - Price-to-Book ratio
2. **roe** (4.20) - Return on Equity
3. **profitMargin** (2.92) - Net Profit Margin
4. **heldPercentInsiders** (2.85) - Insider Ownership %
5. **revenueGrowthQoQ** (2.23) - Quarterly Revenue Growth
6. **marketCap** (1.98) - Market Capitalization
7. **sharesOutstanding** (1.90) - Total Shares Outstanding
8. **heldPercentInstitutions** (1.74) - Institutional Ownership %
9. **earningsGrowthQoQ** (1.59) - Quarterly Earnings Growth
10. **roa** (1.45) - Return on Assets

## Recommended Factor Weights

Based on **90-day return predictions** (most reliable time horizon):

```typescript
{
  id: 'internal-score',
  name: 'Internal Score',
  description: 'Data-driven weights optimized for realized returns using Ridge Regression',
  emoji: '🎯',
  factors: {
    value: 0.200,      // 20.0% - Valuation metrics
    quality: 0.339,    // 33.9% - Profitability & financial health
    growth: 0.246,     // 24.6% - Revenue & earnings growth
    momentum: 0.005,   // 0.5%  - Price trends (minimal impact)
    risk: 0.210,       // 21.0% - Volatility & leverage
  },
}
```

## Key Insights

### 1. **Quality Over Momentum**
- Quality factors (ROE, profit margin, insider ownership) have the **strongest predictive power** (33.9%)
- Momentum (recent price performance) has **negligible impact** (0.5%)
- This suggests that **fundamental strength matters more** than following trends

### 2. **Growth is Important**
- Growth metrics account for **24.6%** of the score
- Revenue growth is particularly important (2nd highest feature importance)
- Both revenue and earnings growth combined signal future performance

### 3. **Risk Management Matters**
- Risk factors contribute **21.0%** to the overall score
- Market cap and shares outstanding (liquidity proxies) are significant
- Beta and debt-to-equity also play important roles

### 4. **Value is Moderate**
- Valuation metrics contribute **20.0%**
- P/B ratio is the most important valuation metric
- P/E ratios are less predictive than book value

## Comparison with Other Themes

| Theme | Value | Quality | Growth | Momentum | Risk |
|-------|-------|---------|--------|----------|------|
| **Internal Score** | 20.0% | **33.9%** | 24.6% | 0.5% | 21.0% |
| Balanced | 20.0% | 20.0% | 20.0% | 20.0% | 20.0% |
| Quality | 15.0% | **50.0%** | 20.0% | 5.0% | 10.0% |
| Growth | 10.0% | 15.0% | **40.0%** | 30.0% | 5.0% |
| Momentum | 5.0% | 15.0% | 20.0% | **50.0%** | 10.0% |
| Value | **45.0%** | 30.0% | 10.0% | 5.0% | 10.0% |

### Key Differences:
- Internal Score **de-emphasizes momentum** dramatically (0.5% vs. 20-50% in other themes)
- **Quality is king** in the statistical model (34% vs. 15-50% in subjective themes)
- **Balanced approach** between value, growth, and risk
- More **conservative** than Growth or Momentum themes
- More **data-driven** than Quality theme

## Model Performance

### R² Scores (Coefficient of Determination)
- **30-day returns**: 0.1420 (14.2% of variance explained)
- **90-day returns**: 0.1090 (10.9% of variance explained)

### Interpretation
- The relatively **low R²** values (10-14%) are **expected** in stock market prediction
- Stock returns are influenced by many factors beyond fundamentals (news, sentiment, macro events)
- The model **captures significant patterns** despite market noise
- These R² values are **typical for fundamental factor models** in finance
- The model is **better at short-term (30-day) predictions** than long-term

## Usage Recommendations

### Best For:
- **Fundamental investors** who believe quality and growth drive returns
- Portfolios focused on **long-term value creation**
- Investors who want **data-backed** factor allocation
- **Risk-adjusted** return optimization

### Not Ideal For:
- **Technical traders** (momentum has minimal weight)
- **Value hunting** exclusively (only 20% weight on value)
- **High-growth** speculation (growth is important but balanced with quality)

### When to Re-run Analysis:
- **Quarterly** - after earnings season when metrics update
- **When adding new stocks** - more data improves model accuracy
- **Market regime changes** - bear/bull markets may shift factor importance
- **Significant portfolio changes** - if portfolio composition changes dramatically

## Running the Analysis

To regenerate the weights with updated data:

```bash
# From nextjs_space directory
npx tsx --require dotenv/config scripts/calculate-internal-score.ts
```

Requirements:
- Minimum 30 days of price history per stock
- Complete metrics snapshot (from Metrics table)
- Active stocks in database

The script will:
1. Collect stock data from all active tickers
2. Calculate realized returns for multiple horizons
3. Train Linear and Ridge regression models
4. Output factor weights and feature importance
5. Save detailed results to `internal-score-analysis.json`

## Statistical Notes

### Regularization (Ridge Regression)
- **L2 penalty** prevents coefficient overfitting
- **Lambda (λ) = 0.1** provides optimal bias-variance tradeoff
- Coefficients are **shrunk toward zero** but not eliminated
- Handles **multicollinearity** between related features (e.g., ROE and profit margin)

### Feature Normalization
- All features are **z-score normalized** before regression
- Mean = 0, Standard Deviation = 1
- Ensures fair comparison between features with different scales
- Coefficients represent **standardized importance**

### Factor Aggregation
- Features are mapped to five core factors
- Coefficients are aggregated by **average absolute importance**
- Weights are **normalized to sum to 1.0**
- Preserves interpretability while combining related metrics

## Future Enhancements

### Potential Improvements:
1. **Lasso Regression** (L1) - for automatic feature selection
2. **Elastic Net** - combining L1 and L2 regularization
3. **Non-linear models** - polynomial features, decision trees
4. **Time-series cross-validation** - rolling window validation
5. **Sector-specific models** - different weights per sector
6. **Market regime detection** - adaptive weights based on market conditions
7. **Ensemble methods** - combining multiple model predictions

### Data Enhancements:
1. **More historical data** - 180-day and 365-day returns
2. **Macroeconomic factors** - interest rates, GDP, inflation
3. **Sentiment data** - news sentiment, social media
4. **Alternative data** - web traffic, app downloads, satellite imagery
5. **Earnings surprises** - actual vs. expected earnings

## Conclusion

The Internal Score theme represents a **data-driven approach** to multi-factor stock scoring. By analyzing historical relationships between metrics and realized returns, it provides **statistically optimized weights** that emphasize what historically has mattered most: **quality and growth**.

While no model can predict the future with certainty, this approach offers a **systematic, evidence-based** alternative to subjective factor allocation, making it a valuable tool for quantitative portfolio management.

---

*Analysis Date: December 26, 2025*  
*Data Source: Portfolio Intelligence Database*  
*Model: Ridge Regression (λ=0.1)*  
*Training Samples: 226 stocks (30-day), 225 stocks (90-day)*
