import { PageHeader } from '@/components/page-header';
import BankStatementClient from './BankStatementClient';

export const metadata = {
  title: 'Bank Statement | Portfolio Intelligence',
  description: 'Upload and view your bank investment statements',
};

export default function BankStatementPage() {
  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <PageHeader
          title="Bank Statement"
          description="Upload and analyze your Barclays Investment ISA statements"
        />
        <BankStatementClient />
      </div>
    </main>
  );
}
