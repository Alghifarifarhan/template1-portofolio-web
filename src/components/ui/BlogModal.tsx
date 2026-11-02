"use client";
import React, { useState, useEffect, useCallback } from "react";
import { X, Calendar, User } from "lucide-react";
import Image from "next/image";
import { formatGoogleDriveUrl } from "@/lib/utils";
import { useAdmin } from "@/context/AdminContext";

interface BlogModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: {
    title: string;
    name: string;
    date: string;
    image: string;
    content?: string;
  } | null;
}

export default function BlogModal({ isOpen, onClose, blog }: BlogModalProps) {
  const { content } = useAdmin();
  const primaryColor = content?.colors?.primary || "#FFFFFF";

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

  if ((!isOpen && !isClosing) || !blog) return null;

  const formattedImage = formatGoogleDriveUrl(blog.image, "");

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md ${
        isClosing ? "animate-backdrop-out" : "animate-backdrop-in"
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl bg-[#1f1f1f] text-white border border-[#333] rounded-[24px] overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col gap-6 max-h-[90vh] overflow-y-auto ${
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

        {/* Cover Image */}
        {formattedImage && (
          <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden bg-[#171717] shrink-0">
            <Image
              src={formattedImage}
              alt={blog.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Meta Info */}
        <div style={{ color: primaryColor }} className="flex items-center gap-4 text-xs font-medium">
          {blog.name && (
            <div className="flex items-center gap-1.5">
              <User size={14} />
              <span>{blog.name}</span>
            </div>
          )}
          {blog.date && (
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{blog.date}</span>
            </div>
          )}
        </div>

        {/* Title & Content */}
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
            {blog.title}
          </h2>
          <p className="text-[#D0D5DD] text-base leading-relaxed whitespace-pre-line">
            {blog.content || "Tidak ada konten artikel."}
          </p>
        </div>
      </div>
    </div>
  );
}
