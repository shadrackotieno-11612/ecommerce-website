import React from 'react';
import { useI18n } from '../i18n/index.tsx';
import { LionLogo } from './LionLogo.tsx';
import { X, MapPin, Coffee, Globe } from 'lucide-react';

export const AboutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-theme-surface border-2 border-theme-border rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[85vh] overflow-y-auto text-theme-text">
        <div className="flex items-center justify-between border-b-2 border-theme-border pb-4">
          <LionLogo size="sm" />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-theme-muted hover:text-theme-text hover:bg-theme-elevated transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-extrabold text-theme-text text-lg font-['Outfit',sans-serif]">
            About Zawadi Kenya
          </h3>
          <p className="text-theme-muted text-xs sm:text-sm leading-relaxed">
            {t.footer.aboutText}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-theme-elevated border-2 border-theme-border space-y-1">
            <Coffee className="w-4 h-4 text-theme-accent" />
            <div className="font-bold text-theme-text">Direct Trade Origin</div>
            <p className="text-theme-muted text-[11px]">
              Direct ethical sourcing from artisan cooperatives across Mount Kenya, the Great Rift Valley, and the Swahili Coast.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-theme-elevated border-2 border-theme-border space-y-1">
            <Globe className="w-4 h-4 text-theme-accent" />
            <div className="font-bold text-theme-text">6 Global Languages</div>
            <p className="text-theme-muted text-[11px]">
              Connecting Kenyan merchants to the world in English, Swahili, Luganda, Chinese, Spanish, and Portuguese.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-theme-elevated border-2 border-theme-border space-y-2 text-xs">
          <div className="flex items-center gap-2 text-theme-text font-bold">
            <MapPin className="w-4 h-4 text-theme-accent" />
            <span>Nairobi Headquarters</span>
          </div>
          <div className="text-theme-muted pl-6 space-y-1">
            <p>Kimathi Street, City Centre, Nairobi, Kenya</p>
            <p className="text-[11px]">Official Commercial License: PVT-ZAWADI2026-KE</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-theme-accent hover:opacity-90 text-theme-accent-text font-bold text-xs transition cursor-pointer border-2 border-theme-border shadow-xs"
        >
          {t.common.close}
        </button>
      </div>
    </div>
  );
};
