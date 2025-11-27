import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface ProsConsCardProps {
  pros: string[];
  cons: string[];
  ticker: string;
}

export function ProsConsCard({ pros, cons, ticker }: ProsConsCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Pros & Cons</h3>
          <p className="text-slate-400 text-sm">Key factors for {ticker ?? 'stock'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30">Not Real-Time</span>
          <Sparkles className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pros Section */}
        <div className="space-y-3">
          <h4 className="text-emerald-400 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Pros
          </h4>
          {(pros ?? [])?.length > 0 ? (
            pros?.map?.((pro, index) => (
              <div
                key={`pro-${index}`}
                className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-800/50"
              >
                <p className="text-slate-200 text-sm">{pro}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm italic">No specific pros identified</p>
          )}
        </div>

        {/* Cons Section */}
        <div className="space-y-3">
          <h4 className="text-rose-400 font-semibold flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Cons
          </h4>
          {(cons ?? [])?.length > 0 ? (
            cons?.map?.((con, index) => (
              <div
                key={`con-${index}`}
                className="bg-rose-900/20 rounded-lg p-3 border border-rose-800/50"
              >
                <p className="text-slate-200 text-sm">{con}</p>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-sm italic">No specific cons identified</p>
          )}
        </div>
      </div>
    </div>
  );
}
