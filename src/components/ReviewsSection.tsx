import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { getApiUrl } from '../lib/api';

interface Review {
  id: number;
  reviews_photo: string;
}

const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch(getApiUrl('/api/reviews'))
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      })
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => { if (mounted) setIsLoading(false); });

    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star className="text-[#F9B31C] fill-[#F9B31C]" size={26} />
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Customer Reviews
            </h2>
            <Star className="text-[#F9B31C] fill-[#F9B31C]" size={26} />
          </div>
          <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto">
            See what our happy customers are saying about their unforgettable Palawan experiences
          </p>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#F9B31C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">No reviews yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(index * 0.07, 0.35) }}
                className="w-full max-w-sm bg-white rounded-2xl shadow-md overflow-hidden group hover:shadow-xl transition-all duration-300"
              >
                {/* Image wrapper — clips the zoom overflow */}
                <div className="overflow-hidden">
                  <img
                    src={review.reviews_photo}
                    alt={`Customer review ${review.id}`}
                    className="w-full h-auto object-contain block transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer rating */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-14"
        >
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="text-[#F9B31C] fill-[#F9B31C]" size={22} />
            ))}
          </div>
          <p className="text-sm text-gray-400 font-medium">
            Average rating: 4.9 / 5 from 500+ happy travelers
          </p>
        </motion.div>

      </div>
    </section>
  );
};

export default ReviewsSection;
