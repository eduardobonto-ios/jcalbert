import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';
import { getApiUrl } from '../lib/api';

interface Review {
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
        console.log('Reviews API response success:', data.success);
        console.log('Reviews count:', data.photos?.length);
        if (mounted && data.success && Array.isArray(data.photos)) {
          setReviews(data.photos.map((p: string) => ({ reviews_photo: p })));
        }
      })
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => { if (mounted) setIsLoading(false); });

    return () => { mounted = false; };
  }, []);

  // DEBUG: log first photo prefix
  if (reviews.length > 0) {
    console.log('reviews_photo[0] first 50 chars:', reviews[0].reviews_photo.slice(0, 50));
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="text-[#F9B31C] fill-[#F9B31C]" size={24} />
            <h2 className="text-3xl font-bold text-gray-900">Customer Reviews</h2>
            <Star className="text-[#F9B31C] fill-[#F9B31C]" size={24} />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See what our happy customers are saying about their unforgettable Palawan experiences
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-[#F9B31C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No reviews yet.</p>
        ) : (
          // DEBUG: render only first image
          <div>
            <p className="text-xs text-gray-400 mb-2 text-center">
              DEBUG — showing 1 of {reviews.length} reviews
            </p>
            <img
              src={reviews[0].reviews_photo}
              alt="review"
              style={{ width: '300px' }}
            />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="flex items-center justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="text-[#F9B31C] fill-[#F9B31C]" size={20} />
            ))}
          </div>
          <p className="text-sm text-gray-500">Average rating: 4.9/5 from 500+ reviews</p>
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsSection;
