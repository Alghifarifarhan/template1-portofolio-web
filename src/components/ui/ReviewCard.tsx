'use client';
import React from 'react';
import { Star } from 'lucide-react';
import { Review } from '@/data/data';
import { useAdmin } from '@/context/AdminContext';

export default function ReviewCard({ name, role, rating, text }: Review) {
  const { content } = useAdmin();
  const primaryColor = content?.colors?.primary || "#FFFFFF";

  return (
    <div className="flex flex-col w-full h-auto min-h-[200px] sm:min-h-[220px] lg:min-h-[265px] items-start gap-3 sm:gap-3.5 lg:gap-4 p-4 sm:p-5 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-3xl bg-[#FFFFFF]/14 backdrop-blur-[14px] opacity-80 hover:opacity-100 transition-opacity duration-300">
      {/* Header with Avatar and Info */}
      <div className="w-full flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
        {/* Avatar */}
        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 flex-shrink-0 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#FCFCFD"
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 12c2.485 0 4.5-2.015 4.5-4.5S14.485 3 12 3s-4.5 2.015-4.5 4.5S9.515 12 12 12zM4.5 21c0-3.314 3.357-6 7.5-6s7.5 2.686 7.5 6"
            />
          </svg>
        </div>
        
        {/* Name and Role */}
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="font-bold text-base sm:text-lg lg:text-xl xl:text-2xl text-[#FCFCFD] leading-tight">{name}</h3>
          <span className="text-sm sm:text-base lg:text-lg text-[#FCFCFD]/80 leading-tight">{role}</span>
        </div>
      </div>

      {/* Rating Section */}
      <div className="w-full flex items-center gap-2 sm:gap-3 lg:gap-4">
        <div className="flex gap-1 sm:gap-1.5">
          {[...Array(rating)].map((_, i) => (
            <Star 
              key={i} 
              size={16} 
              className="sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" 
              fill={primaryColor} 
              stroke={primaryColor} 
            />
          ))}
        </div>
        <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-[#FCFCFD]">{rating}</span>
      </div>

      {/* Review Text */}
      <p className="w-full text-sm sm:text-base lg:text-lg xl:text-xl text-[#F9FAFB] leading-relaxed">
        {text}
      </p>
    </div>
  );
}
