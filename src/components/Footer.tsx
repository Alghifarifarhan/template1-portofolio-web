"use client";
import React from "react";
import { FacebookIcon, YoutubeIcon, InstagramIcon, TwitterIcon, MessageCircle, ArrowUpRight, Github, Linkedin } from "lucide-react";
import { PinterestIcon } from "./ui/Icons";
import CustomeText from "./ui/CustomeText";
import Link from "next/link";
import ClientOnly from "./ui/ClientOnly";
import { useAdmin } from "@/context/AdminContext";
import { usePathname } from "next/navigation";
import ScrollReveal from "./ui/ScrollReveal";

const Footer = () => {
    const pathname = usePathname();
    const { content } = useAdmin();

    const footerData = content?.footer;
    const primaryColor = content?.colors?.primary || "#FD853A";
    const darkBg = content?.colors?.dark || "#272727";
    const navigation = content?.navbar?.menuItems || [];
    const navTargets = content?.navbar?.menuTargets || [];
    const contactEmail = footerData?.email || content?.contact?.email || "";

    // Hide Footer completely on admin pages
    if (pathname && pathname.startsWith("/admin")) {
        return null;
    }

    const socialLinksMap = [
        { icon: FacebookIcon, url: footerData?.socialLinks?.facebook },
        { icon: YoutubeIcon, url: footerData?.socialLinks?.youtube },
        { icon: MessageCircle, url: footerData?.socialLinks?.whatsapp },
        { icon: InstagramIcon, url: footerData?.socialLinks?.instagram },
        { icon: TwitterIcon, url: footerData?.socialLinks?.twitter },
        { icon: Linkedin, url: footerData?.socialLinks?.linkedin },
        { icon: Github, url: footerData?.socialLinks?.github },
        { icon: PinterestIcon, url: footerData?.socialLinks?.pinterest },
    ].filter(item => item.url && item.url.trim() !== "");

    const contactItems = [
        footerData?.address,
        footerData?.email,
        footerData?.website,
    ].filter(item => item && item.trim() !== "");

    const hasTopSection = Boolean(footerData?.tagline || contactEmail);
    const hasMiddleSection = Boolean(footerData?.logoText || footerData?.description || socialLinksMap.length > 0 || navigation.length > 0 || contactItems.length > 0);

    const handleHireMe = () => {
        if (contactEmail) {
            window.location.href = `mailto:${contactEmail}`;
        }
    };

    const handleNavClick = (key: string, idx: number) => {
        // 1. Check if an explicit target is set for this index
        const customTarget = navTargets[idx];
        if (customTarget && customTarget.trim() !== "") {
            const cleanTarget = customTarget.replace(/^#/, "");
            if (cleanTarget === "hero" || cleanTarget === "top" || cleanTarget === "home") {
                window.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            const el = document.getElementById(cleanTarget);
            if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                return;
            }
        }

        // 2. Fallback: match by index or keyword
        const lower = key.toLowerCase();
        if (lower === "home" || idx === 0) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        let targetId = "";
        if (lower.includes("service") || lower.includes("layanan") || lower.includes("certif") || idx === 1) {
            targetId = "services";
        } else if (lower.includes("project") || lower.includes("portfolio") || lower.includes("proyek") || lower.includes("karya") || idx === 2) {
            targetId = "portfolio";
        } else if (lower.includes("contact") || lower.includes("kontak") || lower.includes("hubungi") || idx === 3) {
            targetId = "contact";
        } else {
            targetId = lower;
        }

        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <footer
            id="contact"
            style={{ backgroundColor: darkBg }}
            className="w-full px-4 sm:px-6 lg:px-[71px] py-[40px] flex flex-col rounded-t-2xl sm:rounded-t-3xl text-white justify-between gap-10 transition-colors duration-300"
        >
            {/* Top Section */}
            {hasTopSection && (
                <>
                    <ScrollReveal direction="up" delay={100} className="w-full flex flex-col lg:flex-row items-center justify-between gap-6">
                        {footerData?.tagline && (
                            <h1 className="font-semibold leading-tight text-[32px] sm:text-[40px] lg:text-[48px] xl:text-[64px] text-[#FCFCFD] text-center lg:text-left">
                                {footerData.tagline}
                            </h1>
                        )}
                        {contactEmail && (
                            <ClientOnly>
                                <button 
                                    onClick={handleHireMe}
                                    style={{ backgroundColor: primaryColor }}
                                    className="group flex items-center justify-center gap-2 w-full sm:w-[180px] lg:w-[202px] h-[50px] sm:h-[56px] lg:h-[62px] px-4 sm:px-5 py-2 text-white text-base sm:text-lg font-semibold rounded-full cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-md"
                                >
                                    Hire Me
                                    <ArrowUpRight
                                        size={24}
                                        className="sm:w-7 sm:h-7 lg:w-8 lg:h-8 transition-transform duration-300 group-hover:rotate-45"
                                    />
                                </button>
                            </ClientOnly>
                        )}
                    </ScrollReveal>
                    <div className="border border-[#475467] w-full"></div>
                </>
            )}

            {/* Navigation & Contact Links */}
            {hasMiddleSection && (
                <>
                    <ScrollReveal direction="up" delay={150} className="flex flex-col lg:flex-row justify-between w-full max-w-[1298px] gap-8">
                        <div className="w-full lg:w-[635px] flex flex-col items-start justify-start gap-6">
                            {footerData?.logoText && (
                                <div className="flex gap-3 items-center cursor-pointer">
                                    <div 
                                        style={{ backgroundColor: primaryColor }}
                                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                                    >
                                        <span className="font-bold text-white text-xs">
                                            {footerData.logoText.substring(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                    <span className="font-bold text-base sm:text-lg tracking-wide">{footerData.logoText}</span>
                                </div>
                            )}
                            {footerData?.description && (
                                <p className="w-full text-[16px] sm:text-[18px] text-[#FCFCFD] leading-relaxed">
                                    {footerData.description}
                                </p>
                            )}
                            {socialLinksMap.length > 0 && (
                                <div className="flex gap-2.5 flex-wrap">
                                    {socialLinksMap.map((item, idx) => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={idx}
                                                href={item.url!.startsWith("http") ? item.url! : `https://${item.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 rounded-full flex hover:scale-110 active:scale-90 transition-transform bg-white/10 hover:bg-white/20 items-center justify-center shadow-sm"
                                            >
                                                <Icon size={16} style={{ color: primaryColor }} />
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {navigation.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <CustomeText title="Navigation" style={{ color: primaryColor }} className="text-[18px] sm:text-[20px] font-semibold" />
                                <div className="flex flex-col gap-3">
                                    {navigation.map((key, idx) => (
                                        <button 
                                            key={idx} 
                                            onClick={() => handleNavClick(key, idx)}
                                            className="text-[#FCFCFD] text-[14px] sm:text-[16px] cursor-pointer hover:opacity-80 hover:translate-x-1 transition-all text-left"
                                        >
                                            {key}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {contactItems.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <CustomeText title="Contact" style={{ color: primaryColor }} className="text-[18px] sm:text-[20px] font-semibold" />
                                <div className="flex flex-col gap-3">
                                    {contactItems.map((key, idx) => (
                                        <span key={idx} className="text-[#FCFCFD] text-[14px] sm:text-[16px]">
                                            {key}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </ScrollReveal>
                    <div className="border border-[#475467] w-full mt-4"></div>
                </>
            )}

            {/* Copyright with Hyperlink (Preserved 100%) */}
            <div className="flex flex-col sm:flex-row w-full max-w-[1298px] items-center justify-between gap-4">
                <p className="text-[14px] sm:text-[16px] text-white text-center sm:text-left">
                    Copyright© 2023 Designed by{" "}
                    <a
                        href="https://www.figma.com/@jayeshpatil"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-[#98A2B3] transition-colors"
                    >
                        Jayesh
                    </a>
                    . All Rights Reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
