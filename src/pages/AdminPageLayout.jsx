import React, { useState, useEffect, useCallback } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { Menu, X } from "lucide-react";

const SIDEBAR_WIDTH = 252;

const COLORS = {
  paper: "#f2fbee",
  panelDark: "#16241A",
  primary: "#82C46C",
  primaryText: "#3F7A2F",
  white: "#ffffff",
};

export default function AdminPageLayout({
  children,
  activeKey,
  onNavigate,
  permissions = null,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer  = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  /* Lock body scroll while the mobile drawer is open */
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  /* Close drawer when user presses Escape */
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen, closeDrawer]);

  return (
    <div className="adm-layout">
      <style>{`
        /* ─── Reset ──────────────────────────────────────────── */
        .adm-layout, .adm-layout * { box-sizing: border-box; }

        /* ─── Root container ─────────────────────────────────── */
        .adm-layout {
          display: flex;
          height: 100vh;
          width: 100%;
          overflow: hidden;
          position: relative;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ─── Desktop sidebar (always visible ≥ 769px) ───────── */
        .adm-layout__sidebar {
          width: ${SIDEBAR_WIDTH}px;
          flex-shrink: 0;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          background: ${COLORS.panelDark};
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.12) transparent;
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 200;
        }
        .adm-layout__sidebar::-webkit-scrollbar { width: 5px; }
        .adm-layout__sidebar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 3px;
        }

        /* ─── Main content area ──────────────────────────────── */
        .adm-layout__main {
          flex: 1;
          min-width: 0;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          background: ${COLORS.paper};
          display: flex;
          flex-direction: column;
        }

        /* ─── Mobile top header bar (hidden on desktop) ──────── */
        .adm-layout__mobile-header {
          display: none;
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          height: 56px;
          background: ${COLORS.panelDark};
          color: ${COLORS.white};
          align-items: center;
          padding: 0 16px;
          gap: 12px;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        }
        .adm-layout__mobile-header-title {
          font-size: 15px;
          font-weight: 600;
          color: ${COLORS.primary};
          letter-spacing: 0.01em;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Hamburger / close button */
        .adm-layout__menu-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border: none;
          background: rgba(255,255,255,0.08);
          color: ${COLORS.white};
          border-radius: 8px;
          cursor: pointer;
          flex-shrink: 0;
          transition: background 0.15s ease;
        }
        .adm-layout__menu-btn:hover {
          background: rgba(255,255,255,0.14);
        }
        .adm-layout__menu-btn:focus-visible {
          outline: 2px solid ${COLORS.primary};
          outline-offset: 2px;
        }

        /* ─── Overlay (mobile only) ──────────────────────────── */
        .adm-layout__overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          z-index: 300;
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          animation: overlayFadeIn 0.22s ease forwards;
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .adm-layout__overlay.is-visible {
          display: block;
        }

        /* ─── Drawer (mobile sidebar) ────────────────────────── */
        .adm-layout__drawer {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: min(${SIDEBAR_WIDTH}px, 85vw);
          background: ${COLORS.panelDark};
          z-index: 400;
          overflow-y: auto;
          overflow-x: hidden;
          transform: translateX(-100%);
          transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.12) transparent;
        }
        .adm-layout__drawer::-webkit-scrollbar { width: 5px; }
        .adm-layout__drawer::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.12);
          border-radius: 3px;
        }
        .adm-layout__drawer.is-open {
          transform: translateX(0);
        }

        /* ─── Content wrapper (fills remaining height) ───────── */
        .adm-layout__content {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
        }

        /* ─── Mobile breakpoint  ≤ 768px ─────────────────────── */
        @media (max-width: 768px) {
          /* Hide desktop sidebar */
          .adm-layout__sidebar {
            display: none;
          }

          /* Show mobile header */
          .adm-layout__mobile-header {
            display: flex;
          }

          /* Show drawer shell */
          .adm-layout__drawer {
            display: block;
          }

          /* Main content fills whole width, no left gap */
          .adm-layout__main {
            width: 100%;
          }

          /* Reduce padding inside content on small screens */
          .adm-layout__content {
            padding: 0;
          }
        }

        /* ─── Tablet breakpoint  769px – 1024px ──────────────── */
        @media (min-width: 769px) and (max-width: 1024px) {
          .adm-layout__sidebar {
            width: 220px;
          }
        }

        /* ─── Global responsive helpers for page content ─────── */
        /* Pages use inline styles, but tables need overflow handling */
        @media (max-width: 768px) {
          /* Ensure tables inside main area scroll horizontally */
          .adm-layout__content table {
            min-width: 540px;
          }
          .adm-layout__content > * {
            max-width: 100vw;
          }
        }
      `}</style>

      {/* ── Desktop sidebar (always visible on ≥ 769px) ── */}
      <aside className="adm-layout__sidebar" aria-label="Admin navigation">
        <AdminSidebar
          activeKey={activeKey}
          onNavigate={onNavigate}
          permissions={permissions}
        />
      </aside>

      {/* ── Main content column ── */}
      <div className="adm-layout__main">

        {/* Mobile header bar */}
        <header className="adm-layout__mobile-header" aria-label="Mobile navigation header">
          <button
            id="adm-drawer-toggle"
            className="adm-layout__menu-btn"
            onClick={openDrawer}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="adm-drawer"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <span className="adm-layout__mobile-header-title">e-Dossier Admin</span>
        </header>

        {/* Scrollable page content */}
        <div className="adm-layout__content">
          {children}
        </div>
      </div>

      {/* ── Mobile overlay ── */}
      <div
        className={`adm-layout__overlay${drawerOpen ? " is-visible" : ""}`}
        aria-hidden="true"
        onClick={closeDrawer}
      />

      {/* ── Mobile drawer ── */}
      <nav
        id="adm-drawer"
        className={`adm-layout__drawer${drawerOpen ? " is-open" : ""}`}
        aria-label="Mobile admin navigation"
        aria-modal="true"
        role="dialog"
      >
        <AdminSidebar
          activeKey={activeKey}
          onNavigate={(key) => {
            onNavigate?.(key);
            closeDrawer();
          }}
          permissions={permissions}
        />
      </nav>
    </div>
  );
}