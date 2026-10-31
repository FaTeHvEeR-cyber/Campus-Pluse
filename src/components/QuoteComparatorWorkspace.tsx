import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  Lock,
  Plus,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { BudgetCategory, FestMasterPlan, VendorQuote } from '../types';
import {
  computeDualTrackBudgetMetrics,
  formatINR,
  formatNumericInputValue,
  getCategoryBudgetItem,
  getEffectiveFestCategory,
  sanitizeNumericInput,
} from '../utils/festEngine';

interface QuoteComparatorWorkspaceProps {
  plan: FestMasterPlan;
  activeCategory: BudgetCategory;
  isEvaluatingQuotes: boolean;
  onSelectCategory: (category: BudgetCategory) => void;
  onLockVendorQuote: (quoteId: string) => void;
  onAddCustomVendorQuote: (quote: VendorQuote) => void;
  onEvaluateQuotesWithAI: () => void;
  onSuggestVendorsFromIntake: () => void;
  onLoadSampleVendorQuotes: () => void;
  onClearVendorQuotes: () => void;
}

const COMPARABLE_CATEGORIES: BudgetCategory[] = [
  'Catering, Stalls & Midnight Refreshments',
  'Swag, IDs, Certificates & Printing',
  'Hackathon Wi-Fi, Power & Lab Setup',
  'Stage, Sound & AV Rigging',
];

export const QuoteComparatorWorkspace: React.FC<
  QuoteComparatorWorkspaceProps
