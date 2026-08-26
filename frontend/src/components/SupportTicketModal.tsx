import React, { useState } from 'react';
import { X, LifeBuoy, Lightbulb, CheckCircle2, Send, ShieldAlert } from 'lucide-react';
import { createSupportTicket, createFeatureSuggestion } from '../services/apiService';


export interface SupportTicketItem {
  id: string;
  type: 'TICKET' | 'SUGGESTION';
  subject: string;
  description: string;
  submittedBy: string;
  submittedAt: string;
  inferredUrgency: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
}


interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'TICKET' | 'SUGGESTION';
  onSubmitTicket?: (ticket: SupportTicketItem) => void;
}

export default function SupportTicketModal({
  isOpen,
  onClose,
  initialMode = 'TICKET',
  onSubmitTicket
}: SupportTicketModalProps) {
  const [mode, setMode] = useState<'TICKET' | 'SUGGESTION'>(initialMode);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [inferredUrgencyResult, setInferredUrgencyResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    setInferredUrgencyResult(null);

    try {
      if (mode === 'TICKET') {
        const res = await createSupportTicket(subject.trim(), description.trim());
        const urgency = res.aiInferredUrgency || res.priority || 'MEDIUM';
        setInferredUrgencyResult(urgency);

        if (onSubmitTicket) {
          onSubmitTicket({
            id: res.ticketId || res.id || `tkt-${Math.floor(Math.random() * 8999 + 1000)}`,
            type: 'TICKET',
            subject: subject.trim(),
            description: description.trim(),
            submittedBy: 'Authenticated User',
            submittedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            inferredUrgency: urgency,
            status: 'OPEN'
          });
        }
      } else {
        await createFeatureSuggestion(description.trim() ? `${subject.trim()}: ${description.trim()}` : subject.trim());
      }

      setIsSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setSubject('');
        setDescription('');
        setInferredUrgencyResult(null);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setIsSubmitting(false);
      alert(`Submission failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };


  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            {mode === 'TICKET' ? (
              <LifeBuoy className="w-5 h-5 text-emerald-400" />
            ) : (
              <Lightbulb className="w-5 h-5 text-amber-400" />
            )}
            <h3 className="text-sm font-bold text-slate-100">
              {mode === 'TICKET' ? 'Contact Support & Report Issue' : 'Suggest a Feature'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Contact Support vs Suggest a Feature */}
        <div className="px-6 pt-4 flex border-b border-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setMode('TICKET')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'TICKET'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </button>
          
          <button
            onClick={() => setMode('SUGGESTION')}
            className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              mode === 'SUGGESTION'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Suggest a Feature</span>
          </button>
        </div>

        {/* Form Body */}
        {submittedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-100">
              {mode === 'TICKET' ? 'Support Ticket Dispatched!' : 'Feature Suggestion Submitted!'}
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              {mode === 'TICKET'
                ? 'Our team and automated support engine are reviewing your request. Urgency will be inferred automatically.'
                : 'Thank you for your feedback! Your suggestion has been logged for upcoming release planning.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            
            <p className="text-slate-400 text-xs">
              {mode === 'TICKET'
                ? 'Describe any issue or technical question. Ray & AI support infer urgency automatically from your ticket text.'
                : 'Submit ideas for upcoming IndyComply platform features and workflow enhancements.'}
            </p>

            {/* Subject Input */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">
                {mode === 'TICKET' ? 'Subject *' : 'Feature Title *'}
              </label>
              <input
                type="text"
                required
                placeholder={
                  mode === 'TICKET'
                    ? 'e.g. Inbound SMS document parsing question'
                    : 'e.g. Bulk CSV export for subcontractor roster'
                }
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Description Input */}
            <div className="space-y-1">
              <label className="block text-slate-300 font-semibold">
                {mode === 'TICKET' ? 'Description & Steps to Reproduce *' : 'Feature Description & Use Case *'}
              </label>
              <textarea
                required
                rows={4}
                placeholder={
                  mode === 'TICKET'
                    ? 'Provide details on what happened or what assistance you need...'
                    : 'Describe how this feature would improve your compliance workflow...'
                }
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 leading-relaxed"
              />
            </div>

            {/* Footer Submit Button */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-800/80">
              <p className="text-[10px] text-slate-500">
                {mode === 'TICKET' ? 'AI infers ticket priority automatically' : 'Collected for upcoming release planning'}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                    mode === 'TICKET' ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-amber-400 hover:bg-amber-300'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 text-slate-950" />
                  <span>{isSubmitting ? 'Sending...' : mode === 'TICKET' ? 'Submit Ticket' : 'Submit Suggestion'}</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
