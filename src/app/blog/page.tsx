import { Suspense } from "react";
import BlogDetailClient from "./[id]/BlogDetailClient";

export default function BlogRootPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BlogDetailClient />
    </Suspense>
  );
}
