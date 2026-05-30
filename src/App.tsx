import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchForm } from './components/SearchForm';
import { fetchLocations, fetchTours } from './data';
import { SearchParams, Tour } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Info, Compass } from 'lucide-react';
import { TourCard } from './components/TourCard';
import { AIChatbot } from './components/AIChatbot';
import ReviewsSection from './components/ReviewsSection';

export default function App() {
  const [allTours, setAllTours] = useState<Tour[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [isToursLoading, setIsToursLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentParams, setCurrentParams] = useState<SearchParams | null>(null);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [toursError, setToursError] = useState<string | null>(null);
  const [destinations, setDestinations] = useState<string[]>([]);

  const displayTours = hasSearched ? tours : allTours;

  const handleSearch = React.useCallback((params: SearchParams) => {
    if (!params.destination) {
      setHasSearched(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setCurrentParams(params);
    setExternalError(null);

    const filteredTours = allTours.filter(t => t.location === params.destination);
    setTours(filteredTours);
    setIsSearching(false);
    setHasSearched(true);
  }, [allTours]);

  const handleParamsChange = React.useCallback((params: SearchParams) => {
    setCurrentParams(params);
    if (params.checkIn && params.checkOut) {
      setExternalError(null);
    }
  }, []);

  const handleDateError = React.useCallback(() => {
    setExternalError('Please select Tour Dates in the search form above first');
    // Clear error after 5 seconds
    setTimeout(() => setExternalError(null), 5000);
  }, []);

  const handleDateSuccess = React.useCallback(() => setExternalError(null), []);

  const handleLogoClick = React.useCallback(() => {
    setHasSearched(false);
    setTours([]);
    setCurrentParams({
      destination: '',
      checkIn: '',
      checkOut: '',
      adults: 1,
      children: 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Initial featured content
  useEffect(() => {
    setHasSearched(false);
    setCurrentParams({
      destination: '',
      checkIn: '',
      checkOut: '',
      adults: 1,
      children: 0
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        setIsToursLoading(true);
        setToursError(null);
        const [loadedTours, loadedLocations] = await Promise.all([
          fetchTours(),
          fetchLocations(),
        ]);

        if (!isMounted) return;

        setAllTours(loadedTours);
        setDestinations(loadedLocations);
      } catch (error) {
        if (!isMounted) return;

        console.error('Failed to load tours:', error);
        setToursError(error instanceof Error ? error.message : 'Failed to load tours.');
      } finally {
        if (isMounted) {
          setIsToursLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Top Section with Background Image */}
      <div className="relative">
        {/* Background Image */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("/images/hero-bg.png")',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#1F91C7]/70 via-[#08AFC4]/55 to-[#174B69]/90"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Header onLogoClick={handleLogoClick} />
          
          {/* Hero Section */}
          <section className="pt-12 pb-24 px-4">
            <div className="max-w-7xl mx-auto text-center md:text-left">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-md"
              >
                <span className="text-[#F9B31C]">Your gateway to Palawan's most stunning destinations with</span> <br className="hidden md:block" />
                <span className="text-white">Jcalbert Travel & Tours</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-lg md:text-xl text-white font-medium max-w-2xl drop-shadow"
              >
                Find the best deals in El Nido, Port Barton, Puerto Princesa & Coron.
              </motion.p>
            </div>
          </section>
        </div>
      </div>

      {/* Search Form Container */}
      <div className="px-4">
        <SearchForm
          onSearch={handleSearch}
          onParamsChange={handleParamsChange}
          externalError={externalError}
          initialDestination={currentParams?.destination}
          destinations={destinations}
          isLocationsLoading={isToursLoading}
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar / Filters (Desktop Only) */}
          {hasSearched && (
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Info size={18} className="text-[#1F91C7]" />
                  <span>Travel Info</span>
                </h2>
                <div className="space-y-4 text-sm text-gray-600">
                  <p>Palawan is consistently voted as one of the best islands in the world.</p>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="font-bold text-gray-800 mb-2">Top Destinations</p>
                    <ul className="space-y-2">
                      {destinations.map((destinationName) => (
                        <li key={destinationName} className="flex items-center gap-2 hover:text-[#1F91C7] cursor-pointer">
                          <MapPin size={14} /> {destinationName}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Results Area */}
          <div className="flex-1">
            {hasSearched && (
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {currentParams?.destination}: {tours.length} tours found
                </h2>
                <button 
                  onClick={handleLogoClick}
                  className="text-[#1F91C7] font-semibold hover:underline text-sm"
                >
                  Clear search
                </button>
              </div>
            )}

            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-[#1F91C7] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Finding the best deals for you...</p>
              </div>
            ) : isToursLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-[#F9B31C] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Loading tours from the database...</p>
              </div>
            ) : toursError ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl border border-red-200 p-8 text-center"
              >
                <p className="text-xl font-bold text-gray-800">Unable to load tours</p>
                <p className="text-gray-500 mt-2">{toursError}</p>
              </motion.div>
            ) : (
              <div className="space-y-16">
                {/* Tour Packages Section */}
                {displayTours.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 border-l-4 border-[#F9B31C] pl-4">
                      <Compass className="text-[#F9B31C]" size={24} />
                      <h2 className="text-2xl font-bold text-gray-900">
                        {hasSearched ? 'Search Results' : 'All Tours'}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      {displayTours.map((tour) => (
                        <TourCard 
                          key={tour.id} 
                          tour={tour} 
                          allTours={allTours}
                          searchParams={currentParams} 
                          onDateError={handleDateError}
                          onDateSuccess={handleDateSuccess}
                        />
                      ))}
                    </div>

                  </motion.div>
                )}



                {hasSearched && !tours.length && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-white rounded-xl border border-gray-200 p-12 text-center"
                  >
                    <p className="text-xl font-bold text-gray-800">No tours found</p>
                    <p className="text-gray-500 mt-2">Try adjusting your filters or destination.</p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reviews Section */}
      <ReviewsSection />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 mt-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold mb-4">Jcalbert Travel & Tours Services</h3>
            <p className="text-gray-400 max-w-md">
              Your trusted partner for exploring the beautiful islands of Palawan. 
              We provide the best rates and curated experiences for your dream vacation.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-gray-500 text-xs">
          © 2026 Jcalbert Travel & Tours Services. All rights reserved.
        </div>
      </footer>

      <AIChatbot />
    </div>
  );
}
