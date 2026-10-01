import React from 'react';
import { Service } from '../types/index.ts';
import { useI18n } from '../i18n/index.tsx';
import { useCart } from '../context/CartContext.tsx';
import { Clock, MapPin, Star, Calendar, CheckCircle2 } from 'lucide-react';

interface ServiceCardProps {
  service: Service;
  onSelectService?: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onSelectService }) => {
  const { t, translateField, formatPrice } = useI18n();
  const { addToCart } = useCart();

  const localizedName = translateField(service.name);
  const localizedDesc = translateField(service.description);

  const handleBookService = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(service, 'service', 1);
  };

  return (
    <div
      onClick={() => onSelectService?.(service)}
      className="group bg-white rounded-2xl border-2 border-stone-200 hover:border-amber-400 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer text-stone-900"
    >
      {/* Service Image Container */}
      <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
        <img
          src={service.images[0] || 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80'}
          alt={localizedName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Location Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-stone-900 text-[11px] font-bold flex items-center gap-1 border border-stone-300 shadow-xs">
          <MapPin className="w-3 h-3 text-amber-600" />
          <span className="truncate max-w-[150px]">{service.location}</span>
        </div>

        {/* Duration Badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-stone-900 text-[11px] font-bold flex items-center gap-1 border border-stone-300 shadow-xs">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>{service.duration}</span>
        </div>
      </div>

      {/* Service Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Provider & Rating */}
          <div className="flex items-center justify-between text-xs text-stone-600 mb-1.5 font-semibold">
            <span className="font-bold text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              {service.provider}
            </span>
            <div className="flex items-center text-amber-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-current mr-0.5 text-amber-600" />
              <span>{service.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-black text-stone-950 group-hover:text-amber-700 transition line-clamp-1 text-sm sm:text-base leading-snug">
            {localizedName}
          </h3>

          {/* Description */}
          <p className="text-stone-600 text-xs line-clamp-2 mt-1 leading-relaxed font-medium">
            {localizedDesc}
          </p>
        </div>

        {/* Price & Book Button */}
        <div className="mt-4 pt-3 border-t-2 border-stone-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-stone-500 uppercase font-bold">
              Fixed Service Fee
            </div>
            <div className="text-base sm:text-lg font-black text-amber-700 font-['Outfit',sans-serif]">
              {formatPrice(service.price)}
            </div>
          </div>

          <button
            onClick={handleBookService}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-stone-950 transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-amber-600 active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.services.bookService}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
