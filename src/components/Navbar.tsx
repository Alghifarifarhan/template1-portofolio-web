"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Menu, X } from "lucide-react";
import { useAdmin } from "@/context/AdminContext";

const Navbar = () => {
    const { content } = useAdmin();
    const rawMenuItems = useMemo(() => content?.navbar?.menuItems || [], [content?.navbar?.menuItems]);
    const menuTargets = useMemo(() => content?.navbar?.menuTargets || [], [content?.navbar?.menuTargets]);
    const menuItems = useMemo(() => rawMenuItems.filter(
        (item) => item && item.toLowerCase() !== "about" && item.toLowerCase() !== "resume"
    ), [rawMenuItems]);

    const primaryColor = content?.colors?.primary || "#FD853A";
    const darkBg = content?.colors?.dark || "#171717";

    const [selected, setSelected] = useState(menuItems[0] || "");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Scroll spy effect to update active menu item based on scroll position
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY + 250;
            const targetIds = ["contact", "portfolio", "services", "hero"];

            for (const id of targetIds) {
                const el = document.getElementById(id);
                if (el) {
                    const top = el.offsetTop;
                    if (scrollPosition >= top) {
                        // Check if an explicit target matches
                        const targetIdx = menuTargets.findIndex(t => t.replace(/^#/, "").toLowerCase() === id);
                        if (targetIdx !== -1 && menuItems[targetIdx]) {
                            setSelected(menuItems[targetIdx]);
                            return;
                        }

                        // Index-based fallback
                        let activeIdx = -1;
                        if (id === "hero") activeIdx = 0;
                        else if (id === "services") activeIdx = 1;
                        else if (id === "portfolio") activeIdx = 2;
                        else if (id === "contact") activeIdx = 3;

                        if (activeIdx !== -1 && menuItems[activeIdx]) {
                            setSelected(menuItems[activeIdx]);
                            return;
                        }
                    }
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, [menuItems, menuTargets]);

    const [isClosingMobileMenu, setIsClosingMobileMenu] = useState(false);

    const closeMobileMenuWithAnimation = () => {
        setIsClosingMobileMenu(true);
        setTimeout(() => {
            setIsMobileMenuOpen(false);
            setIsClosingMobileMenu(false);
        }, 220);
    };

    const toggleMobileMenu = () => {
        if (isMobileMenuOpen) {
            closeMobileMenuWithAnimation();
        } else {
            setIsMobileMenuOpen(true);
        }
    };

    const handleMenuClick = (item: string, idx: number) => {
        setSelected(item);
        if (isMobileMenuOpen) {
            closeMobileMenuWithAnimation();
        }

        // 1. Check if an explicit target is set for this index
        const customTarget = menuTargets[idx];
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
        const lower = item.toLowerCase();
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
        <nav
            style={{ backgroundColor: darkBg ? `${darkBg}EE` : undefined }}
            className="sticky top-0 lg:top-4 z-[999] w-full lg:max-w-[1298px] h-[65px] sm:h-[75px] lg:h-[86px] text-white px-5 lg:px-8 rounded-none lg:rounded-[50px] backdrop-blur-md border-none lg:border lg:border-white/20 shadow-2xl mx-auto flex items-center justify-between transition-all duration-300"
        >
            {/* Desktop Menu (Centered Full-Width Pill Bar) */}
            <div className="hidden lg:flex items-center justify-center gap-4 w-full">
                {menuItems.map((item, idx) => (
                    <button
                        key={item}
                        style={{ backgroundColor: selected === item ? primaryColor : "transparent" }}
                        className={`w-[140px] h-[60px] flex items-center justify-center rounded-[60px] text-base font-medium transition-all duration-300 cursor-pointer active:scale-95 ${
                            selected === item ? "font-bold shadow-md scale-105" : "hover:bg-white/10 hover:scale-105"
                        }`}
                        onClick={() => handleMenuClick(item, idx)}
                    >
                        {item}
                    </button>
                ))}
            </div>

            {/* Mobile View Title & Button */}
            <div className="lg:hidden flex items-center justify-between w-full">
                <span className="font-bold text-lg tracking-wide text-white">Menu</span>
                <button
                    style={{ backgroundColor: primaryColor }}
                    aria-label="Toggle menu"
                    className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:opacity-90 active:scale-90 transition-all duration-200 cursor-pointer shadow-md overflow-hidden"
                    onClick={toggleMobileMenu}
                >
                    <span className={`transition-transform duration-300 transform ${isMobileMenuOpen ? "rotate-90 scale-110" : "rotate-0 scale-100"}`}>
                        {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </span>
                </button>
            </div>

            {/* Mobile Menu Overlay with Seamless Dark Join & Slide Down Animation */}
            {menuItems.length > 0 && (isMobileMenuOpen || isClosingMobileMenu) && (
                <div
                    style={{ backgroundColor: darkBg }}
                    className={`absolute top-[65px] sm:top-[75px] left-0 w-full border-none shadow-2xl flex flex-col p-4 sm:p-6 gap-2 lg:hidden z-[1000] ${
                        isClosingMobileMenu ? "animate-menu-slide-up" : "animate-menu-slide-down"
                    }`}
                >
                    {menuItems.map((item, index) => (
                        <button
                            key={item}
                            style={{
                                backgroundColor: selected === item ? primaryColor : "transparent",
                                animationDelay: `${index * 60 + 40}ms`,
                            }}
                            className={`w-full py-3.5 px-6 rounded-2xl text-left text-base sm:text-lg font-medium transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                                isClosingMobileMenu ? "" : "animate-menu-item"
                            } ${
                                selected === item ? "font-bold text-white shadow-md" : "text-[#D0D5DD] hover:bg-white/10 hover:text-white"
                            }`}
                            onClick={() => handleMenuClick(item, index)}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
