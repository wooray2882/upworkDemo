import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, FileText, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { sendChatQuery } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  text: string;
  timestamp: string;
  citations?: Array<{
    documentId: string;
    subcontractorId: string;
    subcontractorName: string;
    documentType: string;
    s3Uri: string;
    snippet?: string;
  }>;
}

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ASSISTANT',
      text: 'Hello! I am your IndyComply Document Assistant. Ask me anything about your company’s uploaded certificates of insurance, policy limits, or expiration dates.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Don't render chat widget for Super Admin view (scoped to client org documents)
  if (user?.role === 'SUPER_ADMIN') {
    return null;
  }

  const handleSend = async (promptToSend?: string) => {
    const text = promptToSend || inputPrompt;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'USER',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!promptToSend) setInputPrompt('');
    setLoading(true);

    try {
      const response = await sendChatQuery(text.trim());

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'ASSISTANT',
        text: response.answer,
        citations: response.citations || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ASSISTANT',
        text: "I experienced an issue fetching document answers. Please verify your connection or try rephrasing your question.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Expanded Chat Window */}
      {isOpen && (
        <div className="mb-4 w-96 md:w-[420px] h-[560px] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-slate-100 text-sm">IndyComply Assistant</h3>
                  <span className="badge-indigo text-[9px] px-1.5 py-0.2">RAG</span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Grounded strictly in your company documents
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompt Presets (If message list has only welcome) */}
          {messages.length === 1 && (
            <div className="p-3 bg-slate-950/50 border-b border-slate-800/60 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Questions:</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSend("What GL policy limits does Acme Roofing have?")}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300 transition-colors text-left cursor-pointer"
                >
                  "What policy limits does Acme Roofing have?"
                </button>
                <button
                  onClick={() => handleSend("Do any insurance policies expire in 2026?")}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-[11px] text-slate-300 transition-colors text-left cursor-pointer"
                >
                  "Do any policies expire soon?"
                </button>
              </div>
            </div>
          )}

          {/* Message Thread */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'USER' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'USER'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl rounded-bl-none text-slate-400 text-xs w-max">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Searching Knowledge Base & generating answer...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask about your subcontractor policies..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputPrompt.trim() || loading}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all transform hover:scale-105 cursor-pointer font-bold text-xs"
        >
          <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
          <span>Ask RAG Assistant</span>
        </button>
      )}

    </div>
  );
};
