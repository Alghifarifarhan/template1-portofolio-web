'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useAdmin } from '@/context/AdminContext';

interface DualToggleButtonsProps {
  onPortfolioClick?: () => void;
  onHireClick?: () => void;
}

export default function DualToggleButtons({ onPortfolioClick, onHireClick }: DualToggleButtonsProps) {
  const { content } = useAdmin();
  const primaryColor = content?.colors?.primary || "#FFFFFF";
  const [active, setActive] = useState<"portfolio" | "hire">("portfolio");

  return (
    <div className="flex border-b-2 border-white bg-white/10 backdrop-blur-[5px] rounded-full gap-[10px] p-[10px] w-[367px] h-[82px] items-center justify-center shadow-xl">
      {/* My Resume Button */}
      <button
        onClick={onPortfolioClick}
        onMouseEnter={() => setActive("portfolio")}
        style={{ backgroundColor: active === "portfolio" ? primaryColor : "transparent" }}
        className={`group flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-[60px] transition-all duration-300 ease-in-out cursor-pointer
          ${active === "portfolio"
            ? "text-white font-medium text-[22px] sm:text-[25px] w-[208px] h-[62px] border border-[#D0D5DD] shadow-md"
            : "text-white font-light text-[16px] sm:text-[18px] w-[129px] h-[54px]"
          }`}
      >
        Resume
        <ArrowUpRight
          size={16}
          className={`transition-all duration-300 ${active === "portfolio"
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-1 group-hover:opacity-100"
            }`}
        />
      </button>

      {/* Hire Me Button */}
      <button
        onClick={onHireClick}
        onMouseEnter={() => setActive("hire")}
        style={{ backgroundColor: active === "hire" ? primaryColor : "transparent" }}
        className={`group flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-[60px] transition-all duration-300 ease-in-out cursor-pointer
          ${active === "hire"
            ? "text-white font-medium text-[22px] sm:text-[25px] w-[208px] h-[62px] border border-[#D0D5DD] shadow-md"
            : "text-white font-light text-[18px] w-[129px] h-[54px]"
          }`}
      >
        Hire me
        <ArrowUpRight
          size={16}
          className={`transition-all duration-300 ${active === "hire"
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-1 group-hover:opacity-100"
            }`}
        />
      </button>
    </div>
  );
}
