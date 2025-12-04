import { PageHeader } from '@/components/page-header';
import CriteriaForm from './CriteriaForm';

export default function CriteriaPage() {
  return (
    <main className="min-h-screen">
      <PageHeader
        title="Screening Criteria"
        description="Configure investment filters to identify quality stocks with growth potential"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <CriteriaForm />
      </div>
    </main>
  );
}
