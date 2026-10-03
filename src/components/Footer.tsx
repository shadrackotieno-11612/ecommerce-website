import React from 'react';
import { useI18n } from '../i18n/index.tsx';
import { LionLogo } from './LionLogo.tsx';
import { ShieldCheck, MapPin, Phone, Mail, Clock, Globe, MessageSquare } from 'lucide-react';

export const Footer: React.FC<{
  onNavigate: (page: string) => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
  onOpenChatbot?: () => void;
}> = ({ onNavigate, onOpenAbout, onOpenContact, onOpenChatbot }) => {
  const { t, languages, language, setLanguage } = useI18n();

  return (
    <footer className="bg-theme-surface text-theme-text pt-16 pb-12 border-t-2 border-theme-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b-2 border-theme-border">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <LionLogo size="md" />

            <p className="text-theme-muted text-xs leading-relaxed max-w-sm font-medium">
              {t.footer.aboutText}
            </p>

            {/* M-Pesa Official Badge & AI Concierge */}
            <div className="space-y-2">
              <div className="p-3.5 rounded-2xl bg-theme-elevated border-2 border-theme-border flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-theme-surface text-theme-accent border border-theme-border flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-theme-accent" />
                </div>
                <div className="text-xs">
                  <div className="font-black text-theme-text">Safaricom Daraja Integrated</div>
                  <div className="text-theme-muted text-[11px] font-medium">Instant Lipa na M-Pesa STK Push PIN Checkout</div>
                </div>
              </div>

              {onOpenChatbot && (
                <button
                  onClick={onOpenChatbot}
                  className="w-full p-3 rounded-2xl bg-theme-elevated hover:opacity-90 border-2 border-theme-border flex items-center justify-between text-xs text-theme-text transition cursor-pointer font-bold shadow-xs"
                >
                  <div className="flex items-center gap-2 font-black">
                    <span className="text-base">🦁</span>
                    <span>Need Help? Chat with Simba AI 24/7</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-theme-accent text-theme-accent-text font-black">
                    Online
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-theme-text">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-2 text-xs text-theme-muted font-semibold">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-theme-accent transition cursor-pointer">
                  {t.nav.home}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('products')} className="hover:text-theme-accent transition cursor-pointer">
                  {t.nav.products}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('services')} className="hover:text-theme-accent transition cursor-pointer">
                  {t.nav.services}
                </button>
              </li>
              <li>
                <button onClick={onOpenAbout} className="hover:text-theme-accent transition cursor-pointer">
                  {t.nav.aboutUs}
                </button>
              </li>
              <li>
                <button onClick={onOpenContact} className="hover:text-theme-accent transition cursor-pointer">
                  {t.nav.contact}
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-theme-text">
              {t.footer.customerCare}
            </h4>
            <ul className="space-y-2 text-xs text-theme-muted font-semibold">
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-theme-accent transition cursor-pointer">
                  {t.orders.title}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-theme-accent transition cursor-pointer">
                  {t.nav.wishlist}
                </button>
              </li>
              {onOpenChatbot && (
                <li>
                  <button onClick={onOpenChatbot} className="hover:text-theme-accent transition cursor-pointer flex items-center gap-1.5 font-bold">
                    <MessageSquare className="w-3.5 h-3.5 text-theme-accent" />
                    <span>Chatbot Assistance</span>
                  </button>
                </li>
              )}
              <li>
                <button onClick={onOpenAbout} className="hover:text-theme-accent transition cursor-pointer">
                  {t.footer.deliveryInfo}
                </button>
              </li>
              <li>
                <button onClick={onOpenAbout} className="hover:text-theme-accent transition cursor-pointer">
                  {t.footer.privacyPolicy}
                </button>
              </li>
            </ul>
          </div>

          {/* Nairobi Office Contacts */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-theme-text">
              {t.footer.contactUs}
            </h4>
            <div className="space-y-2 text-xs text-theme-muted font-semibold">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
                <span>{t.footer.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-theme-accent shrink-0" />
                <span>{t.footer.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-theme-accent shrink-0" />
                <span>{t.footer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-theme-accent shrink-0" />
                <span>{t.footer.hours}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multilingual Selector Strip in Footer */}
        <div className="py-6 flex flex-wrap items-center justify-between gap-4 border-b-2 border-theme-border">
          <div className="flex items-center gap-2 text-xs text-theme-text font-bold">
            <Globe className="w-4 h-4 text-theme-accent" />
            <span>Select Interface Language:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border-2 ${
                  language === l.code
                    ? 'bg-theme-accent text-theme-accent-text border-theme-border font-black shadow-xs'
                    : 'bg-theme-surface hover:bg-theme-elevated text-theme-text border-theme-border'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.nativeName}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Verified Badges */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-theme-muted font-semibold gap-4">
          <div>
            © {new Date().getFullYear()} Zawadi Kenya Ltd. {t.footer.allRightsReserved}
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-md bg-theme-elevated border-2 border-emerald-500 text-emerald-700 font-black text-[11px]">
              SAFARICOM M-PESA
            </span>
            <span className="px-2.5 py-1 rounded-md bg-theme-elevated border-2 border-theme-border text-theme-text font-bold text-[11px]">
              AIRTEL MONEY
            </span>
            <span className="px-2.5 py-1 rounded-md bg-theme-elevated border-2 border-theme-border text-theme-text font-bold text-[11px]">
              VISA / MASTERCARD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
