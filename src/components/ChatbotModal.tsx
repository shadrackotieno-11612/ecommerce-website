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
  'Jambo! Niambie kuhusu JITU STOREs (Swahili)',
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
        'Jambo! Welcome to JITU STOREs. I am Simba AI, your dedicated customer concierge. How may I assist you with our Kenyan goods, professional trade services, or Safaricom M-Pesa payments today?',
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
        content: data.reply || 'Thank you for reaching out to JITU STOREs. How else may I assist you?',
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
          content: 'I experienced a brief connection hiccup. You can also reach our Nairobi office at support@jitustores.co.ke or call +254 700 123 456.',
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
          'Jambo! Welcome to JITU STOREs. How can I assist you with your orders, products, or services?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl flex flex-col h-[620px] max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150 text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Lion Head Avatar */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-1 flex items-center justify-center text-stone-950 font-black shadow-md shadow-amber-500/20">
              <span className="text-xl">🦁</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-extrabold text-white text-base">
                <span>Simba AI</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  JITU Support
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active 24/7 • Speaks 6 Languages</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition cursor-pointer"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-stone-900/90 text-xs sm:text-sm">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
              >
                {!isUser ? (
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-sm shrink-0 mt-0.5">
                    🦁
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-line shadow-xs ${
                    isUser
                      ? 'bg-emerald-700 text-white rounded-tr-xs font-medium'
                      : 'bg-stone-800 text-stone-100 rounded-tl-xs border border-stone-700/60'
                  }`}
                >
                  <p>{msg.content}</p>
                  <span
                    className={`block text-[10px] mt-1 text-right ${
                      isUser ? 'text-emerald-200' : 'text-stone-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-stone-400 text-xs pl-9">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-stone-500 text-[11px] ml-1">Simba is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 bg-stone-950/60 border-t border-stone-800/80 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="px-2.5 py-1 rounded-full text-[11px] bg-stone-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 border border-stone-700 text-stone-300 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Human Contact Link Banner */}
        {onSwitchToEmailForm && (
          <div className="px-4 py-1.5 bg-stone-950 text-[11px] text-stone-400 border-t border-stone-800 flex items-center justify-between">
            <span>Need human agent email dispatch?</span>
            <button
              onClick={onSwitchToEmailForm}
              className="text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Mail className="w-3 h-3" />
              <span>Send Direct Inquiry</span>
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3.5 bg-stone-950 border-t border-stone-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Simba anything about products, M-Pesa, or services..."
              className="flex-1 px-4 py-2.5 bg-white border-2 border-stone-300 rounded-2xl text-xs text-black font-semibold placeholder:text-stone-500 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
