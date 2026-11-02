"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import CustomeText from "@/components/ui/CustomeText";
import DualToggleButtons from "@/components/ui/DualButtons";
import Image from "next/image";
import { Star } from "lucide-react";
import { GenericSlider } from "@/components/ui/GenericSlider";
import ClientOnly from "@/components/ui/ClientOnly";
import { useAdmin, ServiceItem, BlogItem, PortfolioItem } from "@/context/AdminContext";
import { formatGoogleDriveUrl, sortBlogsByDate } from "@/lib/utils";
import ServiceModal from "@/components/ui/ServiceModal";
import PortfolioModal from "@/components/ui/PortfolioModal";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function Home() {
  const router = useRouter();
  const { content, recordPageView } = useAdmin();

  const primaryColor = content?.colors?.primary || "#FD853A";
  const darkBg = content?.colors?.dark || "#171717";
  const lightBg = content?.colors?.light || "#F2F4F7";
  const textDark = content?.colors?.textDark || "#344054";
  const textMid = content?.colors?.textMid || "#1D2939";
  const textLight = content?.colors?.textLight || "#98A2B3";

  // Dynamic Content
  const hero = content?.hero;
  const servicesData = content?.services || [];
  const experiences = content?.experiences || [];
  const hireMe = content?.hireMe;
  const portfolioData = content?.portfolio || [];
  const blogsData = sortBlogsByDate(content?.blogs || []);

  const servicesSectionTitle = content?.sectionTitles?.services || content?.servicesTitle || "";
  const experienceSectionTitle = content?.sectionTitles?.experience || content?.experiencesTitle || "";
  const portfolioSectionTitle = content?.sectionTitles?.portfolio || content?.portfolioTitle || "";
  const blogsSectionTitle = content?.sectionTitles?.blogs || content?.blogsTitle || "";

  const formattedHeroImage = formatGoogleDriveUrl(hero?.heroImage, "");
  const formattedHireMeImage = formatGoogleDriveUrl(hireMe?.heroImage, "");
  const contactEmail = content?.footer?.email || content?.contact?.email || "";
  const resumeUrl = hero?.resumeUrl || "";

  // Modal states
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

  // Trigger page view analytics recording on mount
  useEffect(() => {
    recordPageView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleHireMe = () => {
    if (contactEmail) {
      window.location.href = `mailto:${contactEmail}`;
    } else {
      const el = document.getElementById("contact");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handlePortfolioBtnClick = () => {
    if (resumeUrl && resumeUrl.trim() !== "") {
      window.open(formatGoogleDriveUrl(resumeUrl), "_blank");
    } else {
      const el = document.getElementById("portfolio");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleServiceClick = (service: ServiceItem) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const handleBlogClick = (blog: BlogItem) => {
    router.push(`/blog/${blog.id}`);
  };

  const handlePortfolioClick = (portfolio: PortfolioItem) => {
    setSelectedPortfolio(portfolio);
    setIsPortfolioModalOpen(true);
  };

  const heroRatingStars = hero?.ratingStars !== undefined ? hero.ratingStars : 0;
  const hasExperienceRating = Boolean(
    (hero?.yearsExperience && hero.yearsExperience.trim() !== "") || heroRatingStars > 0
  );
  const hasHeroContent = Boolean(
    hero?.greeting || hero?.name || hero?.title || hero?.quote || formattedHeroImage || hasExperienceRating
  );

  return (
    <div
      style={{ backgroundColor: lightBg }}
      className="relative min-h-screen w-full py-0 flex flex-col items-center justify-start overflow-x-clip transition-colors duration-300"
    >
      <Navbar />

      {/* Hero Section */}
      {hasHeroContent && (
        <div id="hero" className="group relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center mt-3 sm:mt-5 pb-0">
          {/* Floating Quote (Left Side on Large Screens) */}
          {hero?.quote && (
            <ScrollReveal direction="left" delay={100} className="hidden xl:flex absolute left-4 2xl:left-8 top-[32%] xl:top-[36%] 2xl:top-[40%] z-20 pointer-events-auto">
              <div className="flex flex-col w-[260px] 2xl:w-[320px] items-start justify-start transition-transform duration-500 ease-in-out group-hover:-translate-y-6">
                <div style={{ color: textDark }} className="text-[36px] 2xl:text-[42px] leading-none select-none font-serif">&quot;</div>
                <p style={{ color: textDark }} className="text-[14px] 2xl:text-[16px] font-medium leading-snug">
                  {hero.quote}
                </p>
              </div>
            </ScrollReveal>
          )}

          {/* Center Hero Content */}
          <div className="relative w-full max-w-[952px] flex flex-col items-center justify-center mx-auto">
            <ScrollReveal direction="down" delay={150} className="w-full flex flex-col items-center">
              <div className="flex w-full flex-col items-center justify-center transition-all duration-500 ease-in-out group-hover:translate-y-[200px] sm:group-hover:translate-y-[240px] md:group-hover:translate-y-[280px] group-hover:opacity-0 px-2 sm:px-4">
                {hero?.greeting && (
                  <ClientOnly>
                    <button
                      style={{ color: textMid, borderColor: textMid, backgroundColor: lightBg }}
                      className="h-[40px] sm:h-[45px] px-5 sm:px-[26px] py-2 sm:py-[13px] rounded-full border flex items-center justify-center mt-2 sm:mt-4 md:mt-6 font-medium text-xs sm:text-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm z-10"
                    >
                      {hero.greeting}
                    </button>
                  </ClientOnly>
                )}
                
                {hero?.name && (
                  <h1 className="text-center font-semibold text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] 2xl:text-[88px] tracking-tight leading-tight max-w-full break-words mt-3 sm:mt-6 mb-1">
                    <span style={{ color: textMid }}>I&apos;m </span>
                    <span style={{ color: primaryColor }}>{hero.name}</span>
                    <span style={{ color: textMid }}>,</span>
                  </h1>
                )}

                {hero?.title && (
                  <h2
                    style={{ color: textMid }}
                    className="font-semibold text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-[80px] 2xl:text-[88px] text-center tracking-tight leading-tight max-w-full break-words"
                  >
                    {hero.title}
                  </h2>
                )}
              </div>
            </ScrollReveal>

            {/* Hero Image & Arc */}
            {(formattedHeroImage || resumeUrl || contactEmail) && (
              <ScrollReveal direction="zoom" delay={250} className="relative w-full max-w-[952px] mt-2 sm:mt-4">
                <div className="relative w-full flex flex-col items-center justify-end mx-auto px-4 min-h-[360px] sm:min-h-[440px] md:min-h-[500px]">
                  {/* Semi-circle Arc Background */}
                  {formattedHeroImage && (
                    <div className="absolute bottom-0 z-0 w-[90%] max-w-[812px] aspect-[2/1] overflow-hidden flex items-center justify-center pointer-events-auto">
                      <div style={{ backgroundColor: primaryColor }} className="absolute w-full h-full rounded-t-full opacity-80" />
                    </div>
                  )}

                  {/* Doodle Art Background (Frame 68.svg) - Appears on Hover */}
                  <div className="absolute bottom-0 z-10 w-full max-w-[952px] pointer-events-none flex items-end justify-center transition-all duration-700 ease-out opacity-0 scale-95 translate-y-4 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0">
                    <Image
                      src="/Frame 68.svg"
                      alt="Hero Doodles"
                      width={1066}
                      height={719}
                      className="w-full h-auto object-contain select-none"
                      priority
                      unoptimized
                    />
                  </div>

                  {/* Hero Image */}
                  {formattedHeroImage && (
                    <Image
                      src={formattedHeroImage}
                      alt={hero?.name || "Hero image"}
                      width={952}
                      height={636}
                      className="relative z-20 w-full h-auto object-contain max-h-[420px] sm:max-h-[490px] md:max-h-[550px] transition-transform duration-500 hover:scale-105"
                      priority
                      unoptimized
                    />
                  )}

                  {/* Dual Action Buttons */}
                  {(resumeUrl || contactEmail) && (
                    <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 z-30 w-full flex justify-center pointer-events-auto">
                      <DualToggleButtons
                        onPortfolioClick={handlePortfolioBtnClick}
                        onHireClick={handleHireMe}
                      />
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )}
          </div>

          {/* Floating Rating / Experience Badge (Right Side on Large Screens) */}
          {hasExperienceRating && (
            <ScrollReveal direction="right" delay={100} className="hidden xl:flex absolute right-4 2xl:right-8 top-[32%] xl:top-[36%] 2xl:top-[40%] z-20 pointer-events-auto">
              <div className="w-[160px] 2xl:w-[190px] flex flex-col items-end justify-end gap-2 transition-transform duration-500 ease-in-out group-hover:-translate-y-6">
                {heroRatingStars > 0 && (
                  <div className="flex gap-1">
                    {[...Array(heroRatingStars)].map((_, i) => (
                      <Star key={i} size={26} className="2xl:w-7 2xl:h-7" fill={primaryColor} stroke={primaryColor} />
                    ))}
                  </div>
                )}
                {hero?.yearsExperience && (
                  <h3 style={{ color: textMid }} className="text-[26px] 2xl:text-[32px] font-bold leading-none whitespace-nowrap text-right">
                    {hero.yearsExperience}
                  </h3>
                )}
              </div>
            </ScrollReveal>
          )}
        </div>
      )}

      {/* Certificate Section */}
      {servicesData.length > 0 && (
        <div
          id="services"
          style={{ backgroundColor: darkBg }}
          className="relative z-20 flex flex-col w-full min-h-[700px] gap-12 sm:gap-[70px] items-center px-4 sm:px-6 lg:px-[71px] pt-20 sm:pt-24 lg:pt-[105px] pb-16 sm:pb-[100px] rounded-[30px] sm:rounded-[50px] overflow-hidden transition-colors duration-300"
        >
          {/* Background Texture Layer (Frame 77.svg) */}
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <Image
              src="/Frame 77.svg"
              alt="Certificate Background Texture"
              fill
              className="object-cover object-center w-full h-full opacity-60"
              priority
              unoptimized
            />
            {/* Dynamic theme tint overlay */}
            <div
              style={{ backgroundColor: darkBg }}
              className="absolute inset-0 opacity-40 mix-blend-multiply"
            />
          </div>

          {servicesSectionTitle && (
            <ScrollReveal direction="up" delay={100} className="w-full flex flex-col lg:flex-row items-start justify-between gap-6 relative z-10">
              <div className="flex gap-2.5 flex-wrap">
                {(() => {
                  const raw = servicesSectionTitle.trim();
                  const lastSpace = raw.lastIndexOf(" ");
                  if (lastSpace === -1) {
                    return <CustomeText title={raw} style={{ color: primaryColor }} className="font-medium text-3xl sm:text-4xl lg:text-5xl" />;
                  }
                  const first = raw.substring(0, lastSpace);
                  const second = raw.substring(lastSpace + 1);
                  return (
                    <>
                      <CustomeText title={first} className="font-medium text-3xl sm:text-4xl lg:text-5xl text-[#FCFCFD]" />
                      <CustomeText title={second} style={{ color: primaryColor }} className="font-medium text-3xl sm:text-4xl lg:text-5xl" />
                    </>
                  );
                })()}
              </div>
            </ScrollReveal>
          )}

          <ScrollReveal direction="up" delay={200} className="relative w-full max-w-[1299px] flex items-start justify-center z-10">
            <GenericSlider
              data={servicesData.map((s) => ({
                ...s,
                imageSrc: formatGoogleDriveUrl(s.imageSrc, ""),
              }))}
              slidesPerView={3}
              heightClass="h-[500px] sm:h-[550px]"
              cardType="hover"
              onItemClick={(item) => handleServiceClick(item as ServiceItem)}
            />
          </ScrollReveal>
        </div>
      )}

      {/* Work Experience */}
      {experiences.length > 0 && (
        <div className="w-full h-auto flex flex-col items-center mx-auto px-4 sm:px-6 lg:px-[71px] py-12 lg:py-20 mb-8 lg:mb-12">
          {experienceSectionTitle && (
            <ScrollReveal direction="up" delay={100} className="w-full">
              <div className="w-full h-auto flex lg:flex-row items-start justify-center space-x-2.5 mb-10 lg:mb-16 text-center lg:text-left flex-wrap gap-2">
                {(() => {
                  const raw = experienceSectionTitle.trim();
                  const firstSpace = raw.indexOf(" ");
                  if (firstSpace === -1) {
                    return <CustomeText title={raw} style={{ color: primaryColor }} className="font-medium text-4xl sm:text-5xl lg:text-6xl" />;
                  }
                  const first = raw.substring(0, firstSpace);
                  const rest = raw.substring(firstSpace + 1);
                  return (
                    <>
                      <CustomeText title={first} style={{ color: textDark }} className="font-medium text-4xl sm:text-5xl lg:text-6xl" />
                      <CustomeText title={rest} style={{ color: primaryColor }} className="font-medium text-4xl sm:text-5xl lg:text-6xl" />
                    </>
                  );
                })()}
              </div>
            </ScrollReveal>
          )}

          {/* Mobile & Tablet Timeline (< lg) */}
          <div className="w-full lg:hidden flex flex-col gap-8">
            {experiences.map((exp, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 80 + 100}>
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0 mt-1.5">
                    <div style={{ borderColor: textMid }} className="w-6 h-6 rounded-full border-2 border-dashed bg-white shadow-sm" />
                    <div style={{ backgroundColor: primaryColor }} className="absolute top-1 left-1 w-4 h-4 rounded-full" />
                  </div>

                  <div className="flex-1 flex flex-col gap-1.5">
                    <CustomeText title={exp.company} style={{ color: textMid }} className="font-semibold text-xl sm:text-2xl leading-tight" />
                    <CustomeText title={exp.duration} style={{ color: textLight }} className="text-sm sm:text-base mb-1" />
                    <CustomeText title={exp.role} style={{ color: textMid }} className="font-semibold text-lg sm:text-xl" />
                    {exp.desc && (
                      <p style={{ color: textLight }} className="text-sm sm:text-base leading-relaxed whitespace-pre-line mt-1">
                        {exp.desc}
                      </p>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Desktop Timeline (lg+) */}
          <div className="w-full max-w-[1298px] hidden lg:flex flex-col gap-14 relative">
            {/* Continuous vertical dashed line passing through all timeline dots */}
            {experiences.length > 1 && (
              <div
                style={{ borderColor: textMid }}
                className="absolute left-[441px] top-6 bottom-6 w-[2px] border-l-2 border-dashed pointer-events-none"
              />
            )}

            {experiences.map((exp, index) => (
              <ScrollReveal key={index} direction="up" delay={index * 100 + 150} className="w-full">
                <div className="flex items-start justify-between gap-8 w-full">
                  {/* Left Column: Company & Duration */}
                  <div className="w-[410px] flex flex-col gap-2 shrink-0">
                    <CustomeText title={exp.company} style={{ color: textMid }} className="font-semibold text-3xl xl:text-4xl leading-tight" />
                    <CustomeText title={exp.duration} style={{ color: textLight }} className="text-xl xl:text-2xl font-normal" />
                  </div>

                  {/* Center Column: Timeline Dot (Always aligned to the top level of company name) */}
                  <div className="w-16 flex items-center justify-center shrink-0 mt-1 relative z-10">
                    <div style={{ borderColor: textMid }} className="w-12 h-12 rounded-full border-2 border-dashed bg-white shadow-sm flex items-center justify-center">
                      <div style={{ backgroundColor: primaryColor }} className="w-8 h-8 rounded-full" />
                    </div>
                  </div>

                  {/* Right Column: Role & Description */}
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <CustomeText title={exp.role} style={{ color: textMid }} className="font-semibold text-3xl xl:text-4xl leading-tight" />
                    {exp.desc && (
                      <p style={{ color: textLight }} className="text-xl leading-relaxed whitespace-pre-line break-words">
                        {exp.desc}
                      </p>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      )}

      {/* Hire Me Section */}
      {(hireMe?.title || hireMe?.description || formattedHireMeImage) && (
        <div
          style={{ backgroundColor: lightBg }}
          className="w-full max-w-[1298px] mx-auto flex flex-col lg:flex-row items-center justify-between px-6 lg:px-[71px] py-16 lg:py-[100px] rounded-[32px] lg:rounded-[50px] gap-12 lg:gap-[96px] border border-black/5 shadow-sm transition-colors duration-300"
        >
          {formattedHireMeImage && (
            <ScrollReveal direction="left" delay={100} className="w-full max-w-[450px] mx-auto lg:mx-0 shrink-0">
              <div
                style={{ backgroundColor: darkBg }}
                className="relative w-full aspect-square rounded-[32px] sm:rounded-[40px] overflow-hidden border-2 border-white/40 shadow-xl group"
              >
                <Image
                  src={formattedHireMeImage}
                  alt={hireMe?.title || "Hire me"}
                  fill
                  className="object-contain z-10 p-2 transition-all duration-500 ease-in-out group-hover:scale-105"
                  priority
                  unoptimized
                />
              </div>
            </ScrollReveal>
          )}

          <ScrollReveal direction="right" delay={150} className="w-full max-w-xl">
            <div className="flex flex-col items-start gap-6">
              {hireMe?.title && (
                <div className="flex flex-wrap text-4xl sm:text-5xl lg:text-6xl font-semibold gap-2">
                  <CustomeText title={hireMe.title} style={{ color: primaryColor }} />
                </div>
              )}

              {hireMe?.description && (
                <p style={{ color: textLight }} className="text-base sm:text-lg lg:text-xl leading-relaxed max-w-md">
                  {hireMe.description}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-8 w-full">
                {hireMe?.stat1Value && (
                  <div className="flex flex-col">
                    <CustomeText
                      title={hireMe.stat1Value}
                      style={{ color: textMid }}
                      className="text-[32px] sm:text-[36px] font-medium"
                    />
                    <CustomeText
                      title={hireMe.stat1Label || ""}
                      style={{ color: textLight }}
                      className="text-lg"
                    />
                  </div>
                )}
                {hireMe?.stat2Value && (
                  <div className="flex flex-col">
                    <CustomeText
                      title={hireMe.stat2Value}
                      style={{ color: textMid }}
                      className="text-[32px] sm:text-[36px] font-medium"
                    />
                    <CustomeText
                      title={hireMe.stat2Label || ""}
                      style={{ color: textLight }}
                      className="text-lg"
                    />
                  </div>
                )}
              </div>

              {contactEmail && (
                <ClientOnly>
                  <button
                    onClick={handleHireMe}
                    style={{ color: textMid, borderColor: textMid }}
                    className="w-full cursor-pointer sm:w-auto px-8 py-4 rounded-[20px] border font-semibold text-xl transition-all duration-300 hover:bg-[#151515] hover:text-white active:scale-95 shadow-sm"
                  >
                    Hire me
                  </button>
                </ClientOnly>
              )}
            </div>
          </ScrollReveal>
        </div>
      )}

      {/* Portfolio Section */}
      {portfolioData.length > 0 && (
        <div id="portfolio" className="w-full flex flex-col items-center px-4 sm:px-6 lg:px-[71px] py-12 sm:py-20 gap-10 lg:gap-12">
          {portfolioSectionTitle && (
            <ScrollReveal direction="up" delay={100} className="w-full">
              <div className="w-full flex flex-col sm:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex flex-col items-start max-w-full lg:max-w-[750px]">
                  {(() => {
                    const raw = portfolioSectionTitle.trim();
                    const lastSpace = raw.lastIndexOf(" ");
                    if (lastSpace === -1) {
                      return (
                        <CustomeText
                          title={raw}
                          style={{ color: primaryColor }}
                          className="font-semibold text-[32px] sm:text-[48px] lg:text-[64px]"
                        />
                      );
                    }
                    const first = raw.substring(0, lastSpace);
                    const last = raw.substring(lastSpace + 1);
                    return (
                      <div className="flex items-start justify-start gap-3 flex-wrap">
                        <CustomeText
                          title={first}
                          style={{ color: textDark }}
                          className="font-semibold text-[32px] sm:text-[48px] lg:text-[64px]"
                        />
                        <CustomeText
                          title={last}
                          style={{ color: primaryColor }}
                          className="font-semibold text-[32px] sm:text-[48px] lg:text-[64px]"
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>
            </ScrollReveal>
          )}

          <ScrollReveal direction="up" delay={200} className="w-full flex flex-col items-center gap-10 max-w-[1290px]">
            <GenericSlider
              data={portfolioData.map((p) => ({
                ...p,
                image: formatGoogleDriveUrl(p.image, ""),
              }))}
              slidesPerView={2}
              heightClass="h-auto"
              cardType="portfolio"
              onItemClick={(item) => handlePortfolioClick(item as PortfolioItem)}
            />
          </ScrollReveal>
        </div>
      )}

      {/* Optional Blog Posts Section */}
      {blogsData.length > 0 && (
        <div className="flex flex-col w-full h-fit items-center gap-12 px-4 sm:px-6 lg:px-[71px] py-[80px]">
          {blogsSectionTitle && (
            <ScrollReveal direction="up" delay={100} className="w-full max-w-[1298px]">
              <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6">
                <h1 style={{ color: textDark }} className="w-fit font-bold text-4xl md:text-5xl">
                  {blogsSectionTitle}
                </h1>
              </div>
            </ScrollReveal>
          )}
          
          <ScrollReveal direction="up" delay={200} className="w-full flex justify-center">
            <GenericSlider
              data={blogsData.map((b) => ({
                ...b,
                image: formatGoogleDriveUrl(b.image, ""),
              }))}
              slidesPerView={3}
              heightClass=""
              cardType="blog"
              onItemClick={(item) => handleBlogClick(item as BlogItem)}
            />
          </ScrollReveal>
        </div>
      )}

      {/* Modals */}
      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        service={selectedService}
      />

      <PortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
        portfolio={selectedPortfolio}
      />
    </div>
  );
}