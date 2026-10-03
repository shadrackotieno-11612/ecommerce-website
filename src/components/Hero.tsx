import React from 'react';
import { useI18n } from '../i18n/index.tsx';
import { ShieldCheck, Zap, Truck, ArrowRight, MessageSquare } from 'lucide-react';

interface HeroProps {
  onExploreProducts: () => void;
  onExploreServices: () => void;
  onOpenChatbot?: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreProducts,
  onExploreServices,
  onOpenChatbot,
}) => {
  const { t } = useI18n();

  return (
    <div className="relative overflow-hidden bg-theme-bg text-theme-text py-16 md:py-24 border-b-2 border-theme-border transition-colors">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-theme-elevated border-2 border-theme-border text-theme-text text-xs font-black tracking-wide shadow-xs">
              <span className="text-base leading-none">🦁</span>
              <span>Zawadi Kenya • Premier Marketplace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] font-['Outfit',sans-serif] text-theme-text">
              {t.hero.title}
            </h1>

            <p className="text-theme-muted text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              {t.hero.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={onExploreProducts}
                className="px-6 py-3.5 rounded-full bg-theme-accent hover:opacity-90 text-theme-accent-text font-black text-sm sm:text-base shadow-md border-2 border-theme-border transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span>{t.hero.shopProducts}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onExploreServices}
                className="px-6 py-3.5 rounded-full bg-theme-surface hover:bg-theme-elevated text-theme-text font-bold text-sm sm:text-base border-2 border-theme-border transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{t.hero.bookServices}</span>
              </button>
              {onOpenChatbot && (
                <button
                  onClick={onOpenChatbot}
                  className="px-5 py-3.5 rounded-full bg-theme-elevated hover:opacity-90 text-theme-text border-2 border-theme-border font-bold text-sm transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 text-theme-accent" />
                  <span>Ask Simba AI</span>
                </button>
              )}
            </div>

            {/* Trust Metrics */}
            <div className="pt-6 border-t-2 border-theme-border flex flex-wrap items-center justify-center lg:justify-start gap-8 text-xs text-theme-muted font-bold">
              <div className="flex items-center gap-2">
                <span className="font-black text-theme-text text-base">KES 0</span>
                <span>Delivery on Nairobi Services & 1 KES Voucher</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-theme-text text-base">6</span>
                <span>Global Languages</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-theme-text text-base">100%</span>
                <span>M-Pesa Verified</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-theme-border bg-theme-surface aspect-4/3 group">
                <img
                  src="https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=1000&q=80"
                  alt="Kenyan Coffee & Artisan Crafts"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

                {/* Floating M-Pesa Badge */}
                <div className="absolute top-4 right-4 bg-theme-surface/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border-2 border-emerald-500 flex items-center gap-2 text-xs font-black text-emerald-700 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Lipa na M-Pesa Online
                </div>

                {/* Bottom Overlay Label */}
                <div className="absolute bottom-4 left-4 right-4 bg-theme-surface/95 backdrop-blur-md p-3.5 rounded-2xl border-2 border-theme-border text-theme-text shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-theme-accent font-extrabold uppercase tracking-wider">
                        Origin Certified
                      </div>
                      <div className="font-black text-sm sm:text-base text-theme-text">Kenyan AA Gourmet Coffee & Crafts</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-theme-muted font-bold">From</div>
                      <div className="text-base font-black text-theme-accent">KES 1</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Pillar Feature Cards */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-theme-surface border-2 border-theme-border hover:border-theme-accent transition shadow-xs text-theme-text">
            <div className="w-10 h-10 rounded-xl bg-theme-elevated text-theme-accent flex items-center justify-center mb-3 border-2 border-theme-border">
              <ShieldCheck className="w-5 h-5 text-theme-accent" />
            </div>
            <h2 className="text-base font-black text-theme-text mb-1.5">{t.hero.feature1Title}</h2>
            <p className="text-xs text-theme-muted leading-relaxed font-medium">{t.hero.feature1Desc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-theme-surface border-2 border-theme-border hover:border-theme-accent transition shadow-xs text-theme-text">
            <div className="w-10 h-10 rounded-xl bg-theme-elevated text-theme-accent flex items-center justify-center mb-3 border-2 border-theme-border">
              <Zap className="w-5 h-5 text-theme-accent" />
            </div>
            <h2 className="text-base font-black text-theme-text mb-1.5">{t.hero.feature2Title}</h2>
            <p className="text-xs text-theme-muted leading-relaxed font-medium">{t.hero.feature2Desc}</p>
          </div>

          <div className="p-6 rounded-2xl bg-theme-surface border-2 border-theme-border hover:border-theme-accent transition shadow-xs text-theme-text">
            <div className="w-10 h-10 rounded-xl bg-theme-elevated text-theme-accent flex items-center justify-center mb-3 border-2 border-theme-border">
              <Truck className="w-5 h-5 text-theme-accent" />
            </div>
            <h2 className="text-base font-black text-theme-text mb-1.5">{t.hero.feature3Title}</h2>
            <p className="text-xs text-theme-muted leading-relaxed font-medium">{t.hero.feature3Desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
