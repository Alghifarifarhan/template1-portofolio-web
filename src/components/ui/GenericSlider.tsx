'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { useEffect, useState } from 'react';

import ServicesCard from './ServicesCard';
import PortfolioCard from './PortfolioCard';
import ReviewCard from './ReviewCard';
import Blog from './Blog';

export function GenericSlider<T extends Record<string, unknown>>({
  data,
  slidesPerView,
  heightClass,
  cardType,
  onItemClick,
}: {
  data: T[];
  slidesPerView: number;
  heightClass?: string;
  cardType: 'hover' | 'portfolio' | 'review' | 'blog';
  onItemClick?: (item: T) => void;
}) {
  const [isClient, setIsClient] = useState(false);
  const isReview = cardType === 'review';
  const isPortfolio = cardType === 'portfolio';
  const isBlog = cardType === 'blog';

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!data || data.length === 0) {
    return null;
  }

  // Only enable loop if there are strictly more items than the maximum slidesPerView
  // to avoid Swiper Loop Warning and broken click/swipe states
  const minRequiredForLoop = isPortfolio ? 3 : isReview ? 2 : Math.max(slidesPerView + 1, 4);
  const shouldLoop = data.length >= minRequiredForLoop;

  if (!isClient) {
    return (
      <div className={`relative w-full flex flex-col justify-center items-center ${heightClass || ''}`}>
        <div className={`w-full px-4 sm:px-6 lg:px-0 ${!isReview ? 'max-w-[1440px]' : ''}`}>
          <div className="flex gap-4 overflow-x-auto">
            {data.slice(0, 3).map((item, index) => (
              <div key={index} className="flex-shrink-0 w-full max-w-sm" onClick={() => onItemClick?.(item)}>
                {cardType === 'hover' && (
                  <ServicesCard title={String(item.title || '')} imageSrc={String(item.imageSrc || '')} priority={index === 0} />
                )}
                {cardType === 'portfolio' && (
                  <PortfolioCard
                    image={String(item.image || '')}
                    title={String(item.title || '')}
                    href={String(item.href || '')}
                    desc={String(item.desc || '')}
                    priority={index === 0}
                  />
                )}
                {cardType === 'review' && (
                  <ReviewCard
                    name={String(item.name || '')}
                    role={String(item.role || '')}
                    rating={Number(item.rating || 5)}
                    text={String(item.text || '')}
                  />
                )}
                {cardType === 'blog' && (
                  <Blog
                    image={String(item.image || '')}
                    button={String(item.button || '')}
                    name={String(item.name || '')}
                    date={String(item.date || '')}
                    title={String(item.title || '')}
                    priority={index === 0}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full flex flex-col justify-center items-center ${heightClass || ''}`}>
      <div className={`w-full px-4 sm:px-6 lg:px-0 ${!isReview ? 'max-w-[1440px]' : ''}`}>
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={20}
          centeredSlides={isReview}
          loop={shouldLoop}
          preventClicks={false}
          preventClicksPropagation={false}
          touchStartPreventDefault={false}
          simulateTouch={true}
          autoplay={
            data.length > 1
              ? {
                  delay: 3500,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          pagination={data.length > 1 ? { clickable: true } : false}
          breakpoints={{
            0: {
              slidesPerView: 1,
              spaceBetween: 16,
            },
            640: {
              slidesPerView: isPortfolio || isBlog || isReview ? 1 : Math.min(data.length, 2),
              spaceBetween: 18,
            },
            850: {
              slidesPerView: isPortfolio || isBlog || isReview ? 1 : Math.min(data.length, 2),
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: isPortfolio ? Math.min(data.length, 2) : Math.min(data.length, Math.min(slidesPerView, 3)),
              spaceBetween: 24,
            },
            1280: {
              slidesPerView: isPortfolio ? Math.min(data.length, 2) : Math.min(data.length, slidesPerView),
              spaceBetween: 24,
            },
          }}
          className="!pb-16"
        >
          {data.map((item, index) => (
            <SwiperSlide
              key={index}
              className={`${isReview ? '!w-full sm:!w-[90%] md:!w-[784px]' : '!flex justify-center'}`}
            >
              <div
                className="w-full flex justify-center cursor-pointer select-none"
                onClick={(e) => {
                  e.stopPropagation();
                  onItemClick?.(item);
                }}
              >
                {cardType === 'hover' && (
                  <ServicesCard title={String(item.title || '')} imageSrc={String(item.imageSrc || '')} priority={index === 0} />
                )}
                {cardType === 'portfolio' && (
                  <PortfolioCard
                    image={String(item.image || '')}
                    title={String(item.title || '')}
                    href={String(item.href || '')}
                    desc={String(item.desc || '')}
                    priority={index === 0}
                  />
                )}
                {cardType === 'review' && (
                  <ReviewCard
                    name={String(item.name || '')}
                    role={String(item.role || '')}
                    rating={Number(item.rating || 5)}
                    text={String(item.text || '')}
                  />
                )}
                {cardType === 'blog' && (
                  <Blog
                    image={String(item.image || '')}
                    button={String(item.button || '')}
                    name={String(item.name || '')}
                    date={String(item.date || '')}
                    title={String(item.title || '')}
                    priority={index === 0}
                  />
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}