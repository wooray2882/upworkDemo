import React from 'react';
import { NavLink } from 'react-router-dom';
import { X, Settings } from 'lucide-react';
import { useUser } from '../../context/UserContext';

interface NavItem {
  label: string;
  icon: string;
  to?: string;
  isAction?: boolean;
  actionType?: 'audit' | 'settings';
  badgeText?: string;
  badgeColor?: 'emerald' | 'amber' | 'sky' | 'slate';
  hasPulse?: boolean;
}

interface NavGroup {
  title: string;
  badgeText?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'CLIENT WORKSPACE',
    items: [
      { label: 'Overview', icon: 'ri-dashboard-3-line', to: '/overview' },
      { label: 'Subcontractors', icon: 'ri-building-4-line', to: '/subcontractors' },
      { label: 'Documents', icon: 'ri-folder-shield-2-line', to: '/intake', badgeText: 'Vault', badgeColor: 'sky' },
      { label: 'Audit Reports', icon: 'ri-file-chart-line', to: '/reports', badgeText: 'PDF Reports', badgeColor: 'emerald' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    badgeText: 'ADMIN ONLY',
    items: [
      { label: 'Review Queue', icon: 'ri-shield-user-line', to: '/human-review', badgeText: '2 Pending', badgeColor: 'amber' },
      { label: 'System Health', icon: 'ri-pulse-line', to: '/super-admin' },
      { label: 'Settings', icon: 'ri-settings-4-line', isAction: true, actionType: 'settings' },
    ],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onOpenSettings?: () => void;
  onOpenAuditReport?: () => void;
}

export default function Sidebar({ 
  isOpen = false, 
  onClose, 
  onOpenSettings,
  onOpenAuditReport 
}: SidebarProps) {
  const { userName } = useUser();

  const userInitials = userName
    ? userName
        .trim()
        .split(/\s+/)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'RW';

  const handleActionClick = (actionType?: 'audit' | 'settings') => {
    onClose?.();
    if (actionType === 'audit') {
      onOpenAuditReport?.();
    } else if (actionType === 'settings') {
      onOpenSettings?.();
    }
  };

  const renderItemInner = (item: NavItem) => (
    <>
      <div className="nav-item-icon shrink-0">
        <i className={item.icon} />
      </div>
      <span className="truncate">{item.label}</span>

      {item.badgeText && (
        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
          item.badgeColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
          item.badgeColor === 'amber' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
          item.badgeColor === 'sky' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' :
          'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          {item.hasPulse && <span className="live-dot" />}
          {item.badgeText}
        </span>
      )}
    </>
  );

  const content = (
    <div className="flex flex-col h-full w-full bg-[var(--color-bg-sidebar)]">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div 
            className="relative flex items-center justify-center w-8 h-8 rounded-lg shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30 shrink-0" 
            style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }}
          >
            <i className="ri-shield-check-fill text-white text-base" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-100">
                Indy<span className="text-emerald-400">Comply</span>
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-mono font-medium rounded bg-slate-800/90 text-slate-400 border border-slate-700/60 shrink-0">
                v1.2
              </span>
            </div>
            <p className="text-[10px] font-medium text-slate-400 truncate leading-tight mt-0.5">
              Subcontractor RAG Platform
            </p>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 md:hidden text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 touch-pan-y">
        {NAV_GROUPS.map(group => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                {group.title}
              </span>
              {group.badgeText && (
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-amber-400/90 border border-amber-500/20">
                  {group.badgeText}
                </span>
              )}
            </div>
            <ul className="space-y-1">
              {group.items.map(item => (
                <li key={item.label}>
                  {item.isAction ? (
                    <button
                      type="button"
                      onClick={() => handleActionClick(item.actionType)}
                      className="nav-item group w-full text-left cursor-pointer"
                    >
                      {renderItemInner(item)}
                    </button>
                  ) : (
                    <NavLink
                      to={item.to!}
                      onClick={() => onClose?.()}
                      className={({ isActive }) => `nav-item group ${isActive ? 'active' : ''}`}
                    >
                      {renderItemInner(item)}
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Profile & Settings Footer */}
      <div className="p-3 border-t border-slate-800/80 shrink-0">
        <div
          onClick={onOpenSettings}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700/80 transition-all duration-200 cursor-pointer group"
          title="Edit User Profile Settings"
        >
          <div className="relative shrink-0">
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold text-white shadow-sm ring-1 ring-emerald-500/40" 
              style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }}
            >
              {userInitials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
              {userName || 'General Contractor'}
            </p>
            <p className="text-[10px] font-medium text-slate-400 truncate">GC Compliance Admin</p>
          </div>
          <Settings className="h-4 w-4 text-slate-400 group-hover:text-emerald-400 shrink-0 transition-colors" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside
        className="hidden md:flex flex-col h-full w-64 shrink-0 z-20 border-r border-slate-800/80"
        style={{ background: 'var(--color-bg-sidebar)' }}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <aside 
            className="relative flex flex-col h-full w-64 max-w-[85vw] z-10 shadow-2xl border-r border-slate-800/80 animate-in slide-in-from-left duration-200"
            style={{ background: 'var(--color-bg-sidebar)' }}
          >
            {content}
          </aside>
        </div>
      )}
    </>
  );
}


