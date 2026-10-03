import React, { useState } from 'react';
import { useI18n } from '../i18n/index.tsx';
import { LionLogo } from './LionLogo.tsx';
import { X, MapPin, Phone, Mail, Clock, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';

export const ContactModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onOpenChatbot?: () => void;
}> = ({
  isOpen,
  onClose,
  onOpenChatbot,
}) => {
  const { t } = useI18n();
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  const handleLaunchChatbot = () => {
    onClose();
    if (onOpenChatbot) {
      onOpenChatbot();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-theme-surface border-2 border-theme-border rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto text-theme-text">
        <div className="flex items-center justify-between border-b-2 border-theme-border pb-3">
          <LionLogo size="sm" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-elevated transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chatbot Assistance Callout */}
        <div className="p-4 rounded-2xl bg-theme-elevated border-2 border-theme-border flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-theme-accent">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simba AI Instant Assistance</span>
            </div>
            <p className="text-[11px] text-theme-muted leading-snug">
              Need immediate help with Safaricom M-Pesa, stock availability, or safari bookings? Our AI concierge is active 24/7!
            </p>
          </div>
          <button
            type="button"
            onClick={handleLaunchChatbot}
            className="px-3.5 py-2 rounded-xl bg-theme-accent hover:opacity-90 text-theme-accent-text font-bold text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-md border-2 border-theme-border"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Now</span>
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-theme-text">Message Received!</h4>
            <p className="text-xs text-theme-muted">
              Asante sana! Our Nairobi support team will respond to your inquiry shortly via email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-theme-elevated border-2 border-theme-border space-y-1.5 text-theme-text">
              <div className="flex items-center gap-2 font-bold text-theme-text">
                <MapPin className="w-3.5 h-3.5 text-theme-accent" />
                <span>{t.footer.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-theme-accent" />
                <span>{t.footer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-theme-accent" />
                <span>{t.footer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-theme-accent" />
                <span>{t.footer.hours}</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-theme-text mb-1">{t.checkout.fullName} *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="David Kiprono"
                className="w-full px-3.5 py-2.5 bg-theme-surface border-2 border-theme-border rounded-xl text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
              />
            </div>

            <div>
              <label className="block font-bold text-theme-text mb-1">{t.checkout.email} *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="david@example.com"
                className="w-full px-3.5 py-2.5 bg-theme-surface border-2 border-theme-border rounded-xl text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
              />
            </div>

            <div>
              <label className="block font-bold text-theme-text mb-1">Message *</label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we assist your order or service booking?"
                className="w-full px-3.5 py-2.5 bg-theme-surface border-2 border-theme-border rounded-xl text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-theme-accent hover:opacity-90 text-theme-accent-text font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer border-2 border-theme-border"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
