import { Metadata } from 'next';
import PerformanceAttributionClient from './PerformanceAttributionClient';

export const metadata: Metadata = {
  title: 'Performance Attribution',
  description: 'Analyze portfolio performance and attribution by stock',
};

export default function PerformanceAttributionPage() {
  return <PerformanceAttributionClient />;
}
