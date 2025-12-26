import { PageHeader } from '@/components/page-header';
import CashAggregatorClient from './CashAggregatorClient';

export const metadata = {
  title: 'Cash Aggregator | Portfolio Intelligence',
  description: 'Upload and categorize your broker cash flows',
};

export default function CashAggregatorPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <PageHeader
          title="Cash Aggregator"
          description="Upload your broker statements and automatically categorize cash flows"
        />
        <CashAggregatorClient />
      </div>
    </main>
  );
}
