import React, { useState } from 'react';
import { Lightbulb, CheckCircle2, Send, Shield, Sparkles } from 'lucide-react';
import { createFeatureSuggestion } from '../services/apiService';

export const FeatureSuggestionPage: React.FC = () => {
  const [suggestion, setSuggestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract company parameter from URL if provided (e.g. /feedback/suggest?company=comp-01)
  const queryParams = new URLSearchParams(window.location.search);
  const urlCompanyId = queryParams.get('company') || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createFeatureSuggestion(suggestion.trim(), urlCompanyId);
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-500/30">
      
      {/* Standalone Brand Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100 tracking-wide">IndyComply SaaS</h1>
            <p className="text-[11px] text-slate-400">Client Feedback & Feature Suggestion Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-amber-400/90 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Product Feedback</span>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* Subtle Accent Light */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          {isSubmitted ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-100">Thank You for Your Feedback!</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your suggestion has been logged directly into Ray Woo’s release planning queue in DynamoDB.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setSuggestion('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Submit Another Suggestion
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2 border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-slate-100">What feature would help your business most?</h2>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tell us what platform features, document classification rules, or integration capabilities would improve your compliance operations.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  {errorMessage}
                </div>
              )}

              {/* Suggestion Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Feature Suggestion & Use Case *
                </label>
                <textarea
                  required
                  rows={6}
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="e.g. We need bulk CSV export of subcontractor COI expiration dates, or automated SMS alerts when an endorsement clause is missing..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500/50 leading-relaxed resize-none"
                />
              </div>

              {/* Submit Action */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500 font-mono">
                  {urlCompanyId ? `Scoped to Company: ${urlCompanyId}` : 'Direct Client Input'}
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting || !suggestion.trim()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-lg"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Feature Suggestion'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-6 py-4 text-center text-[11px] text-slate-500">
        IndyComply Construction Compliance Engine • Confidential Client Feedback Portal
      </footer>

    </div>
  );
};
