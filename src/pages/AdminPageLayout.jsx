import React, { useState, useEffect } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { Menu, X } from "lucide-react";

const SIDEBAR_WIDTH = 250;

const COLORS = {
  paper: "#f2fbee",
  panelDark: "#16241A",
};

export default function AdminPageLayout({
  children,
  activeKey,
  onNavigate,
  permissions = null,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    if (!sidebarOpen) return;
    const handleClick = (e) => {
      if (e.target.classList.contains("admin-layout__sidebar-overlay")) {
        closeSidebar();
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [sidebarOpen]);

  return (
    <div className="admin-layout">
      <style>{`
        .admin-layout {
          display: flex;
          height: 100vh;
          width: 100%;
        }
        .admin-layout * { box-sizing: border-box; }

        .admin-layout__sidebar {
          width: ${SIDEBAR_WIDTH}px;
          flex-shrink: 0;
          background-color: ${COLORS.panelDark};
          overflow-y: auto;
        }

        .admin-layout__main {
          flex: 1;
          background-color: ${COLORS.paper};
          overflow-y: auto;
          min-width: 0;
        }

        .admin-layout__toggle {
          display: none;
          position: fixed;
          top: 12px;
          left: 12px;
          z-index: 1100;
          padding: 8px;
          background: ${COLORS.panelDark};
          color: ${COLORS.paper};
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .admin-layout__sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 900;
        }

        @media (max-width: 768px) {
          .admin-layout__toggle {
            display: block;
          }

          .admin-layout__sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            width: ${SIDEBAR_WIDTH}px;
          }

          .admin-layout__sidebar-overlay.is-open {
            display: block;
          }

          .admin-layout__sidebar.is-open {
            transform: translateX(0);
          }

          .admin-layout__main {
            width: 100%;
            padding-top: 56px;
          }
        }
      `}</style>

      <button
        className="admin-layout__toggle"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-label="Toggle navigation"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {sidebarOpen && (
        <div
          className="admin-layout__sidebar-overlay is-open"
          aria-hidden="true"
        />
      )}

      <aside
        className={`admin-layout__sidebar${sidebarOpen ? " is-open" : ""}`}
      >
        <AdminSidebar
          activeKey={activeKey}
          onNavigate={(key) => {
            onNavigate?.(key);
            closeSidebar();
          }}
          permissions={permissions}
        />
      </aside>

      <main className="admin-layout__main">{children}</main>
    </div>
  );
}