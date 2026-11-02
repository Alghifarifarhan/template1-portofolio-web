"use client";
import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from "react";
import { doc, getDoc, setDoc, increment, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface SiteColors {
  primary: string;
  dark: string;
  light: string;
  textDark: string;
  textMid: string;
  textLight: string;
}

export interface HeroContent {
  greeting: string;
  name: string;
  title: string;
  quote: string;
  yearsExperience: string;
  heroImage: string;
  resumeUrl: string;
  ratingStars?: number;
}

export interface NavbarContent {
  logoText: string;
  menuItems: string[];
  menuTargets?: string[];
}

export interface FooterContent {
  logoText: string;
  tagline: string;
  description: string;
  address: string;
  email: string;
  website: string;
  copyright: string;
  socialLinks: {
    facebook: string;
    youtube: string;
    whatsapp: string;
    instagram: string;
    twitter: string;
    github?: string;
    pinterest?: string;
    linkedin?: string;
  };
}

export interface ServiceItem {
  id: string;
  title: string;
  imageSrc: string;
  description?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  duration: string;
  role: string;
  desc: string;
  dotColor: string;
}

export interface PortfolioItem {
  id: string;
  image: string;
  title: string;
  href: string;
  desc: string;
}

export interface BlogItem {
  id: string;
  image: string;
  button: string;
  name: string;
  date: string;
  title: string;
  content?: string;
}

export interface HireMeContent {
  title: string;
  description: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  heroImage: string;
}

export interface ContactContent {
  title: string;
  subtitle: string;
  email: string;
}

export interface SectionTitles {
  services: string;
  experience: string;
  portfolio: string;
  blogs: string;
}

export interface SiteContent {
  isSampleCleaned?: boolean;
  colors: SiteColors;
  navbar: NavbarContent;
  hero: HeroContent;
  sectionTitles?: SectionTitles;
  servicesTitle?: string;
  experiencesTitle?: string;
  portfolioTitle?: string;
  blogsTitle?: string;
  services: ServiceItem[];
  experiences: ExperienceItem[];
  portfolio: PortfolioItem[];
  blogs: BlogItem[];
  hireMe: HireMeContent;
  contact: ContactContent;
  footer: FooterContent;
}

export interface SiteStats {
  viewsCount: number;
  totalUploadBytes: number;
  totalDownloadBytes: number;
}

const defaultContent: SiteContent = {
  isSampleCleaned: false,
  colors: {
    primary: "#FD853A",
    dark: "#171717",
    light: "#F2F4F7",
    textDark: "#344054",
    textMid: "#1D2939",
    textLight: "#98A2B3",
  },
  navbar: {
    logoText: "",
    menuItems: [],
    menuTargets: [],
  },
  hero: {
    greeting: "",
    name: "",
    title: "",
    quote: "",
    yearsExperience: "",
    heroImage: "",
    resumeUrl: "",
    ratingStars: 0,
  },
  sectionTitles: {
    services: "",
    experience: "",
    portfolio: "",
    blogs: "",
  },
  servicesTitle: "",
  experiencesTitle: "",
  portfolioTitle: "",
  blogsTitle: "",
  services: [],
  experiences: [],
  portfolio: [],
  blogs: [],
  hireMe: {
    title: "",
    description: "",
    stat1Value: "",
    stat1Label: "",
    stat2Value: "",
    stat2Label: "",
    heroImage: "",
  },
  contact: {
    title: "",
    subtitle: "",
    email: "",
  },
  footer: {
    logoText: "",
    tagline: "",
    description: "",
    address: "",
    email: "",
    website: "",
    copyright: "",
    socialLinks: {
      facebook: "",
      youtube: "",
      whatsapp: "",
      instagram: "",
      twitter: "",
      github: "",
      pinterest: "",
      linkedin: "",
    },
  },
};

const defaultStats: SiteStats = {
  viewsCount: 0,
  totalUploadBytes: 0,
  totalDownloadBytes: 0,
};

const CACHE_KEY = "portfolio_site_content_cache_v1";
const CACHE_STATS_KEY = "portfolio_site_stats_cache_v1";
const SYNC_CHANNEL_NAME = "portfolio_site_content_sync_channel";

const filterMenuItems = (items?: string[]): string[] => {
  if (!items || !Array.isArray(items)) return [];
  return items.filter(
    (item) => item && item.toLowerCase() !== "about" && item.toLowerCase() !== "resume"
  );
};

export const applyColorsToCss = (colors?: Partial<SiteColors>) => {
  if (typeof window === "undefined" || !colors) return;
  if (colors.primary) document.documentElement.style.setProperty("--primary-color", colors.primary);
  if (colors.dark) document.documentElement.style.setProperty("--dark-bg", colors.dark);
  if (colors.light) document.documentElement.style.setProperty("--light-bg", colors.light);
  if (colors.textDark) document.documentElement.style.setProperty("--text-dark", colors.textDark);
  if (colors.textMid) document.documentElement.style.setProperty("--text-mid", colors.textMid);
  if (colors.textLight) document.documentElement.style.setProperty("--text-light", colors.textLight);
};

export const mergeWithDefaultContent = (data: Partial<SiteContent> & { footer?: { phone?: string } }): SiteContent => {
  const servicesT = data.sectionTitles?.services || data.servicesTitle || "";
  const expT = data.sectionTitles?.experience || data.experiencesTitle || "";
  const portT = data.sectionTitles?.portfolio || data.portfolioTitle || "";
  const blogsT = data.sectionTitles?.blogs || data.blogsTitle || "";

  return {
    ...defaultContent,
    ...data,
    colors: { ...defaultContent.colors, ...(data.colors || {}) },
    sectionTitles: {
      services: servicesT,
      experience: expT,
      portfolio: portT,
      blogs: blogsT,
    },
    servicesTitle: servicesT,
    experiencesTitle: expT,
    portfolioTitle: portT,
    blogsTitle: blogsT,
    navbar: {
      ...defaultContent.navbar,
      ...(data.navbar || {}),
      menuItems: filterMenuItems(data.navbar?.menuItems),
      menuTargets: data.navbar?.menuTargets || [],
    },
    hero: { ...defaultContent.hero, ...(data.hero || {}) },
    hireMe: { ...defaultContent.hireMe, ...(data.hireMe || {}) },
    contact: { ...defaultContent.contact, ...(data.contact || {}) },
    footer: {
      ...defaultContent.footer,
      ...(data.footer || {}),
      address: data.footer?.address || data.footer?.phone || "",
      socialLinks: { ...defaultContent.footer.socialLinks, ...(data.footer?.socialLinks || {}) },
    },
  };
};

const getInitialContent = (): SiteContent => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const merged = mergeWithDefaultContent(parsed);
        applyColorsToCss(merged.colors);
        return merged;
      }
    } catch {
      // Fallback to pure defaultContent
    }
  }
  return defaultContent;
};

