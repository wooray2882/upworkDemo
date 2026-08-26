import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I am your IndyComply RAG Assistant. Ask me plain-language questions about stored subcontractor COIs, trade licenses, or worker comp policies.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMessage]);
    const userQuery = input;
    setInput('');

    setTimeout(() => {
      let botText = "Verified vector search across your S3 documents in Pinecone:";
      if (userQuery.toLowerCase().includes('electrician') || userQuery.toLowerCase().includes('apex')) {
        botText = "Apex Electrical Services LLC has an active Certificate of Insurance (Travelers Indemnity Co, Policy #TRV-8849201-IN) with $2,000,000 General Liability. Expiration: Oct 1, 2026. Status: 🟢 EMERALD (Compliant).";
      } else if (userQuery.toLowerCase().includes('hoosier') || userQuery.toLowerCase().includes('framing')) {
        botText = "Hoosier Framing & Concrete Corp has a LAPSED Certificate of Insurance (Liberty Mutual #LM-9940122) expired on Aug 1, 2026. Status: 🔴 ROSE (Non-Compliant). Automated SMS reminder sent.";
      } else {
        botText = `Pinecone Vector Search results for "${userQuery}": Found 2 matching document chunks. All general liability limits meet the $1,000,000 minimum Indiana commercial requirement.`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: botText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 700);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 w-11 h-11 rounded-md flex items-center justify-center shadow-lg transition-transform hover:scale-105 z-50 border border-emerald-400/30 cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
          color: 'white'
        }}
        title="Open RAG AI Assistant"
      >
        <i className={`ri-robot-2-line text-lg transition-transform ${isOpen ? 'rotate-90 scale-0 absolute' : 'rotate-0 scale-100 relative'}`} />
        <i className={`ri-close-line text-xl transition-transform ${isOpen ? 'rotate-0 scale-100 relative' : '-rotate-90 scale-0 absolute'}`} />
      </button>

      {/* Slide-over Chat Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[380px] shadow-2xl transition-transform duration-200 ease-in-out z-40 flex flex-col`}
        style={{
          background: 'var(--color-bg-sidebar)',
          borderLeft: '1px solid var(--color-border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-7 h-7 rounded-md"
              style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)' }}
            >
              <i className="ri-robot-2-line text-white text-sm" />
            </div>
            <div>
              <h2 className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>RAG Compliance Assistant</h2>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="live-dot" />
                Pinecone Vector Search Ready
              </p>
            </div>
          </div>
          <button onClick={toggleChat} className="p-1 rounded-md hover:bg-slate-800 transition-colors text-slate-400 hover:text-white cursor-pointer">
            <i className="ri-close-line text-base" />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col max-w-[88%] ${msg.role === 'user' ? 'self-end items-end ml-auto' : 'self-start items-start'}`}>
              <div
                className="p-2.5 rounded-md text-xs leading-relaxed"
                style={{
                  background: msg.role === 'user' 
                    ? 'rgba(16, 185, 129, 0.15)' 
                    : '#1e293b60',
                  color: 'var(--color-text-primary)',
                  border: msg.role === 'user'
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid #1e293b',
                }}
              >
                {msg.content}
              </div>
              <span className="text-[9px] mt-0.5 mx-1 text-slate-500">
                {msg.timestamp}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-base)' }}>
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask RAG to query COIs or check status..."
              className="w-full pl-3 pr-10 py-2 rounded-md text-xs bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="absolute right-1.5 p-1 rounded-md text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <i className="ri-send-plane-fill text-sm" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
