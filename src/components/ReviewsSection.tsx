import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

const ReviewsSection: React.FC = () => {
  const reviewImages = [
    '/images/tours/review1.png',
    '/images/tours/review2.png',
    '/images/tours/review3.png',
    '/images/tours/review4.png',
    '/images/tours/review5.png',
    '/images/tours/review6.png',
    '/images/tours/review7.png'
  ];

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="relative">
                <img
                  src={image}
                  alt={`Customer review ${index + 1}`}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <Quote className="text-[#F9B31C] bg-white rounded-full p-1" size={20} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

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
          <p className="text-sm text-gray-500">
            Average rating: 4.9/5 from 500+ reviews
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsSection;
