"use client";

import React, { useState, useEffect } from "react";

export default function PageLoader({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={mounted ? "opacity-100 transition-opacity duration-200" : "opacity-100"}>
      {children}
    </div>
  );
}

