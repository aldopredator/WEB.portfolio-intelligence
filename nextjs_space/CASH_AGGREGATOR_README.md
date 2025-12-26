# Cash Aggregator - Documentation

## Overview

The **Cash Aggregator** is a new feature that allows you to upload broker/bank statements and automatically categorize cash flows into meaningful buckets for analysis.

## Location

Access via: **Navigation Menu → Cash Aggregator**

File Location:
- Page: `app/cash-aggregator/page.tsx`
- Client Component: `app/cash-aggregator/CashAggregatorClient.tsx`

## Features

### 1. File Upload
- **Supported Formats**: Excel (.xlsx, .xls) and CSV files
- **Upload Methods**: 
  - Drag & drop
  - Click to browse
- **Data Persistence**: Statements are saved in browser localStorage

### 2. Automatic Categorization

Transactions are automatically categorized based on text patterns in the "Details" column:

| Category | Matching Patterns | Examples |
|----------|------------------|----------|
| **FASTER Payment Withdrawal** | "faster payment" + withdrawn amount | FASTER Payment In |
| **Bought (Securities)** | "bought", "buy" | Order Id 45008786 - Bought 1 Chubb Limited |
| **Sold (Securities)** | "sold", "sell" | Order Id 44995066 - Bought 3 Rocket Lab |
| **Online Transaction Fee** | "online transaction fee" | Online transaction fee VanEck Quantum Computing |
| **International Trading Charge** | "international trading charge" | International Trading Charge Chubb Limited |
| **FX Charge** | "fx charge" | Fx Charge Chubb Limited Common Stock BUY |
| **Customer Fee** | "customer fee" | Customer fee on Investment Verified |
| **Interest** | "interest" | Interest payment |
| **Dividend** | "dividend" | Dividend payment from stock |
| **Fund Distribution** | "fund distribution" | ETF distribution payment |
| **Other/Unclassified** | All other transactions | Misc transactions |

### 3. Summary Dashboard

Displays:
- **Category Totals**: Each category with its total amount
- **Visual Indicators**: 
  - 🔴 Red for outflows (negative amounts)
  - 🟢 Green for inflows (positive amounts)
- **Net Cash Flow**: Total of all categories (highlighted)
- **Transaction Count**: Number of transactions processed

### 4. Transaction Table

Full transaction details with:
- Date
- Details (description)
- Account
- Paid In (green)
- Withdrawn (red, in parentheses)

### 5. Export Functionality

Export processed transactions to Excel with one click.

## Expected File Format

The system expects broker statements with the following structure:

### Row 1: Account Identifier
```
ID1830628-001 (Investment ISA)
```

### Header Row (Row 3 or later):
```
Date | Details | Account | Paid In | Withdrawn
```

### Data Rows:
```
25/12/2025 | International Trading Charge Chubb Limited Common Stock BUY | Investment ISA | | (6.00)
25/12/2025 | Fx Charge Chubb Limited Common Stock BUY | Investment ISA | | (2.33)
24/12/2025 | Order Id 45008786 - Bought 1 Chubb Limited Common Stock @ USD 314.3800 | Investment ISA | | (232.88)
24/12/2025 | FASTER Payment In | Investment ISA | 1 000.00 |
```

## Usage Instructions

### Step 1: Upload Statement
1. Navigate to **Cash Aggregator** in the sidebar
2. Click "Upload File" or drag & drop your broker statement
3. File will be processed automatically

### Step 2: Review Categorization
1. View the **Cash Flow Summary** section
2. Check category totals
3. Review the **Net Cash Flow** (total inflows minus outflows)

### Step 3: Inspect Transactions
1. Scroll to the **Transaction Details** table
2. Verify all transactions are correctly listed
3. Each transaction shows its date, description, and amounts

### Step 4: Export (Optional)
1. Click the "Export" button to download as Excel
2. File will be named: `cash-flows-[AccountName]-[Date].xlsx`

## Multi-Statement Support

- Upload multiple statements
- Switch between them using tabs at the top
- Each statement maintains its own categorization
- Delete statements using the trash icon

## Technical Details

### Data Flow

1. **Upload** → Parse Excel/CSV file using `xlsx` library
2. **Extract** → Identify account name and transactions
3. **Categorize** → Apply text-based rules to each transaction
4. **Aggregate** → Sum amounts by category
5. **Display** → Show summary cards and detailed table
6. **Persist** → Save to localStorage for future sessions

### Categorization Logic

```typescript
const categorizeTransaction = (details: string, withdrawn: number, paidIn: number) => {
  const detailsLower = details.toLowerCase();
  const amount = withdrawn > 0 ? -withdrawn : paidIn;

  if (detailsLower.includes('faster payment') && withdrawn > 0) {
    return { fasterPaymentWithdrawal: amount };
  }
  
  if (detailsLower.includes('bought') || detailsLower.includes('buy')) {
    return { bought: amount };
  }
  
  // ... other patterns
}
```

### localStorage Keys

- `cashAggregatorStatements`: Array of all uploaded statements
- `activeCashAggregatorId`: ID of currently selected statement

## Future Enhancements

As mentioned, this is a foundation for:

### 1. Performance Attribution Tool
- Track ticker entry/exit history
- Calculate daily returns per position
- Compound to annual returns
- Attribution by sector, industry, region
- Benchmark comparison

### 2. Book of Records
- Historical cost basis tracking
- Realized vs unrealized gains
- Tax lot management
- Corporate action handling

### 3. Enhanced Categorization
- Machine learning for better pattern matching
- User-defined rules
- Custom categories
- Bulk reclassification

### 4. Visualizations
- Cash flow trends over time
- Category breakdown pie charts
- Waterfall charts for net position
- Monthly/quarterly aggregation

## Troubleshooting

### Issue: File won't upload
- **Check format**: Only .xlsx, .xls, .csv supported
- **Check structure**: Must have Date and Details columns
- **Check browser**: localStorage must be enabled

### Issue: Wrong categorization
- **Review patterns**: Check if transaction text matches expected patterns
- **Case insensitive**: All matching is case-insensitive
- **Update rules**: Modify `categorizeTransaction()` function if needed

### Issue: Missing transactions
- **Check header**: System looks for "Date" and "Details" columns
- **Check rows**: Empty rows are skipped
- **Check values**: NULL/empty dates or details are filtered out

## Code Structure

```
app/cash-aggregator/
├── page.tsx                      # Server component with metadata
└── CashAggregatorClient.tsx      # Client component with all logic
    ├── File Upload Handler       # Excel/CSV parsing
    ├── Categorization Engine     # Text pattern matching
    ├── Totals Calculator         # Aggregate by category
    ├── Summary Dashboard         # Visual cards display
    ├── Transaction Table         # Detailed list
    └── Export Functionality      # Excel generation
```

## Dependencies

- `xlsx`: Excel file parsing and generation
- `lucide-react`: Icons (Upload, FileSpreadsheet, etc.)
- Standard React hooks: `useState`, `useCallback`, `useRef`, `useEffect`

## Customization

To add new categories:

1. **Update `CategorizedTotals` interface**
```typescript
interface CategorizedTotals {
  // ... existing categories
  yourNewCategory: number;
}
```

2. **Add pattern matching**
```typescript
if (detailsLower.includes('your pattern')) {
  return { yourNewCategory: amount };
}
```

3. **Add label**
```typescript
const labels: Record<string, string> = {
  // ... existing labels
  yourNewCategory: 'Your Display Name',
};
```

---

**Version**: 1.0  
**Last Updated**: December 26, 2025  
**Author**: AI Agent (GitHub Copilot)
