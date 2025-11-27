
import { CriteriaManager } from "@/components/criteria-manager";

export default function CriteriaPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Selection Criteria</h1>
        <p className="text-slate-400">Define and manage rules for stock screening</p>
      </div>

      <CriteriaManager />
    </div>
  );
}
