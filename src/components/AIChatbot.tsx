import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageCircle } from 'lucide-react';

interface AIChatbotProps {
  isVisible?: boolean;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({ isVisible = true }) => {
  const messengerUrl = 'https://www.facebook.com/messages/t/581849845016944';
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const modal = document.querySelector('.fixed.inset-0.z-50');
      setIsModalOpen(!!modal);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!isVisible || isModalOpen) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <motion.a
        href={messengerUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-[#1F91C7] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#174B69] transition-all relative group"
      >
        <MessageCircle size={28} />
        <div className="absolute left-full ml-4 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Chat with us on Messenger
        </div>
      </motion.a>
    </div>
  );
};