> = ({
  plan,
  activeCategory,
  isEvaluatingQuotes,
  onSelectCategory,
  onLockVendorQuote,
  onAddCustomVendorQuote,
  onEvaluateQuotesWithAI,
  onSuggestVendorsFromIntake,
  onLoadSampleVendorQuotes,
  onClearVendorQuotes,
}) => {
  const [showAddBidForm, setShowAddBidForm] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [totalQuoteINR, setTotalQuoteINR] = useState(98000);
  const [advancePercent] = useState(40);
  const [inclusionsText, setInclusionsText] = useState(
    'Full institutional delivery, GST invoice & 2 on-site supervisors'
  );
  const [hiddenCostsText, setHiddenCostsText] = useState(
    'Zero hidden transport or generator charges'
  );

  const budgetMetrics = computeDualTrackBudgetMetrics(
    plan.budget,
    plan.intake.totalBudgetINR,
    plan.intake.expectedFootfall
  );

  const categoryBudgetItem = getCategoryBudgetItem(plan.budget, activeCategory);
  const categoryQuotes = plan.vendorQuotes.filter(
    (q) => q.category === activeCategory
  );

  const handleSuggestFromIntakeClick = () => {
    onSuggestVendorsFromIntake();
    setActionBanner(
      `Predicted tailored vendor quotes for ${plan.intake.festName} (${plan.intake.eventLocality || 'Campus'} · ${plan.intake.venueType || 'College Campus'} · ${plan.intake.expectedFootfall} attendees · ${formatINR(plan.intake.totalBudgetINR)} budget).`
    );
  };

  const handleLoadSamplesClick = () => {
    onLoadSampleVendorQuotes();
    setActionBanner(
      `Loaded 12 Sample Campus Vendor Quotes across 4 Procurement Categories (3 competing Indian vendor bids per category with GST, advance %, room delivery SLAs & INR ₹ figures).`
    );
  };

  const handleCreateBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;

    const aiEst = categoryBudgetItem?.aiEstimateINR ?? totalQuoteINR;
    const diff = totalQuoteINR - aiEst;

    const newQuote: VendorQuote = {
      id: `vq-custom-${Date.now()}`,
      category: activeCategory,
      vendorName: vendorName.trim(),
      totalQuoteINR: Number(totalQuoteINR) || 50000,
      gstIncluded: true,
      advancePaymentPercent: Number(advancePercent) || 40,
      paymentTerms: `${advancePercent}% NEFT Advance · ${100 - advancePercent}% Post-Event`,
      deliveryLeadTime: 'T-1 Day Campus Delivery',
      inclusions: inclusionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      hiddenCostsGeneratorCharges:
        hiddenCostsText.trim() || 'No additional generator/transport surcharges',
      slaGuarantee: '100% on-time campus gate delivery SLA',
      campusPastTrackRecord: 'Submitted via Coordinator Bid Portal',
      budgetFitScore: diff <= 0 ? 93 : 76,
      campusReliabilityScore: 88,
      hiddenCostRisk: 'Low',
      negotiationTip:
        'Request 10% student society discount in exchange for stall branding.',
      aiRecommendationNote:
        diff <= 0
          ? `Saves ${formatINR(Math.abs(diff))} compared to category AI Estimate.`
          : `Exceeds category AI Estimate by ${formatINR(diff)}.`,
    };

    onAddCustomVendorQuote(newQuote);
    setVendorName('');
    setShowAddBidForm(false);
  };

  return (
    <section
      aria-label="Vendor Quote Comparator and Estimate-to-Confirmed Converter"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-indigo-700">
            Module 05 · Vendor Quote Comparator &amp; Estimate-to-Confirmed
            Converter
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Side-by-Side Vendor Quote Comparator &amp; AI Scorer
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Predict local vendors tailored to{' '}
            <strong>{plan.intake.festName}</strong> (
            {getEffectiveFestCategory(plan.intake)} at{' '}
            {plan.intake.eventLocality || 'Campus'} ·{' '}
            {plan.intake.startTime || '09:00 AM'}–
            {plan.intake.endTime || '09:00 PM'}), add your own vendor bids, or
            load sample campus vendor quotes to see an example.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSuggestFromIntakeClick}
            aria-label="Suggest Vendors from My Intake Brief"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Suggest Vendors from My Intake Brief
          </button>

          <button
            type="button"
            onClick={handleLoadSamplesClick}
            aria-label="Load Sample Campus Vendor Quotes"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            Load Sample Campus Vendor Quotes
          </button>

          <button
            type="button"
            onClick={() => setShowAddBidForm((prev) => !prev)}
            aria-label="Add Competing Vendor Quote"
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Vendor Bid
          </button>

          {plan.vendorQuotes.length > 0 && (
            <>
              <button
                type="button"
                onClick={onEvaluateQuotesWithAI}
                disabled={isEvaluatingQuotes}
                aria-label="Compare Quotes with Gemini AI"
                className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {isEvaluatingQuotes ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Scoring Quotes...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Compare Quotes with Gemini AI
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  onClearVendorQuotes();
                  setActionBanner(null);
                }}
                aria-label="Clear Vendor Quotes"
                className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {actionBanner && (
        <div className="px-4 py-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{actionBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-xs font-semibold text-emerald-800 underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Category Selector Tabs & Category Budget Summary */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div
            role="group"
            aria-label="Select procurement category to compare quotes"
            className="flex items-center gap-1.5 flex-wrap"
          >
            {COMPARABLE_CATEGORIES.map((category) => {
              const isSelected = activeCategory === category;
              const bItem = getCategoryBudgetItem(plan.budget, category);
              const isLocked = bItem?.quoteStatus === 'Confirmed Quote';

              return (
                <button
                  key={category}
                  aria-pressed={isSelected}
                  type="button"
                  onClick={() => onSelectCategory(category)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`font-mono text-[11px] ${
                      isSelected
                        ? 'text-emerald-300'
                        : isLocked
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                    }`}
                  >
                    {isLocked ? 'Locked' : 'Estimate'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-mono tabular-nums text-slate-600 shrink-0">
            Master Buffer Available:{' '}
            <strong
              className={
                budgetMetrics.remainingMasterBufferINR >= 0
                  ? 'text-emerald-700'
                  : 'text-red-700'
              }
            >
              {formatINR(budgetMetrics.remainingMasterBufferINR)}
            </strong>
          </div>
        </div>

        {/* Selected Category Context Strip */}
        {categoryBudgetItem ? (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">
                Category AI Estimate Baseline
              </span>
              <strong className="text-base font-mono tabular-nums text-slate-900 mt-0.5 block">
                {formatINR(categoryBudgetItem.aiEstimateINR)}
              </strong>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">
                Confirmed Quote Cost
              </span>
              <strong className="text-base font-mono tabular-nums text-emerald-700 mt-0.5 block">
                {categoryBudgetItem.confirmedQuoteINR !== null
                  ? formatINR(categoryBudgetItem.confirmedQuoteINR)
                  : 'Pending Vendor Selection'}
              </strong>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">
                Sponsor-Backed Allocation
              </span>
              <strong className="text-base font-mono tabular-nums text-slate-900 mt-0.5 block">
                {formatINR(categoryBudgetItem.sponsorBackedINR)}
              </strong>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block">Active Vendor Status</span>
              <strong className="text-xs font-semibold text-slate-900 mt-1 block truncate">
                {categoryBudgetItem.lockedVendorName ??
                  'No vendor locked yet — select below'}
              </strong>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            Event Context: <strong>{plan.intake.festName}</strong> ·{' '}
            {plan.intake.venueType || 'College Campus'} at{' '}
            {plan.intake.eventLocality || 'Campus'} · Total Cap{' '}
            <strong className="font-mono text-slate-800">
              {formatINR(plan.intake.totalBudgetINR)}
            </strong>
          </div>
        )}
      </div>

      {/* Optional Add Competing Vendor Bid Form */}
      {showAddBidForm && (
        <form
          onSubmit={handleCreateBid}
          aria-label="Submit New Competing Vendor Bid"
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Add Competing Quotation for {activeCategory}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddBidForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="text"
              required
              placeholder="Vendor Firm Name..."
              aria-label="Vendor Firm Name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Quote Amount (₹)"
              aria-label="Total Quote in INR"
              value={formatNumericInputValue(totalQuoteINR)}
              onChange={(e) => {
                const { numericValue } = sanitizeNumericInput(e.target.value);
                setTotalQuoteINR(numericValue);
              }}
              className="px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Deliverables (comma separated)"
              aria-label="Deliverables"
              value={inclusionsText}
              onChange={(e) => setInclusionsText(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Hidden Costs / Generator Charges"
              aria-label="Hidden Costs and Generator Charges"
              value={hiddenCostsText}
              onChange={(e) => setHiddenCostsText(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              Save Vendor Bid
            </button>
          </div>
        </form>
      )}

      {/* Clean Empty State vs. Side-by-Side Vendor Comparison Cards */}
      {categoryQuotes.length === 0 ? (
        <div
          aria-label="Empty Vendor Quotes Prompt"
          className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-4"
        >
          <div className="max-w-xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
              No Vendor Quotes Pre-Loaded Yet · Decluttered View
            </span>
            <h2 className="text-base font-bold text-slate-900">
              No Quotes in &ldquo;{activeCategory}&rdquo; Yet
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose whether to{' '}
              <strong>
                predict vendor quotes tailored to your Intake Wizard brief
              </strong>{' '}
              ({plan.intake.festName} at {plan.intake.eventLocality || 'Campus'}
              ), add your own vendor bid manually, or{' '}
              <strong>load sample campus vendor quotes</strong> to see a
              pre-filled example.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleSuggestFromIntakeClick}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Suggest Vendors from My Intake Brief
            </button>
            <button
              type="button"
              onClick={handleLoadSamplesClick}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              Load Sample Campus Vendor Quotes (See Example)
            </button>
            <button
              type="button"
              onClick={() => setShowAddBidForm(true)}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Custom Bid
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {categoryQuotes.map((quote) => {
            const aiEstimate =
              categoryBudgetItem?.aiEstimateINR ?? quote.totalQuoteINR;
            const variance = quote.totalQuoteINR - aiEstimate;
            const isLocked =
              categoryBudgetItem?.quoteStatus === 'Confirmed Quote' &&
              (categoryBudgetItem?.lockedVendorId === quote.id ||
                categoryBudgetItem?.lockedVendorName === quote.vendorName);

            return (
              <article
                key={quote.id}
                aria-label={`Vendor Quote: ${quote.vendorName}`}
                className={`rounded-xl border p-6 flex flex-col justify-between gap-5 transition-colors ${
                  isLocked
                    ? 'border-emerald-600 bg-emerald-50/15'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-indigo-700">
                      {quote.gstIncluded ? 'GST 18% Included' : 'Excludes GST'}
                    </span>
                    <span className="font-mono text-slate-600">
                      {quote.paymentTerms}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {quote.vendorName}
                    </h2>
                    <div className="flex items-baseline gap-3 mt-2">
                      <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                        {formatINR(quote.totalQuoteINR)}
                      </span>
                      <span
                        className={`text-xs font-mono font-semibold tabular-nums flex items-center gap-1 ${
                          variance <= 0 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {variance <= 0 ? (
                          <>
                            <TrendingDown className="w-3.5 h-3.5" />
                            Saves {formatINR(Math.abs(variance))} vs Est.
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-3.5 h-3.5" />
                            {formatINR(variance, true)} over Est.
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* AI Multi-Factor Scorecard: Budget Fit, Campus Reliability, Hidden-Cost Risk */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums">
                    <div className="p-2 rounded bg-slate-50">
                      <span className="text-[11px] font-sans text-slate-500 block">
                        Budget Fit
                      </span>
                      <strong className="text-slate-900">
                        {quote.budgetFitScore}/100
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50">
                      <span className="text-[11px] font-sans text-slate-500 block">
                        Reliability
                      </span>
                      <strong className="text-slate-900">
                        {quote.campusReliabilityScore}/100
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50">
                      <span className="text-[11px] font-sans text-slate-500 block">
                        Hidden Risk
                      </span>
                      <strong
                        className={
                          quote.hiddenCostRisk === 'Low'
                            ? 'text-emerald-700'
                            : quote.hiddenCostRisk === 'Moderate'
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }
                      >
                        {quote.hiddenCostRisk}
                      </strong>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      <strong>Lead Time:</strong> {quote.deliveryLeadTime}
                    </span>
                  </div>

                  {/* Deliverables */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-bold text-slate-700">
                      Contracted Deliverables
                    </h3>
                    <ul className="space-y-1 text-xs text-slate-600">
                      {quote.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hidden Costs / Generator Charges */}
                  <div className="p-2.5 rounded-lg bg-slate-50 text-xs space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Hidden Costs &amp; Generator Charges:</span>
                    </div>
                    <p className="text-slate-600">
                      {quote.hiddenCostsGeneratorCharges}
                    </p>
                  </div>

                  {/* AI Negotiation Tip & Verdict */}
                  <div className="p-3 rounded-lg bg-indigo-50/70 text-xs text-indigo-950 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <Scale className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>AI Verdict:</strong>{' '}
                        {quote.aiRecommendationNote}
                      </span>
                    </div>
                    <div className="pt-1 border-t border-indigo-100 text-indigo-900">
                      <strong>Negotiation Tip:</strong> {quote.negotiationTip}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onLockVendorQuote(quote.id)}
                  aria-label={
                    isLocked
                      ? `Confirmed Quote Locked: ${quote.vendorName}`
                      : `Confirm and Lock Vendor ${quote.vendorName}`
                  }
                  className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                    isLocked
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isLocked ? (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Confirmed &amp; Locked in Master Budget
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Confirm &amp; Lock Vendor ({formatINR(quote.totalQuoteINR)})
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
