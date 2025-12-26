import { Metadata } from 'next';
import ValueAtRiskClient from './ValueAtRiskClient';

export const metadata: Metadata = {
  title: 'Value at Risk (VaR)',
  description: 'Portfolio Value at Risk analysis and risk metrics',
};

export default function ValueAtRiskPage() {
  return <ValueAtRiskClient />;
}