const getInitialStats = (): SiteStats => {
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(CACHE_STATS_KEY);
      if (cached) {
        return { ...defaultStats, ...JSON.parse(cached) };
      }
    } catch {
      // Fallback
    }
  }
  return defaultStats;
};

export type SyncStatus = "saved" | "saving" | "idle";

interface AdminContextType {
  content: SiteContent;
  stats: SiteStats;
  syncStatus: SyncStatus;
  updateContent: (newContent: SiteContent) => Promise<void>;
  updateContentLive: (newContent: SiteContent, immediateFirestore?: boolean) => void;
  cleanAllSampleData: () => Promise<void>;
  recordPageView: () => Promise<void>;
  fetchStats: () => Promise<void>;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType>({
  content: defaultContent,
  stats: defaultStats,
  syncStatus: "saved",
  updateContent: async () => {},
  updateContentLive: () => {},
  cleanAllSampleData: async () => {},
  recordPageView: async () => {},
  fetchStats: async () => {},
  loading: false,
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(getInitialContent);
  const [stats, setStats] = useState<SiteStats>(getInitialStats);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");

  const channelRef = useRef<BroadcastChannel | null>(null);
  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestContentRef = useRef<SiteContent>(content);

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  // Sync CSS theme color custom properties whenever colors change
  useEffect(() => {
    applyColorsToCss(content?.colors);
  }, [content?.colors]);

  const fetchStats = async () => {
    try {
      const statsRef = doc(db, "analytics", "stats");
      const statsSnap = await getDoc(statsRef);
      if (statsSnap.exists()) {
        const data = statsSnap.data() as SiteStats;
        const statsData: SiteStats = {
          viewsCount: data.viewsCount || 0,
          totalUploadBytes: data.totalUploadBytes || 0,
          totalDownloadBytes: data.totalDownloadBytes || 0,
        };
        setStats(statsData);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(statsData));
          } catch {}
        }
      }
    } catch {
      // Silently handle adblocker or permission restrictions
    }
  };

  // Setup Real-Time Firestore onSnapshot + BroadcastChannel + Storage Event Listener
  useEffect(() => {
    // 1. Instant initial cache read
    if (typeof window !== "undefined") {
      const cached = getInitialContent();
      if (cached) {
        setContent(cached);
        applyColorsToCss(cached.colors);
      }
    }

    // 2. Setup BroadcastChannel for zero-latency inter-tab live synchronization
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        const ch = new BroadcastChannel(SYNC_CHANNEL_NAME);
        channelRef.current = ch;
        ch.onmessage = (event) => {
          if (event?.data?.type === "REALTIME_CONTENT_UPDATE" && event.data.payload) {
            const incoming = event.data.payload as SiteContent;
            setContent(incoming);
            applyColorsToCss(incoming.colors);
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(incoming));
            } catch {}
          }
        };
      } catch (err) {
        console.warn("BroadcastChannel initialization warning:", err);
      }
    }

    // 3. Storage event listener fallback
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CACHE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          const merged = mergeWithDefaultContent(parsed);
          setContent(merged);
          applyColorsToCss(merged.colors);
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // 4. Firestore onSnapshot real-time listener (updates across different browsers / visitors / devices)
    let unsubscribe = () => {};
    try {
      const docRef = doc(db, "siteContent", "main");
      unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as SiteContent & { footer?: { phone?: string } };
            const mergedContent = mergeWithDefaultContent(data);
            setContent(mergedContent);
            applyColorsToCss(mergedContent.colors);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(mergedContent));
              } catch {}
            }
          }
          setLoading(false);
        },
        (err) => {
          console.warn("Firestore real-time listener error:", err);
          setLoading(false);
        }
      );
    } catch (err) {
      console.warn("Error attaching Firestore listener:", err);
      setLoading(false);
    }

    fetchStats();

    return () => {
      unsubscribe();
      window.removeEventListener("storage", handleStorageChange);
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
      }
    };
  }, []);

  const recordPageView = async () => {
    try {
      const statsRef = doc(db, "analytics", "stats");
      const estimatedDownloadPerView = 340000;
      await setDoc(
        statsRef,
        {
          viewsCount: increment(1),
          totalDownloadBytes: increment(estimatedDownloadPerView),
        },
        { merge: true }
      );
      setStats((prev) => {
        const nextStats = {
          ...prev,
          viewsCount: prev.viewsCount + 1,
          totalDownloadBytes: prev.totalDownloadBytes + estimatedDownloadPerView,
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(nextStats));
          } catch {}
        }
        return nextStats;
      });
    } catch {
      // Silently handle adblocker or permission restrictions
    }
  };

  // Helper to persist to Firestore
  const persistToFirestore = useCallback(async (contentToSave: SiteContent) => {
    try {
      setSyncStatus("saving");
      await setDoc(doc(db, "siteContent", "main"), contentToSave);

      try {
        const payloadBytes = new Blob([JSON.stringify(contentToSave)]).size + 50000;
        const statsRef = doc(db, "analytics", "stats");
        await setDoc(
          statsRef,
          {
            totalUploadBytes: increment(payloadBytes),
          },
          { merge: true }
        );
        setStats((prev) => {
          const nextStats = {
            ...prev,
            totalUploadBytes: prev.totalUploadBytes + payloadBytes,
          };
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(CACHE_STATS_KEY, JSON.stringify(nextStats));
            } catch {}
          }
          return nextStats;
        });
      } catch {
        // Silently handle analytics update notice
      }
      setSyncStatus("saved");
    } catch (err) {
      console.error("Error saving real-time content to Firestore:", err);
      setSyncStatus("saved");
    }
  }, []);

  // Real-time update function: updates local state + CSS + BroadcastChannel instantly, and debounces or immediately saves to Firestore
  const updateContentLive = useCallback(
    (newContent: SiteContent, immediateFirestore = false) => {
      const contentToSave: SiteContent = {
        ...newContent,
        isSampleCleaned: true,
      };

      // 1. Instant local state update
      setContent(contentToSave);

      // 2. Instant CSS custom properties update
      applyColorsToCss(contentToSave.colors);

      // 3. Instant local cache update
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(contentToSave));
        } catch {}
      }

      // 4. Instant BroadcastChannel emit to all open tabs/windows
      if (channelRef.current) {
        try {
          channelRef.current.postMessage({
            type: "REALTIME_CONTENT_UPDATE",
            payload: contentToSave,
          });
        } catch {}
      }

      // 5. Persist to Firestore (Immediate or Debounced)
      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
        saveDebounceTimerRef.current = null;
      }

      if (immediateFirestore) {
        persistToFirestore(contentToSave);
      } else {
        setSyncStatus("saving");
        saveDebounceTimerRef.current = setTimeout(() => {
          persistToFirestore(contentToSave);
          saveDebounceTimerRef.current = null;
        }, 400);
      }
    },
    [persistToFirestore]
  );

  const updateContent = async (newContent: SiteContent) => {
    updateContentLive(newContent, true);
  };

  const cleanAllSampleData = async () => {
    const cleanedContent: SiteContent = {
      isSampleCleaned: true,
      colors: content?.colors || defaultContent.colors,
      navbar: {
        logoText: "",
        menuItems: [],
        menuTargets: [],
      },
      hero: {
        greeting: "",
        name: "",
        title: "",
        quote: "",
        yearsExperience: "",
        heroImage: "",
        resumeUrl: "",
        ratingStars: 0,
      },
      sectionTitles: {
        services: "",
        experience: "",
        portfolio: "",
        blogs: "",
      },
      servicesTitle: "",
      experiencesTitle: "",
      portfolioTitle: "",
      blogsTitle: "",
      services: [],
      experiences: [],
      portfolio: [],
      blogs: [],
      hireMe: {
        title: "",
        description: "",
        stat1Value: "",
        stat1Label: "",
        stat2Value: "",
        stat2Label: "",
        heroImage: "",
      },
      contact: {
        title: "",
        subtitle: "",
        email: "",
      },
      footer: {
        logoText: "",
        tagline: "",
        description: "",
        address: "",
        email: "",
        website: "",
        copyright: "",
        socialLinks: {
          facebook: "",
          youtube: "",
          whatsapp: "",
          instagram: "",
          twitter: "",
          github: "",
          pinterest: "",
          linkedin: "",
        },
      },
    };

    await updateContent(cleanedContent);
  };

  return (
    <AdminContext.Provider
      value={{
        content,
        stats,
        syncStatus,
        updateContent,
        updateContentLive,
        cleanAllSampleData,
        recordPageView,
        fetchStats,
        loading,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);
export { defaultContent };
