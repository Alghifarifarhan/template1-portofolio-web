"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ArrowButton from './ArrowButton';
import { PortfolioItem } from '@/data/data';
import { formatGoogleDriveUrl } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface PortfolioCardProps extends PortfolioItem {
  priority?: boolean;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ image, title, href, desc, priority = false }) => {
  const formattedImage = formatGoogleDriveUrl(image, "");
  const hasValidLink = Boolean(href && href.trim() !== "" && href.trim() !== "#");
  const { content } = useAdmin();
  const primaryColor = content?.colors?.primary || "#FFFFFF";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group 
        w-full 
        md:w-[633px] h-[260px] sm:h-[320px] md:h-[371px] 
        md:max-w-none 
        rounded-[20px] md:rounded-[28px] 
        overflow-hidden transition-all duration-300 cursor-pointer 
        border-2 border-gray-200/80 shadow-xl bg-[#171717]"
      style={{
        boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Gradient Overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(225deg, rgba(0, 0, 0, 0) 44%, rgba(0, 0, 0, 0.72) 83%, rgba(0, 0, 0, 1) 100%)',
          opacity: 0.45,
        }}
      />

      {/* Background Image */}
      {formattedImage && (
        <Image
          src={formattedImage}
          alt={title}
          fill
          className="object-cover z-0 transition-transform duration-500 group-hover:scale-105"
          priority={priority}
          unoptimized
        />
      )}

      {/* Content */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between">
        {/* Top-right Button */}
        <div className="flex justify-end p-2 md:p-4">
          {hasValidLink ? (
            <Link
              href={href!.startsWith("http") ? href! : `https://${href!}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  borderColor: primaryColor,
                  backgroundColor: isHovered ? primaryColor : "transparent",
                }}
                className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] 
                  rounded-full border-2 
                  flex items-center justify-center 
                  transition-all duration-300 shadow-md"
              >
                <ArrowButton
                  strokeColor={isHovered ? "#ffffff" : primaryColor}
                  className="transition-all duration-300"
                />
              </div>
            </Link>
          ) : (
            <div
              style={{
                borderColor: primaryColor,
                backgroundColor: isHovered ? primaryColor : "transparent",
              }}
              className="w-[40px] h-[40px] md:w-[60px] md:h-[60px] 
                rounded-full border-2 
                flex items-center justify-center 
                transition-all duration-300 shadow-md"
            >
              <ArrowButton
                strokeColor={isHovered ? "#ffffff" : primaryColor}
                className="transition-all duration-300"
              />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="px-4 pb-3 md:px-6 md:pb-5 font-bold 
          text-[22px] sm:text-[28px] md:text-[60px] lg:text-[70px] 
          text-[#FFFAF5] leading-[1] truncate max-w-[90%]"
        >
          {title}
        </h1>

        {/* Hover Description */}
        <div className="absolute bottom-0 left-0 right-0 
          w-[92%] mx-auto mb-3 md:mb-4 
          bg-black/60 backdrop-blur-md 
          rounded-[16px] md:rounded-[20px] 
          px-4 md:px-6 py-3 md:py-4 
          opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 
          transition-all duration-500 ease-in-out z-30 border border-white/10"
        >
          <h1 className="text-[18px] md:text-[28px] font-bold text-white mb-1 text-center md:text-left truncate">
            {title}
          </h1>
          <p className="text-white text-xs md:text-sm leading-relaxed text-center md:text-left line-clamp-2">
            {desc}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;
