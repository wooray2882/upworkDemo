import React, { useState } from 'react';
import { Bot, Send, Sparkles, Database, Search, FileText, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  sources?: string[];
  timestamp: string;
}

export const RAGAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'bot',
      text: 'Hello! I am your Pinecone RAG Compliance Assistant. You can ask plain-language questions about your stored subcontractor COIs, trade licenses, or worker comp policies.',
      timestamp: '12:00 PM',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const samplePrompts = [
    'Which electrician has a worker comp policy expiring this month?',
    'Does Hoosier Framing have active $2M General Liability coverage?',
    'List all subcontractors working on the Keystone Office Plaza job site.',
    'Are there any low-confidence document classifications in review?'
  ];

  const handleSendQuery = (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsSearching(true);

    setTimeout(() => {
      let botResponse = "Based on vector search embeddings across your S3 documents in Pinecone:";
      let sources = ["s3://indiana-compliance-docs/coi-apex-electrical-2025.pdf"];

      if (queryText.toLowerCase().includes('electrician') || queryText.toLowerCase().includes('apex')) {
        botResponse = "Apex Electrical Services LLC has an active Certificate of Insurance (Travelers Indemnity Co, Policy #TRV-8849201-IN) with $2,000,000 General Liability coverage. Expiration Date: October 1, 2026 (42 days remaining). Status: 🟢 EMERALD (Fully Compliant).";
        sources = ["s3://indiana-compliance-docs/coi-apex-electrical-2025.pdf", "Pinecone Index: sub-101-embeddings"];
      } else if (queryText.toLowerCase().includes('hoosier') || queryText.toLowerCase().includes('framing')) {
        botResponse = "Hoosier Framing & Concrete Corp (Contact: Sarah Jenkins) has a LAPSED Certificate of Insurance (Liberty Mutual #LM-9940122) that expired on August 1, 2026 (19 days overdue). Coverage amount was $1,000,000. Status: 🔴 ROSE (Non-Compliant). An automated SMS reminder was escalated.";
        sources = ["s3://indiana-compliance-docs/coi-hoosier-framing-lapsed.pdf"];
      } else if (queryText.toLowerCase().includes('keystone') || queryText.toLowerCase().includes('job site')) {
        botResponse = "Subcontractors assigned to Keystone Office Plaza Phase 2:\n1. Apex Electrical Services LLC (🟢 EMERALD)\n2. River City HVAC & Refrigeration (🟢 EMERALD)\nBoth vendors have verified active coverage.";
        sources = ["DynamoDB Index: client-indiana-gc-01", "Pinecone Chunk Vector 4091"];
      } else {
        botResponse = `Verified search for "${queryText}": Found 2 matching document chunks. All general liability limits meet the $1,000,000 minimum Indiana commercial requirement.`;
        sources = ["Pinecone Vector Namespace: client-indiana-gc-01"];
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botResponse,
        sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      setIsSearching(false);
    }, 1200);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-400" />
            Pinecone RAG Plain-Language Assistant
          </h2>
          <p className="text-xs text-slate-400">
            Query your own subcontractor insurance certificates and trade licenses in plain English
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge-sky flex items-center gap-1">
            <Database className="w-3 h-3 text-sky-400" />
            Pinecone Serverless Vector DB
          </span>
        </div>
      </div>

      {/* Suggested Prompts */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendQuery(prompt)}
            className="p-3 text-left rounded-lg bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer flex items-center justify-between"
          >
            <span>{prompt}</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </button>
        ))}
      </div>

      {/* Chat Container */}
      <div className="card-panel h-[480px] flex flex-col justify-between overflow-hidden">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-3.5 rounded-xl max-w-xl space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-slate-950 font-semibold'
                    : 'bg-slate-950 border border-slate-800 text-slate-200'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                {msg.sources && (
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                    <p className="font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Vector Sources (Pinecone RAG):
                    </p>
                    {msg.sources.map((src, i) => (
                      <p key={i} className="font-mono text-slate-400">{src}</p>
                    ))}
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  GC
                </div>
              )}
            </div>
          ))}

          {isSearching && (
            <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Querying Pinecone vector embeddings & generating response...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask anything about subcontractor compliance..."
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendQuery(inputQuery)}
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
          <button
            onClick={() => handleSendQuery(inputQuery)}
            className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-slate-950" />
            <span>Ask</span>
          </button>
        </div>

      </div>

    </div>
  );
};
