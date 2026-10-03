import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/index.tsx';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  MessageSquare,
  HelpCircle,
  Mail,
  ChevronRight,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatbotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToEmailForm?: () => void;
}

const QUICK_PROMPTS = [
  'How do I pay with Safaricom M-Pesa?',
  'What is special about Kenyan AA Coffee?',
  'Can I book a Safari tour and buy goods together?',
  'How does delivery across Kenyan counties work?',
  'Jambo! Niambie kuhusu Zawadi Kenya (Swahili)',
];

export const ChatbotModal: React.FC<ChatbotModalProps> = ({
  isOpen,
  onClose,
  onSwitchToEmailForm,
}) => {
  const { language } = useI18n();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Jambo! Welcome to Zawadi Kenya. I am Simba AI, your dedicated customer concierge. How may I assist you with our Kenyan goods, professional trade services, or Safaricom M-Pesa payments today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const historyForApi = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: historyForApi,
          language,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Thank you for reaching out to Zawadi Kenya. How else may I assist you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Failed to send chat message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          role: 'assistant',
          content: 'I experienced a brief connection hiccup. You can also reach our Nairobi office at shadiotis2@gmail.com or call +254 712 345 678.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Jambo! Welcome to Zawadi Kenya. How can I assist you with your orders, products, or services?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-theme-surface border-2 border-theme-border rounded-3xl shadow-2xl flex flex-col h-[640px] max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150 text-theme-text">
        {/* Header */}
        <div className="px-5 py-4 bg-theme-elevated border-b-2 border-theme-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Lion Head Avatar */}
            <div className="w-10 h-10 rounded-2xl bg-amber-500 p-1 flex items-center justify-center text-slate-950 font-black shadow-md border-2 border-amber-600">
              <span className="text-xl">🦁</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-extrabold text-theme-text text-base">
                <span>Simba AI</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40">
                  Zawadi Concierge
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active 24/7 • Multilingual AI</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="p-2 rounded-xl text-theme-text/80 hover:text-theme-text hover:bg-theme-surface transition cursor-pointer"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-theme-text/80 hover:text-theme-text hover:bg-theme-surface transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-theme-surface text-sm">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {!isUser ? (
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 border-2 border-amber-500/40 flex items-center justify-center text-base shrink-0 mt-0.5 shadow-xs">
                    🦁
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 border-2 border-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <User className="w-4 h-4 font-bold" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] px-4 py-3 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs text-sm ${
                    isUser
                      ? 'bg-amber-500 text-slate-950 font-bold rounded-tr-xs shadow-sm'
                      : 'bg-theme-elevated text-theme-text rounded-tl-xs border-2 border-theme-border font-medium'
                  }`}
                >
                  <p className="leading-relaxed">{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-1.5 font-medium ${
                      isUser ? 'text-slate-900/80 text-right' : 'text-theme-muted text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-bold text-xs pl-10">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs ml-1 font-bold">Simba is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2.5 bg-theme-elevated border-t-2 border-theme-border overflow-x-auto flex gap-2 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-theme-surface hover:bg-amber-500 hover:text-slate-950 border-2 border-theme-border text-theme-text transition whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Human Contact Link Banner */}
        {onSwitchToEmailForm && (
          <div className="px-4 py-2 bg-theme-elevated text-xs text-theme-muted border-t-2 border-theme-border flex items-center justify-between font-medium">
            <span>Need human agent email dispatch?</span>
            <button
              onClick={onSwitchToEmailForm}
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-extrabold cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Direct Inquiry</span>
            </button>
          </div>
        )}

        {/* Bright, high-contrast Input Bar */}
        <div className="p-4 bg-theme-elevated border-t-2 border-theme-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Simba anything about products, M-Pesa, or services..."
                className="w-full px-4 py-3 bg-white text-slate-950 dark:bg-slate-900 dark:text-white border-2 border-amber-500 rounded-2xl text-xs sm:text-sm font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-inner focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:border-amber-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md border-2 border-amber-600 flex items-center justify-center shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4 font-bold" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
