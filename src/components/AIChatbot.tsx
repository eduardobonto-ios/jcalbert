import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LoaderCircle, MessageCircle, Send, X } from 'lucide-react';
import { getApiUrl } from '../lib/api';

interface AIChatbotProps {
  isVisible?: boolean;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ isVisible = true }) => {
  const messengerUrl = 'https://www.facebook.com/profile.php?id=61574076939792';
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for modals in the DOM
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Check if any element with fixed inset-0 z-50 (modal overlay) exists
      const modal = document.querySelector('.fixed.inset-0.z-50');
      setIsModalOpen(!!modal);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!isVisible || isModalOpen) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedFullName = fullName.trim();
    const trimmedContactEmail = contactEmail.trim();
    const trimmedMessage = message.trim();

    if (!trimmedFullName) {
      setError('Please enter your full name.');
      setSuccessMessage(null);
      return;
    }

    if (!trimmedContactEmail) {
      setError('Please enter your contact number or email.');
      setSuccessMessage(null);
      return;
    }

    if (!trimmedMessage) {
      setError('Please enter your message.');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(getApiUrl('/api/message'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          fullName: trimmedFullName,
          contactEmail: trimmedContactEmail,
          message: trimmedMessage,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error || 'Unable to send your message right now.');
        return;
      }

      setBookingId('');
      setFullName('');
      setContactEmail('');
      setMessage('');
      setSuccessMessage('Message sent. Our team can now review it.');
      setError(null);
      window.location.href = messengerUrl;
    } catch {
      setError('Unable to send your message right now.');
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20, x: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, x: -20 }}
            className="mb-4 w-[min(22rem,calc(100vw-3rem))] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          >
            <div className="bg-[#1F91C7] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle size={18} />
                </div>
                <p className="font-bold leading-tight">Send a message to Jcalbert Travel & Tours Services</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                No login needed. If you already booked, you can include your booking ID so your client's team can find the reservation faster.
              </p>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-gray-700">Booking ID</span>
                <input
                  type="text"
                  value={bookingId}
                  onChange={(event) => setBookingId(event.target.value)}
                  placeholder="Optional, e.g. JCA-12345678"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#1F91C7] focus:ring-2 focus:ring-[#E5F8FF]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-gray-700">Full name *</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#1F91C7] focus:ring-2 focus:ring-[#E5F8FF]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-gray-700">Contact Number or Email *</span>
                <input
                  type="text"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="Enter your contact number or email"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#1F91C7] focus:ring-2 focus:ring-[#E5F8FF]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-gray-700">Message</span>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Type your question or concern here"
                  rows={5}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#1F91C7] focus:ring-2 focus:ring-[#E5F8FF]"
                  required
                />
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1F91C7] px-4 py-3 font-bold text-white transition-all hover:bg-[#174B69] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
                <span>{isSubmitting ? 'Sending...' : 'Send message'}</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#1F91C7] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#174B69] transition-all relative group"
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        
        {!isOpen && (
          <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Need help? Send us a message.
          </div>
        )}
      </motion.button>
    </div>
  );
};
