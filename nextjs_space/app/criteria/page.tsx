import { CheckCircle2, XCircle } from 'lucide-react';

export default function CriteriaPage() {
  const criteria = [
    {
      category: 'Valuation Metrics',
      rules: [
        { field: 'Price-to-Earnings (P/E) Ratio', operator: 'Less Than', value: '20', include: true },
        { field: 'Price-to-Book (P/B) Ratio', operator: 'Less Than', value: '3', include: true },
      ],
    },
    {
      category: 'Performance Metrics',
      rules: [
        { field: 'Year-to-Date Return', operator: 'Greater Than', value: '0%', include: true },
        { field: '52-Week Performance', operator: 'Greater Than', value: '10%', include: true },
      ],
    },
    {
      category: 'Sector Exclusions',
      rules: [
        { field: 'Sector', operator: 'Exclude', value: 'Alcohol', include: false },
        { field: 'Sector', operator: 'Exclude', value: 'Gambling', include: false },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Stock Screening Criteria</h1>
          <p className="text-slate-400 text-lg">
            These are the recommended criteria for screening US stocks. All rules below are applied to identify high-quality investment opportunities.
          </p>
        </div>

        {/* Criteria Cards */}
        <div className="space-y-6">
          {criteria.map((category, idx) => (
            <div
              key={idx}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
            >
              <h2 className="text-2xl font-semibold text-white mb-4">{category.category}</h2>
              <div className="space-y-3">
                {category.rules.map((rule, ruleIdx) => (
                  <div
                    key={ruleIdx}
                    className="flex items-center justify-between p-4 bg-slate-950/50 rounded-lg border border-slate-800/50"
                  >
                    <div className="flex items-center gap-4">
                      {rule.include ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-white font-medium">{rule.field}</div>
                        <div className="text-slate-400 text-sm mt-1">
                          {rule.operator}: <span className="text-white font-mono">{rule.value}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">
                      {rule.include ? 'Include' : 'Exclude'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-900/20 border border-blue-800/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-2">📊 About These Criteria</h3>
          <p className="text-slate-300 leading-relaxed">
            These criteria are designed to identify fundamentally strong companies with attractive valuations and positive momentum. 
            The screening process filters out speculative sectors and focuses on companies with sustainable growth potential. 
            This is a read-only view of the recommended screening parameters.
          </p>
        </div>
      </div>
    </div>
  );
}
