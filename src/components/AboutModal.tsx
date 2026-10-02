import React from 'react';
import { useI18n } from '../i18n/index.tsx';
import { LionLogo } from './LionLogo.tsx';
import { X, ShieldCheck, MapPin, Heart, Sparkles, Coffee, Globe } from 'lucide-react';

export const AboutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto text-stone-100">
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <LionLogo size="sm" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-extrabold text-white text-lg font-['Outfit',sans-serif]">
            About Zawadi Kenya
          </h3>
          <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
            {t.footer.aboutText}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
            <Coffee className="w-4 h-4 text-amber-400" />
            <div className="font-bold text-white">Direct Trade Origin</div>
            <p className="text-stone-400 text-[11px]">
              Direct ethical sourcing from artisan cooperatives across Mount Kenya, the Great Rift Valley, and the Swahili Coast.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-1">
            <Globe className="w-4 h-4 text-amber-400" />
            <div className="font-bold text-white">6 Global Languages</div>
            <p className="text-stone-400 text-[11px]">
              Connecting Kenyan merchants to the world in English, Swahili, Luganda, Chinese, Spanish, and Portuguese.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-white font-bold">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Nairobi Headquarters</span>
          </div>
          <div className="text-stone-400 pl-6 space-y-1">
            <p>Kimathi Street, City Centre, Nairobi, Kenya</p>
            <p className="text-[11px] text-stone-500">Official Commercial License: PVT-ZAWADI2026-KE</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition cursor-pointer"
        >
          {t.common.close}
        </button>
      </div>
    </div>
  );
};
