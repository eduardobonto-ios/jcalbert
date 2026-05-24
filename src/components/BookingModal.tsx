import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, Plus, Trash2, MapPin, Calendar, Users } from 'lucide-react';
import { Tour, SearchParams } from '../types';
import { getApiUrl } from '../lib/api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tour: Tour;
  allTours: Tour[];
  searchParams?: SearchParams | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, tour, allTours, searchParams }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [guestList, setGuestList] = useState<{ name: string; age: string }[]>([{ name: '', age: '' }]);
  const [accommodation, setAccommodation] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [isFlightNA, setIsFlightNA] = useState(false);
  const [additionalTours, setAdditionalTours] = useState<(Tour & { date: string })[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    const flightDetails = isFlightNA 
      ? 'N/A' 
      : `Arrival: ${arrivalDate} ${arrivalTime} | Departure: ${departureDate} ${departureTime}`;

    const guestsText = guestList
      .filter(g => g.name.trim() !== '')
      .map(g => `  - ${g.name} (Age: ${g.age})`)
      .join('\n');

    const toursText = [
      `  - ${tour.name} (${searchParams?.checkIn || 'TBA'})`,
      ...additionalTours.map(at => `  - ${at.name} (${at.date || 'TBA'})`)
    ].join('\n');

    const summary = `Booking Confirmed!
Booking Number: ${bookingNumber}

CUSTOMER DETAILS:
Name: ${name}
Contact: ${contact}
Email: ${email}
Accommodation: ${accommodation || 'N/A'}
Flight Details: ${flightDetails}

TOUR PACKAGES:
${toursText}

GUEST LIST:
- ${name} (Lead Guest)
${guestsText || 'No other guests'}

PRICE SUMMARY:
Total Price: ₱${totalPrice.toLocaleString()}
Reservation Fee: ₱${reservationFee.toLocaleString()}
Balance to Pay: ₱${balance.toLocaleString()}

Thank you for booking with Jcalbert Travel & Tours Services!`;

    navigator.clipboard.writeText(summary).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Filter out the current tour and already added tours from the available options
  const availableTours = allTours.filter(t => 
    t.id !== tour.id && !additionalTours.find(at => at.id === t.id)
  );

  const handleAddTour = (tourId: string) => {
    if (!tourId) return;
    const selectedTour = allTours.find(t => t.id === tourId);
    if (selectedTour) {
      setAdditionalTours([...additionalTours, { ...selectedTour, date: '' }]);
    }
  };

  const handleUpdateTourDate = (tourId: string, date: string) => {
    setAdditionalTours(additionalTours.map(t => t.id === tourId ? { ...t, date } : t));
  };

  const handleAddGuest = () => {
    setGuestList([...guestList, { name: '', age: '' }]);
  };

  const handleUpdateGuest = (index: number, field: 'name' | 'age', value: string) => {
    const newList = [...guestList];
    newList[index] = { ...newList[index], [field]: value };
    setGuestList(newList);
  };

  const handleRemoveGuest = (index: number) => {
    if (guestList.length > 1) {
      setGuestList(guestList.filter((_, i) => i !== index));
    }
  };

  const handleRemoveTour = (tourId: string) => {
    setAdditionalTours(additionalTours.filter(t => t.id !== tourId));
  };

  const guestCount = 1 + guestList.filter(g => g.name.trim() !== '').length;
  const numberOfTours = 1 + additionalTours.length;
  const totalPrice = (tour.price + additionalTours.reduce((sum, t) => sum + t.price, 0)) * guestCount;
  const reservationFee = guestCount * 400 * numberOfTours; 
  const balance = totalPrice - reservationFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setError(null);

    // Validate Guest List: If name is provided, age is required
    const invalidGuest = guestList.find(g => g.name.trim() !== '' && g.age.trim() === '');
    if (invalidGuest) {
      setError('Age is required for all listed guests.');
      setIsSending(false);
      return;
    }
    
    // Generate a numeric booking number (fits in int8)
    const numericId = Math.floor(10000000 + Math.random() * 90000000); // 8-digit random number
    const newBookingNumber = 'JCA-' + numericId;
    setBookingNumber(newBookingNumber);

    const flightDetails = isFlightNA 
      ? 'N/A' 
      : `Arrival: ${arrivalDate} ${arrivalTime} | Departure: ${departureDate} ${departureTime}`;

    const bookingData = {
      bookingNumber: newBookingNumber,
      mainTour: tour.name,
      mainTourPrice: tour.price,
      additionalTours: additionalTours.map(t => ({ name: t.name, date: t.date, price: t.price })),
      customer: { name, contact, email },
      guestList: guestList.filter(g => g.name.trim() !== ''),
      totalGuests: guestCount,
      accommodation,
      flightDetails,
      searchParams,
      totalPrice,
      reservationFee,
      balance
    };

    try {
      const response = await fetch(getApiUrl('/api/book'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Booking API request failed (${response.status}): ${
            errorText ? errorText.replace(/\s+/g, ' ').trim() : response.statusText
          }`
        );
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const errorText = await response.text();
        throw new Error(
          `Invalid JSON response from Booking API: ${
            errorText ? errorText.slice(0, 300).replace(/\s+/g, ' ').trim() : 'empty response'
          }`
        );
      }

      const result = await response.json();

      if (result.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(result.error || 'Failed to send confirmation email');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err instanceof Error ? err.message : 'Booking confirmed, but we had trouble sending the email.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X size={24} />
          </button>

          {isSubmitted ? (
            <div className="p-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-6 w-full">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest mb-1">Booking Number</p>
                <p className="text-2xl font-black text-[#1F91C7] tracking-tight">{bookingNumber}</p>
              </div>
              <p className="text-gray-600 mb-8">
                Thank you for booking with Jcalbert Travel & Tours Services. We've sent a confirmation email with all details to <span className="font-bold">{email}</span>.
              </p>
              <div className="bg-[#E5F8FF] border border-[#BDEEFF] p-4 rounded-xl mb-6 text-left">
                <p className="text-xs text-[#174B69] font-bold mb-1">Next Step:</p>
                <p className="text-xs text-[#174B69] leading-relaxed">
                  1. Click <strong>"Copy Booking Summary"</strong> below.<br/>
                  2. Click <strong>"Send to Messenger"</strong> and paste the details.<br/>
                  3. Send the PDF voucher from your email for faster processing.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={copyToClipboard}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${isCopied ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                >
                  {isCopied ? (
                    <>
                      <CheckCircle size={18} />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Plus size={18} className="rotate-45" />
                      Copy Booking Summary
                    </>
                  )}
                </button>
                <a
                  href="https://www.facebook.com/messages/t/581849845016944"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#1F91C7] text-white py-3 rounded-xl font-bold hover:bg-[#174B69] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.914 1.45 5.513 3.71 7.138V22l3.438-1.887c.89.246 1.83.383 2.852.383 5.523 0 10-4.145 10-9.258S17.523 2 12 2zm1.074 12.53l-2.59-2.761-5.062 2.761 5.562-5.906 2.656 2.761 4.996-2.761-5.562 5.906z"/>
                  </svg>
                  Send to Messenger
                </a>
                <button 
                  onClick={onClose}
                  className="w-full bg-[#F9B31C] text-[#174B69] py-3 rounded-xl font-bold hover:bg-[#E59B12] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-[#1F91C7] p-6 text-white">
                <h2 className="text-2xl font-bold">Complete Your Booking</h2>
                <p className="text-[#E5F8FF] text-sm mt-1">You are booking: <span className="font-bold">{tour.name}</span></p>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                {/* Search Info Summary */}
                {searchParams && (
                  <div className="bg-[#E5F8FF] border border-[#BDEEFF] rounded-xl p-4 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[#1F91C7] shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-[#174B69] uppercase tracking-wider">Destination</p>
                        <p className="text-sm font-bold text-gray-800">{tour.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-[#1F91C7] shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-[#174B69] uppercase tracking-wider">Guests</p>
                        <p className="text-sm font-bold text-gray-800">{guestCount} Pax</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#1F91C7] shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-[#174B69] uppercase tracking-wider">Tour Date From</p>
                        <p className="text-sm font-bold text-gray-800">{searchParams.checkIn}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-[#1F91C7] shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-[#174B69] uppercase tracking-wider">Tour Date To</p>
                        <p className="text-sm font-bold text-gray-800">{searchParams.checkOut}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personal Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lead guest(full name)</label>
                    <input 
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                      <input 
                        required
                        type="tel"
                        value={contact}
                        onChange={(e) => setContact(e.target.value.replace(/\D/g, ''))}
                        placeholder="09123456789"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <input 
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] focus:border-transparent outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Guest List */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Other guest names (complete the form for permits)</label>
                    {guestList.map((guest, index) => (
                      <div key={index} className="flex gap-2">
                        <input 
                          type="text"
                          value={guest.name}
                          onChange={(e) => handleUpdateGuest(index, 'name', e.target.value)}
                          placeholder={`Guest ${index + 1} Name`}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] outline-none text-sm"
                        />
                        <input 
                          type="number"
                          min="0"
                          max="120"
                          value={guest.age}
                          onChange={(e) => handleUpdateGuest(index, 'age', e.target.value)}
                          placeholder="Age"
                          className="w-20 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] outline-none text-sm text-center"
                        />
                        {guestList.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => handleRemoveGuest(index)}
                            className="text-red-400 hover:text-red-600 p-2"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={handleAddGuest}
                      className="flex items-center gap-2 text-[#1F91C7] text-sm font-bold hover:text-[#174B69] transition-colors"
                    >
                      <Plus size={16} />
                      Add Guest
                    </button>
                  </div>

                  {/* Accommodation and Flight Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name of accommodation for pick up/drop:</label>
                      <input 
                        type="text"
                        value={accommodation}
                        onChange={(e) => setAccommodation(e.target.value)}
                        placeholder="e.g. Virginia Suites, El Nido"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Complete Flight Dates and Time of Arrival and Departure</label>
                        <label className="flex items-center gap-2 text-xs font-medium text-gray-500 cursor-pointer hover:text-[#1F91C7] transition-colors">
                          <input 
                            type="checkbox"
                            checked={isFlightNA}
                            onChange={(e) => setIsFlightNA(e.target.checked)}
                            className="w-3 h-3 rounded border-gray-300 text-[#1F91C7] focus:ring-[#1F91C7]"
                          />
                          N/A
                        </label>
                      </div>
                      <div className={`space-y-3 transition-opacity duration-200 ${isFlightNA ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="grid grid-cols-[1fr_1.5fr] gap-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Arrival Date</p>
                            <input 
                              required={!isFlightNA}
                              type="date"
                              value={arrivalDate}
                              onChange={(e) => setArrivalDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] outline-none text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Arrival Time</p>
                            <input 
                              required={!isFlightNA}
                              type="time"
                              value={arrivalTime}
                              onChange={(e) => setArrivalTime(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] outline-none text-xs"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-[1fr_1.5fr] gap-2">
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Departure Date</p>
                            <input 
                              required={!isFlightNA}
                              type="date"
                              value={departureDate}
                              onChange={(e) => setDepartureDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] outline-none text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Departure Time</p>
                            <input 
                              required={!isFlightNA}
                              type="time"
                              value={departureTime}
                              onChange={(e) => setDepartureTime(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] outline-none text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Tours */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Add Tour Package (Optional)</h3>
                  
                  {/* Selected Additional Tours */}
                  {additionalTours.length > 0 && (
                    <div className="space-y-3">
                      {additionalTours.map((at) => (
                        <div key={at.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-gray-800">{at.name}</span>
                              <span className="text-xs text-gray-500">₱{at.price.toLocaleString()}</span>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleRemoveTour(at.id)}
                              className="text-red-400 hover:text-red-600 p-1"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <input 
                              required
                              type="date"
                              value={at.date}
                              onChange={(e) => handleUpdateTourDate(at.id, e.target.value)}
                              className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-[#1F91C7]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Tour Dropdown */}
                  {availableTours.length > 0 && (
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F91C7] outline-none bg-white text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddTour(e.target.value);
                            e.target.value = ""; // Reset dropdown
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>Select a tour to add...</option>
                        {availableTours.map((at) => (
                          <option key={at.id} value={at.id}>
                            {at.name} - ₱{at.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Summary */}
                <div className="bg-gray-900 text-white p-4 rounded-xl">
                  <div className="flex justify-between text-sm mb-2 text-gray-400">
                    <span>Main Tour</span>
                    <span>₱{tour.price.toLocaleString()}</span>
                  </div>
                  {additionalTours.map(at => (
                    <div key={at.id} className="flex justify-between text-sm mb-2 text-gray-400">
                      <span>{at.name}</span>
                      <span>₱{at.price.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-800 mt-2 pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Total Amount</span>
                      <span className="text-lg font-bold text-white">₱{totalPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Reservation Fee</span>
                      <span className="text-lg font-bold text-[#F9B31C]">₱{reservationFee.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-800 pt-2">
                      <span className="font-bold">Balance</span>
                      <span className="text-xl font-black text-green-400">₱{balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-[#F9B31C] text-[#174B69] py-4 rounded-xl font-bold text-lg hover:bg-[#E59B12] transition-all shadow-lg hover:shadow-[#F9B31C]/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending Confirmation...</span>
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </button>
                
                {error && (
                  <p className="text-xs text-red-500 text-center mt-2 font-medium">
                    {error}
                  </p>
                )}
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
