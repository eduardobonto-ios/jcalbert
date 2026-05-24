import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Search, Plus, Minus } from 'lucide-react';
import { Destination, SearchParams, DestinationOrEmpty } from '../types';
import { cn } from '../lib/utils';

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  onParamsChange?: (params: SearchParams) => void;
  externalError?: string | null;
  initialDestination?: DestinationOrEmpty;
  destinations?: Destination[];
  isLocationsLoading?: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  onParamsChange,
  externalError,
  initialDestination = '',
  destinations = [],
  isLocationsLoading = false,
}) => {
  const [destination, setDestination] = useState<DestinationOrEmpty>(initialDestination);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
    setDestination(initialDestination);
  }, [initialDestination]);
  const [adults] = useState(1);
  const [children] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = React.useRef(true);

  const displayError = externalError || error;

  useEffect(() => {
    if (onParamsChange) {
      onParamsChange({
        destination,
        checkIn,
        checkOut,
        adults,
        children
      });
    }
    
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Automatically trigger search when destination changes
    if (destination) {
      onSearch({
        destination,
        checkIn,
        checkOut,
        adults,
        children
      });
    } else {
      // If destination is cleared, we should tell the parent to clear search results
      onSearch({
        destination: '',
        checkIn,
        checkOut,
        adults,
        children
      });
    }
  }, [destination, checkIn, checkOut, adults, children, onParamsChange, onSearch]);

  useEffect(() => {
    if (checkIn && checkOut && new Date(checkIn) > new Date(checkOut)) {
      setError('Tour date from: cannot be greater than Tour date to:');
    } else {
      setError(null);
    }
  }, [checkIn, checkOut]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (checkIn && checkOut && new Date(checkIn) > new Date(checkOut)) {
      setError('Tour date from: cannot be greater than Tour date to:');
      return;
    }

    setError(null);
    onSearch({
      destination,
      checkIn,
      checkOut,
      adults,
      children
    });
  };

  return (
    <form 
      className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-2 md:p-1 border-4 border-[#1F91C7] -mt-8 relative z-10"
    >
      {displayError && (
        <div className="bg-red-500 text-white text-[10px] py-1 px-4 font-bold text-center uppercase tracking-widest">
          {displayError}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-stretch gap-1">
        {/* Destination */}
        <div className="flex-1 flex items-center px-6 py-4 border-b sm:border-b-0 sm:border-r border-gray-200">
          <MapPin className="text-gray-400 mr-3 shrink-0" size={24} />
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destination</label>
            <select 
              value={destination}
              onChange={(e) => setDestination(e.target.value as DestinationOrEmpty)}
              className={cn(
                "w-full bg-transparent font-bold text-lg focus:outline-none cursor-pointer appearance-none",
                !destination ? "text-gray-400" : "text-gray-800"
              )}
            >
              <option value="" disabled>
                {isLocationsLoading
                  ? 'Loading destinations...'
                  : destinations.length
                  ? 'Select Destination'
                  : 'No destinations available'}
              </option>
              {destinations.map((destinationName) => (
                <option key={destinationName} value={destinationName}>
                  {destinationName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="flex-1 flex flex-col sm:flex-row border-gray-200">
          <div className={cn(
            "flex-1 flex items-center px-6 py-4 border-b sm:border-b-0 sm:border-r border-gray-200 transition-colors",
            displayError && !checkIn && "bg-red-50"
          )}>
            <Calendar className={cn("mr-3 shrink-0", displayError && !checkIn ? "text-red-400" : "text-gray-400")} size={24} />
            <div className="flex-1">
              <label className={cn("block text-[10px] font-bold uppercase tracking-wider", displayError && !checkIn ? "text-red-500" : "text-gray-400")}>Tour date from:</label>
              <input 
                type="date" 
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent font-bold text-lg text-gray-800 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
          <div className={cn(
            "flex-1 flex items-center px-6 py-4 transition-colors",
            displayError && !checkOut && "bg-red-50"
          )}>
            <Calendar className={cn("mr-3 shrink-0", displayError && !checkOut ? "text-red-400" : "text-gray-400")} size={24} />
            <div className="flex-1">
              <label className={cn("block text-[10px] font-bold uppercase tracking-wider", displayError && !checkOut ? "text-red-500" : "text-gray-400")}>Tour date to:</label>
              <input 
                type="date" 
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent font-bold text-lg text-gray-800 focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
