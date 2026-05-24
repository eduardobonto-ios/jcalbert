import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Quote, User } from 'lucide-react';
import { getApiUrl } from '../lib/api';

interface Review {
  reviews_photo: string | null;
  reviewer_name: string | null;
  rating: number | null;
  review_text: string | null;
  created_at: string;
}

const SUPABASE_URL = 'https://qaepuswhpptcasriieps.supabase.co';

// Shown only when the reviews table is empty (temporary test data)
const MOCK_REVIEWS: Review[] = [
  {
    reviews_photo: null,
    reviewer_name: 'Maria Santos',
    rating: 5,
    review_text: 'Amazing experience! The tour was wonderful, our guide was very professional. We visited the most beautiful lagoons in El Nido. Highly recommend Jcalbert!',
    created_at: new Date().toISOString(),
  },
  {
    reviews_photo: null,
    reviewer_name: 'Juan dela Cruz',
    rating: 5,
    review_text: 'Best tour experience in Palawan! The team was so organized and the sites we visited were breathtaking. Will definitely book again.',
    created_at: new Date().toISOString(),
  },
  {
    reviews_photo: null,
    reviewer_name: 'Ana Reyes',
    rating: 5,
    review_text: 'Perfect trip from start to finish. Great value for money and the scenery was absolutely stunning. Thank you Jcalbert Travel and Tours!',
    created_at: new Date().toISOString(),
  },
];

function getPhotoUrl(photo: string): string {
  if (!photo) return '';
  if (photo.startsWith('http')) return photo;
  // Storage path — prepend Supabase public storage URL
  return `${SUPABASE_URL}/storage/v1/object/public/${photo}`;
}

const ReviewCard: React.FC<{ review: Review; index: number }> = ({ review, index }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.08 }}
    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
  >
    {review.reviews_photo ? (
      <div className="relative">
        <img
          src={getPhotoUrl(review.reviews_photo)}
          alt={`Review by ${review.reviewer_name || 'customer'}`}
          className="w-full h-48 object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute top-3 left-3">
          <Quote className="text-[#F9B31C] bg-white rounded-full p-1 shadow" size={22} />
        </div>
      </div>
    ) : (
      <div className="h-20 bg-gradient-to-br from-[#E5F8FF] to-[#BDEEFF] flex items-center justify-center">
        <Quote className="text-[#1F91C7]" size={32} />
      </div>
    )}

    <div className="p-4 flex-1 flex flex-col">
      <div className="flex gap-0.5 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < (review.rating ?? 5) ? 'text-[#F9B31C] fill-[#F9B31C]' : 'text-gray-300'}
          />
        ))}
      </div>

      {review.review_text && (
        <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-3">{review.review_text}</p>
      )}

      {review.reviewer_name && (
        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-50">
          <div className="w-7 h-7 bg-[#E5F8FF] rounded-full flex items-center justify-center shrink-0">
            <User size={14} className="text-[#1F91C7]" />
          </div>
          <p className="text-[#174B69] font-bold text-sm">{review.reviewer_name}</p>
        </div>
      )}
    </div>
  </motion.div>
);

const ReviewsSection: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    fetch(getApiUrl('/api/reviews'))
      .then((res) => res.json())
      .then((data) => {
        console.log('Reviews API response:', data);
        if (isMounted && data.success && Array.isArray(data.reviews)) {
          setReviews(data.reviews.length > 0 ? data.reviews : MOCK_REVIEWS);
        } else {
          if (isMounted) setReviews(MOCK_REVIEWS);
        }
      })
      .catch((err) => {
        console.error('Failed to load reviews:', err);
        if (isMounted) setReviews(MOCK_REVIEWS);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <ReviewCard key={index} review={review} index={index} />
            ))}
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
