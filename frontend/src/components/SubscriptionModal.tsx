import React, { useState } from 'react';
import { X, Mail, User, Check, ShieldCheck } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useNotifications } from '../context/NotificationContext';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { userName, userEmail, updateProfile } = useUser();
  const { showToast } = useNotifications();

  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(name, email);
    setSaved(true);
    showToast('success', `Alert profile updated for ${name} (${email})`);

    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-md w-full max-w-md p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">SaaS User & Email Notifications</h3>
              <p className="text-[10px] text-slate-400">Configure GC tenant notifications & renewal alerts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
              <User className="w-3 h-3 text-sky-400" /> User Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
              <Mail className="w-3 h-3 text-sky-400" /> Escalation Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs flex items-center gap-1"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
