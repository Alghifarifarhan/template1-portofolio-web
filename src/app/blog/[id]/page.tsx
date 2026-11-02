import type { Metadata } from "next";
import { Suspense } from "react";
import BlogDetailClient from "./BlogDetailClient";
import { defaultContent } from "@/context/AdminContext";
import { formatGoogleDriveUrl } from "@/lib/utils";

export function generateStaticParams() {
  const blogIds = defaultContent?.blogs?.map((b) => ({ id: b.id })) || [];
  return [
    ...blogIds,
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "default" },
    { id: "post" },
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams?.id || "";

  // Look in default content first (or static blogs)
  const blog = defaultContent?.blogs?.find(
    (b) =>
      b.id === id ||
      encodeURIComponent(b.id) === id ||
      encodeURIComponent(b.title.toLowerCase().replace(/\s+/g, "-")) === id
  );

  const title = blog?.title ? `${blog.title} | Blog` : "Artikel Blog | Portfolio";
  const rawContent = blog?.content || blog?.title || "Baca artikel blog dan insight terbaru seputar portofolio dan teknologi.";
  const cleanSnippet = rawContent.replace(/\r?\n|\r/g, " ").trim();
  const description =
    cleanSnippet.length > 160 ? cleanSnippet.substring(0, 157) + "..." : cleanSnippet;
  const imageUrl = blog?.image ? formatGoogleDriveUrl(blog.image) : "";

  return {
    title,
    description,
    openGraph: {
      title: blog?.title || title,
      description,
      type: "article",
      images: imageUrl ? [{ url: imageUrl, alt: blog?.title || "Cover Blog" }] : [],
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: blog?.title || title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function BlogDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BlogDetailClient />
    </Suspense>
  );
}
