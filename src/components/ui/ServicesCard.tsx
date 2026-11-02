"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { formatGoogleDriveUrl } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';

interface HoverCardProps {
  title: string;
  imageSrc: string;
  priority?: boolean;
}

export default function ServicesCard({ title, imageSrc, priority = false }: HoverCardProps) {
  const formattedImageSrc = formatGoogleDriveUrl(imageSrc, "");
  const { content } = useAdmin();
  const primaryColor = content?.colors?.primary || "#FFFFFF";
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: isHovered ? primaryColor : undefined,
      }}
      className="relative flex flex-col items-center justify-end w-full md:max-w-[360px] lg:max-w-[416px] h-[450px] lg:h-[508px] rounded-[37px] lg:rounded-[40px] bg-white/10 backdrop-blur-[15px] border border-white/40 transition-colors duration-300 ease-in-out overflow-hidden cursor-pointer group shadow-xl"
    >
      {/* Title */}
      <h1 className="absolute top-4 w-full h-[40px] sm:h-[45px] md:h-[50px] lg:h-[65px] flex items-start font-medium text-[20px] md:text-[24px] lg:text-[32px] text-white z-30 border-b-2 border-[#F9FAFB]/30">
        <span className="relative lg:top-2 left-6 truncate pr-8">{title}</span>
      </h1>

      {/* Decorative Backgrounds */}
      <div className="absolute w-[80%] lg:w-[310px] h-[330px] lg:h-[329px] rounded-[25px] lg:rounded-[35px] bg-[#757575] opacity-50 mb-2 sm:mb-3 md:mb-4 lg:mb-5"></div>
      <div className="absolute w-[90%] lg:w-[364px] h-[320px] lg:h-[329px] rounded-[25px] lg:rounded-[35px] bg-[#9E9D9D]"></div>

      {/* Image with Border */}
      <div className="relative z-20 w-full h-[300px] md:max-h-[360px] lg:max-h-[416px] rounded-[35px] overflow-hidden border-2 border-white/20 shadow-md bg-[#171717]">
        {formattedImageSrc && (
          <Image
            src={formattedImageSrc}
            alt={title || "Certificate Card Image"}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
            unoptimized
          />
        )}
      </div>
    </div>
  );
}
