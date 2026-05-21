import React, { useState } from 'react';
import { Tour, SearchParams } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ChevronRight, MapPin, ChevronLeft } from 'lucide-react';
import { BookingModal } from './BookingModal';

interface TourCardProps {
  tour: Tour;
  allTours: Tour[];
  searchParams?: SearchParams | null;
  onDateError?: () => void;
  onDateSuccess?: () => void;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, allTours, searchParams, onDateError, onDateSuccess }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleBookNow = () => {
    if (!searchParams?.checkIn || !searchParams?.checkOut) {
      if (onDateError) onDateError();
      // Scroll to search form
      const searchForm = document.querySelector('form');
      if (searchForm) {
        searchForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    if (onDateSuccess) onDateSuccess();
    setIsBookingModalOpen(true);
  };

  const carouselImages = tour.images || [
    tour.image || 'https://picsum.photos/seed/palawan/800/600', // Tour places fallback
    'https://picsum.photos/seed/palawan-food/800/600', // Food
    'https://picsum.photos/seed/palawan-hotel/800/600', // Accommodations
  ];

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-[#BDEEFF] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row"
    >
      {/* Image Section / Carousel */}
      <div className="relative w-full md:w-72 h-56 md:h-auto shrink-0 group overflow-hidden">
        <div className="relative w-full h-full overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.img 
              key={currentImageIndex}
              src={typeof carouselImages[currentImageIndex] === 'string' 
                ? carouselImages[currentImageIndex] as string 
                : (carouselImages[currentImageIndex] as { url: string }).url} 
              alt={`${tour.name} - image ${currentImageIndex + 1}`}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          
          {/* Floating Label / Badge */}
          <AnimatePresence>
            {typeof carouselImages[currentImageIndex] !== 'string' && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                key={`label-${currentImageIndex}`}
                className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none px-4 z-20"
              >
                <div className="bg-black/70 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-2xl border border-white/20 tracking-widest uppercase flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-[#F9B31C] animate-pulse" />
                  {(carouselImages[currentImageIndex] as { label: string }).label}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="absolute top-3 left-3 bg-[#F9B31C] text-[#174B69] px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-md z-10">
          Tour Package
        </div>

        {/* Carousel Controls - Always visible */}
        <button 
          onClick={prevImage}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#1F91C7] text-white p-2 rounded-full z-20 transition-all active:scale-90 backdrop-blur-md border border-white/20 shadow-lg"
          aria-label="Previous image"
        >
          <ChevronLeft size={18} />
        </button>
        <button 
          onClick={nextImage}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-[#1F91C7] text-white p-2 rounded-full z-20 transition-all active:scale-90 backdrop-blur-md border border-white/20 shadow-lg"
          aria-label="Next image"
        >
          <ChevronRight size={18} />
        </button>

        {/* Carousel Indicators - Larger, Pill-shaped, and Clickable */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {carouselImages.map((_, i) => (
            <button 
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-500 shadow-md ${
                i === currentImageIndex 
                  ? 'bg-[#F9B31C] w-8' 
                  : 'bg-white/40 hover:bg-white/80 w-2'
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-[#174B69]">
              {tour.name}
            </h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin size={14} className="mr-1" />
              <span>{tour.location}, Palawan</span>
            </div>
          </div>
          {tour.isBestSeller && (
            <div className="bg-[#E5F8FF] text-[#174B69] px-3 py-1 rounded-full text-xs font-bold">
              Best Seller
            </div>
          )}
        </div>

        <div className="mt-3 flex-1">
          <div className="text-sm text-gray-600">
            <p>
              {tour.description}
              {!isExpanded && (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="text-[#1F91C7] font-bold ml-1 hover:underline focus:outline-none"
                >
                  More...
                </button>
              )}
            </p>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-3 bg-[#E5F8FF] rounded-lg border border-[#BDEEFF]">
                    <p className="font-bold text-[#174B69] mb-2">
                      {tour.name.includes('Underground River') || 
                       tour.name.includes('City Tour') || 
                       tour.name.includes('Honda Bay') || 
                       tour.name.includes('Firefly') ||
                       tour.name.includes('Port Barton')
                       ? 'Inclusions:' : 'Activities on all tour set:'}
                    </p>
                    <ul className={cn(
                      "grid gap-y-1",
                      (tour.name.includes('Underground River') || 
                       tour.name.includes('City Tour') || 
                       tour.name.includes('Honda Bay') || 
                       tour.name.includes('Firefly') ||
                       tour.name.includes('Port Barton')) 
                       ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {(() => {
                        if (tour.name.includes('Underground River')) {
                          return [
                            'Visitor Entry Permit',
                            'Round Trip Van Transfer',
                            'DOT Accredited Tour Guide',
                            'Boat, Terminal, and Wharf Fees',
                            'Buffet Lunch',
                            'Audio Fee',
                            'Free Lunch'
                          ];
                        }
                        if (tour.name.includes('City Tour')) {
                          return [
                            'Round Trip Van Transfer',
                            'DOT Accredited Tour Guide',
                            'Entrance Fees/Light Snacks'
                          ];
                        }
                        if (tour.name.includes('Honda Bay')) {
                          return [
                            'Round Trip Van Transfer',
                            'DOT Accredited Tour Guide',
                            'Boat, Terminal, and Wharf Fees',
                            'Islands Entrance and Shed Fees',
                            'Buffet Lunch'
                          ];
                        }
                        if (tour.name.includes('Firefly')) {
                          return [
                            'Boat',
                            'Tour Guide',
                            'Dinner on Boat'
                          ];
                        }
                        if (tour.name.includes('Port Barton')) {
                          return [
                            'Licensed Boat',
                            'Boat Captain & Crews',
                            'Local Guide Fees',
                            'Island Entrance Fees',
                            'Buffet Lunch and Refreshment',
                            'Free use of Snorkeling Mask',
                            'Free Underwater Picture/Video',
                            'Free Drone Picture/Video',
                            'Free Use of Towels'
                          ];
                        }
                        return tour.activities || ['Swimming', 'Kayaking', 'Snorkeling', 'Picture Taking'];
                      })().map((activity) => (
                        <li key={activity} className="flex items-center gap-2 text-gray-700">
                          <span className="text-[#F9B31C]">•</span>
                          {activity}
                        </li>
                      ))}
                    </ul>

                    {tour.name.includes('Honda Bay') && (
                      <div className="mt-4 pt-3 border-t border-[#BDEEFF]">
                        <p className="font-bold text-[#174B69] mb-2">Expected Activities:</p>
                        <ul className="grid grid-cols-1 gap-y-1">
                          {['Swimming 🏊‍♀️', 'Kayaking 🚣‍♂️', 'Snorkeling 🐠'].map((activity) => (
                            <li key={activity} className="flex items-center gap-2 text-gray-700">
                              <span className="text-[#F9B31C]">•</span>
                              {activity}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button 
                      onClick={() => setIsExpanded(false)}
                      className="text-[#1F91C7] text-xs font-bold mt-3 hover:underline focus:outline-none"
                    >
                      Show less
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="mt-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Highlights</p>
            <div className="flex flex-wrap gap-2">
              {tour.highlights.map((h) => (
                <span key={h} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-medium">
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="bg-gray-100 px-4 py-2 rounded-lg text-center shadow-sm border border-gray-200">
              {tour.originalPrice && (
                <p className="text-[16px] text-gray-400 line-through mb-0.5">
                  ₱{tour.originalPrice.toLocaleString()}
                </p>
              )}
              <p className="text-2xl font-black text-red-500 leading-none">
                ₱{tour.price.toLocaleString()}
              </p>
            </div>
            <button 
              onClick={handleBookNow}
              className="bg-[#F9B31C] text-[#174B69] px-6 py-3 rounded-lg font-bold hover:bg-[#E59B12] transition-all hover:scale-105 active:scale-95 shadow-sm flex items-center justify-center gap-1"
            >
              <span>Book Now</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        tour={tour} 
        allTours={allTours}
        searchParams={searchParams}
      />
    </motion.div>
  );
};
