import Navbar from "@/src/components/Navbar";
import RightSideBar from "@/src/components/RightSideBar";
import Sidebar from "@/src/components/Sidebar";
import { useRouter } from "next/router";
import React, { ReactNode, useEffect, useState } from "react";

interface MainlayoutProps {
  children: ReactNode;
}

// below this width the sidebar is a drawer; it matches Tailwind's md breakpoint
const DRAWER_BELOW = 768;

const Mainlayout = ({ children }: MainlayoutProps) => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  // only phones use the drawer
  const toggleSidebar = () => {
    if (window.innerWidth < DRAWER_BELOW) setSidebarOpen((open) => !open);
  };

  // close the drawer after every navigation
  useEffect(() => {
    router.events.on("routeChangeStart", closeSidebar);
    return () => router.events.off("routeChangeStart", closeSidebar);
  }, [router.events]);

  // close it when the window grows past phone size, for example when a phone is rotated
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= DRAWER_BELOW) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // the page behind an open drawer should not scroll, and Escape closes it
  useEffect(() => {
    if (!sidebarOpen) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSidebar();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [sidebarOpen]);

  return (
    <div className="bg-[#f8f9fa] text-[#3a3a3a] min-h-screen">
      <Navbar handleslidein={toggleSidebar} />
      <div className="flex max-w-full py-1">
        <Sidebar isopen={sidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 bg-white">{children}</main>
        <div className="hidden lg:block border-1 borde-gray-200">
          <RightSideBar />
        </div>
      </div>
    </div>
  );
};

export default Mainlayout;