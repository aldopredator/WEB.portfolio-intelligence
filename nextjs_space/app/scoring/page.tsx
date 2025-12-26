import { Metadata } from 'next';
import ScoringClient from './ScoringClient';

export const metadata: Metadata = {
  title: 'Internal Scoring | Portfolio Intelligence',
  description: 'Multi-factor quantitative scoring model for stock ranking',
};

export const dynamic = 'force-dynamic';

export default function ScoringPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Internal Scoring
          </h1>
          <p className="text-slate-400 text-lg">
            Multi-factor quantitative model to rank stocks based on Value, Quality, Growth, Momentum, and Risk factors.
            Choose a predefined theme or customize factor weights to match your investment strategy.
          </p>
        </div>
        
        <ScoringClient />
      </div>
    </div>
  );
}
