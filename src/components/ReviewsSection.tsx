import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { getApiUrl } from '../lib/api';

const SUPABASE_URL = 'https://qaepuswhpptcasriieps.supabase.co';

// Shown only when the reviews table has no rows yet
const MOCK_PHOTOS = [
  'https://placehold.co/400x500/E5F8FF/174B69?text=Review+1',
  'https://placehold.co/400x500/E5F8FF/174B69?text=Review+2',
  'https://placehold.co/400x500/E5F8FF/174B69?text=Review+3',
];

function getPhotoUrl(photo: string): string {
  if (!photo) return '';
  if (photo.startsWith('http')) return photo;
  // Supabase storage path — construct public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${photo}`;
}

const ReviewsSection: React.FC = () => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    let mounted = true;

    fetch(getApiUrl('/api/reviews'))
      .then((res) => res.json())
      .then((data) => {
        console.log('Reviews API response:', data);
        if (!mounted) return;

        if (data.success && Array.isArray(data.photos) && data.photos.length > 0) {
          setPhotos(data.photos);
          setIsMock(false);
        } else {
          setPhotos(MOCK_PHOTOS);
          setIsMock(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load reviews:', err);
        if (mounted) {
          setPhotos(MOCK_PHOTOS);
          setIsMock(true);
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
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
          <>
            {isMock && (
              <p className="text-center text-xs text-gray-400 mb-6 italic">
                No reviews yet — add photos to the reviews table to display them here.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative">
                    <img
                      src={getPhotoUrl(photo)}
                      alt={`Customer review ${index + 1}`}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <Quote className="text-[#F9B31C] bg-white rounded-full p-1 shadow" size={22} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
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
