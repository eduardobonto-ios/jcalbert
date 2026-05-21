import React from 'react';
import { Review } from '../types';
import { Star } from 'lucide-react';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <img 
          src={review.userImage} 
          alt={review.userName} 
          className="w-12 h-12 rounded-full object-cover border-2 border-[#F9B31C]"
          referrerPolicy="no-referrer"
        />
        <div>
          <h4 className="font-bold text-gray-900">{review.userName}</h4>
          <p className="text-xs text-gray-500">{review.date}</p>
        </div>
      </div>
      
      <div className="flex mb-3">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={16} 
            className={`${i < review.rating ? 'text-[#F9B31C] fill-[#F9B31C]' : 'text-gray-300'}`} 
          />
        ))}
      </div>
      
      <p className="text-gray-600 text-sm italic mb-4">
        "{review.comment}"
      </p>
      
      <div className="pt-4 border-t border-gray-50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#174B69] bg-[#E5F8FF] px-2 py-1 rounded">
          {review.tourName}
        </span>
      </div>
    </div>
  );
};
