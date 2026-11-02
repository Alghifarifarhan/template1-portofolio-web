"use client";
import Image from 'next/image';
import React, { useState } from 'react';
import ArrowButton from './ArrowButton';
import { Blog as BlogType } from '../../data/data'; 
import { formatGoogleDriveUrl } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface BlogProps extends BlogType {
  priority?: boolean;
}

const Blog: React.FC<BlogProps> = ({ image, name, date, title, priority = false }) => {
  const formattedImage = formatGoogleDriveUrl(image, "");
  const { content } = useAdmin();
  const primaryColor = content?.colors?.primary || "#FFFFFF";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex flex-col w-[340px] sm:w-[380px] lg:w-[416px] h-auto items-start gap-[20px] cursor-pointer group"
    >
      <div className="relative w-full h-[320px] lg:h-[380px] rounded-2xl overflow-hidden border-2 border-gray-200/80 shadow-md bg-[#171717]">
        {formattedImage && (
          <Image
            src={formattedImage}
            alt={title || "Blog cover image"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
            unoptimized
          />
        )}
        <div
          style={{
            backgroundColor: isHovered ? primaryColor : "#1D2939",
          }}
          className="absolute bottom-4 right-4 w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-md"
        >
          <ArrowButton
            className="transition-all duration-300 stroke-white -rotate-45"
            height={22}
            width={22}
            strokeColor="#ffffff"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 items-start w-full">
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          {name && (
            <div className="flex items-center gap-2">
              <span style={{ backgroundColor: primaryColor }} className="w-2 h-2 rounded-full"></span>
              <span className="text-[#344054] font-medium">{name}</span>
            </div>
          )}
          {date && (
            <div className="flex items-center gap-2">
              <span style={{ backgroundColor: primaryColor }} className="w-2 h-2 rounded-full"></span>
              <span className="text-[#344054] font-medium">{date}</span>
            </div>
          )}
        </div>

        <h3
          style={{ color: isHovered ? primaryColor : undefined }}
          className="w-full text-lg sm:text-xl font-bold text-[#344054] leading-snug transition-colors line-clamp-2"
        >
          {title}
        </h3>
      </div>
    </div>
  );
};

export default Blog;
