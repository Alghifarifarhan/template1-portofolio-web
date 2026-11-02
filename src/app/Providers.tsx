"use client";
import React from "react";
import { AdminProvider } from "@/context/AdminContext";
import PageLoader from "@/components/ui/PageLoader";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <PageLoader>{children}</PageLoader>
    </AdminProvider>
  );
}

