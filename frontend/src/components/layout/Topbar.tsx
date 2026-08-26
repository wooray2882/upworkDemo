import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  ShieldCheck, 
  Check, 
  ExternalLink,
  Mail,
  Menu,
  CheckCircle2,
  FileText,
  Settings,
  LifeBuoy,
  Lightbulb,
  ChevronDown,
  LogOut
} from 'lucide-react';
import SubscriptionModal from '../SubscriptionModal';
import SupportTicketModal, { SupportTicketItem } from '../SupportTicketModal';
import { useNotifications } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem } from '../../context/NotificationContext';


interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
  onOpenAuditReport?: () => void;
  onOpenSupportModal?: (mode?: 'TICKET' | 'SUGGESTION') => void;
}

export default function Topbar({ title, onMenuClick, onOpenAuditReport, onOpenSupportModal }: TopbarProps) {
  const navigate = useNavigate();
  const { notifications, dismissNotification, clearAllNotifications } = useNotifications();
  const { userName } = useUser();
  const { user, logout } = useAuth();

  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const flyoutRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (item: NotificationItem) => {
    dismissNotification(item.id);
    setIsNotifOpen(false);
    navigate(item.link);
  };

  const userInitial = userName ? userName.charAt(0).toUpperCase() : 'R';

  return (
    <>
      <SubscriptionModal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} />

      <header
        className="flex items-center justify-between px-3 sm:px-5 h-12 shrink-0 border-b relative z-30"
        style={{
          background: 'var(--color-bg-sidebar)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="p-1 md:hidden text-slate-300 hover:text-white bg-slate-800 border border-slate-700/60 rounded-md transition-all active:scale-95 shrink-0"
              title="Open Navigation"
            >
              <Menu className="h-4 w-4" />
            </button>
          )}

          <h1 className="text-xs sm:text-sm font-semibold tracking-tight truncate text-slate-200">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* 1-Click Audit Report Button */}
          {onOpenAuditReport && (
            <button
              onClick={onOpenAuditReport}
              className="btn-primary text-xs flex items-center gap-1.5"
              title="Generate Instant Compliance Audit Summary"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>1-Click Audit Report</span>
            </button>
          )}

          {/* User Profile Avatar Pill with Dropdown Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(prev => !prev)}
              className="flex items-center gap-1.5 p-1 px-2.5 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 rounded-md transition-colors text-xs text-slate-200 cursor-pointer"
              title="Account & Profile Menu"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
                {userInitial}
              </div>
              <span className="font-semibold hidden sm:inline truncate max-w-[100px]">
                {userName}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in duration-100 divide-y divide-slate-800/80 text-xs">
                
                <div className="p-2 space-y-0.5">
                  <p className="font-bold text-slate-100 truncate">{user?.email || userName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {user?.role === 'SUPER_ADMIN' ? 'Platform Super Admin' : `Company: ${user?.companyId || 'comp-01'}`}
                  </p>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsSubModalOpen(true);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Profile & Email Alerts</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenSupportModal?.('TICKET');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-emerald-400 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LifeBuoy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contact Support</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenSupportModal?.('SUGGESTION');
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-amber-400 hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>Suggest a Feature</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors cursor-pointer font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notification Bell */}
          <div className="relative" ref={flyoutRef}>
            <button 
              onClick={() => setIsNotifOpen(prev => !prev)}
              className="relative p-1.5 rounded-md transition-colors hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white"
              title="Notifications & Renewal Escalations"
            >
              <Bell className="h-4 w-4" />
              
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Flyout Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-slate-900 border border-slate-800 rounded-md shadow-2xl p-3.5 z-50 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-slate-200">Compliance Alerts</h3>
                    {unreadCount > 0 ? (
                      <span className="px-1.5 py-0.5 bg-amber-600 text-white rounded text-[10px] font-bold">
                        {unreadCount} Flagged
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-semibold">
                        All Compliant
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setIsNotifOpen(false);
                      setIsSubModalOpen(true);
                    }}
                    className="btn-secondary text-[11px] py-1 px-2"
                  >
                    <Mail className="h-3 w-3" /> Profile
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="py-8 px-2 text-center flex flex-col items-center justify-center gap-2">
                    <div className="p-2 bg-emerald-600 text-white rounded-md">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">No Compliance Alerts</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                        All active certificates and licenses are fully verified.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-y-auto divide-y divide-slate-800/40">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleNotificationClick(item)}
                        className="p-2 rounded-md cursor-pointer transition-colors flex items-start gap-2.5 group bg-slate-800/40 hover:bg-slate-800/80"
                      >
                        <div className="p-1.5 bg-slate-950 rounded-md border border-slate-800 shrink-0 mt-0.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                              {item.title}
                            </h4>
                            <span className="text-[10px] text-slate-500 shrink-0 font-mono">{item.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {item.summary}
                          </p>
                        </div>

                        <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-emerald-400 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  {notifications.length > 0 ? (
                    <button
                      onClick={clearAllNotifications}
                      className="btn-tertiary text-[11px] py-1 px-2"
                    >
                      <Check className="h-3 w-3" /> Dismiss all
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">System Healthy</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
