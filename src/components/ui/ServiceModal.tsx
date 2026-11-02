"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { formatGoogleDriveUrl } from "@/lib/utils";

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    title: string;
    imageSrc: string;
    description?: string;
  } | null;
}

export default function ServiceModal({ isOpen, onClose, service }: ServiceModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isClosing, handleClose]);

  if ((!isOpen && !isClosing) || !service) return null;

  const formattedImage = formatGoogleDriveUrl(service.imageSrc, "");

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md ${
        isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-xl bg-[#1f1f1f] text-white border border-[#333] rounded-[24px] overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-6 ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] active:scale-90 hover:rotate-90 text-white flex items-center justify-center transition-all duration-200 cursor-pointer z-10 shadow-md"
        >
          <X size={20} />
        </button>

        {/* Image */}
        {formattedImage && (
          <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-[#171717]">
            <Image
              src={formattedImage}
              alt={service.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Title & Description */}
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {service.title}
          </h2>
          <p className="text-[#D0D5DD] text-base leading-relaxed whitespace-pre-line">
            {service.description || "Tidak ada deskripsi certificate."}
          </p>
        </div>
      </div>
    </div>
  );
}
