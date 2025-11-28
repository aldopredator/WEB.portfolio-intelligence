import { CheckCircle2, XCircle, TrendingUp, DollarSign, Ban, Info } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function CriteriaPage() {
  const criteria = [
    {
      category: 'Valuation Metrics',
      icon: DollarSign,
      description: 'Financial ratios to identify reasonably valued stocks',
      color: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30',
      rules: [
        { field: 'Price-to-Earnings (P/E) Ratio', operator: 'Less Than', value: '20', include: true, description: 'Ensures reasonable valuation relative to earnings' },
        { field: 'Price-to-Book (P/B) Ratio', operator: 'Less Than', value: '3', include: true, description: 'Fair value relative to company assets' },
      ],
    },
    {
      category: 'Performance Metrics',
      icon: TrendingUp,
      description: 'Growth and momentum indicators for strong performers',
      color: 'from-blue-500/20 to-purple-500/20',
      borderColor: 'border-blue-500/30',
      rules: [
        { field: 'Year-to-Date Return', operator: 'Greater Than', value: '0%', include: true, description: 'Positive performance in current year' },
        { field: '52-Week Performance', operator: 'Greater Than', value: '10%', include: true, description: 'Strong annual growth trajectory' },
      ],
    },
    {
      category: 'Sector Exclusions',
      icon: Ban,
      description: 'Industries excluded from investment consideration',
      color: 'from-red-500/20 to-orange-500/20',
      borderColor: 'border-red-500/30',
      rules: [
        { field: 'Sector', operator: 'Exclude', value: 'Alcohol', include: false, description: 'Excludes alcohol beverage manufacturers' },
        { field: 'Sector', operator: 'Exclude', value: 'Gambling', include: false, description: 'Excludes gaming and casino operators' },
      ],
    },
  ];

  return (
    <main className="min-h-screen">
      <PageHeader
        title="Screening Criteria"
        description="Investment filtering methodology and stock selection criteria"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Criteria Cards */}
        <div className="grid grid-cols-1 gap-6">
          {criteria.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-xl overflow-hidden hover:border-slate-700/50 transition-all hover:shadow-lg hover:shadow-blue-500/5"
              >
                {/* Category Header */}
                <div className={`bg-gradient-to-r ${category.color} border-b ${category.borderColor} p-6`}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center border border-slate-700/50">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{category.category}</h2>
                      <p className="text-slate-300 text-sm mt-1">{category.description}</p>
                    </div>
                  </div>
                </div>

                {/* Rules */}
                <div className="p-6 space-y-4">
                  {category.rules.map((rule, ruleIdx) => (
                    <div
                      key={ruleIdx}
                      className="group relative bg-slate-950/50 border border-slate-800/50 rounded-xl p-5 hover:border-slate-700/50 transition-all hover:bg-slate-950/70"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          {rule.include ? (
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                              <XCircle className="w-5 h-5 text-red-400" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <h3 className="text-white font-semibold text-lg">{rule.field}</h3>
                              <p className="text-slate-400 text-sm mt-1">{rule.description}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                              rule.include 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {rule.include ? 'Include' : 'Exclude'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3 p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
                            <span className="text-slate-400 text-sm">{rule.operator}:</span>
                            <span className="text-white font-mono font-semibold">{rule.value}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                <Info className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-2">About These Criteria</h3>
              <p className="text-slate-300 leading-relaxed">
                These criteria are designed to identify fundamentally strong companies with attractive valuations and positive momentum. 
                The screening process filters out speculative sectors and focuses on companies with sustainable growth potential. 
                This is a read-only view of the recommended screening parameters used for stock selection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
