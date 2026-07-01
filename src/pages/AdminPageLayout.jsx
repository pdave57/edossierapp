import React from "react";
import AdminSidebar from "../components/AdminSidebar";

/**
 * AdminPageLayout — bare structural shell for every admin page.
 *
 * Sidebar fixed at 250px, main content takes the remaining space.
 * No card, table, or button styling lives here — that belongs to
 * whatever page you render as `children` (e.g. a Students table page).
 * Both panels use plain e-Dossier backgrounds: dark panel for the
 * sidebar, cream paper for main content.
 *
 * Usage:
 *   <AdminPageLayout
 *     activeKey="students"
 *     onNavigate={(key) => navigate(`/admin/${key}`)}
 *     permissions={userPermissions}   // optional, see AdminSidebar
 *   >
 *     <StudentsPage />
 *   </AdminPageLayout>
 */

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
      `}</style>

      <aside className="admin-layout__sidebar">
        <AdminSidebar
          activeKey={activeKey}
          onNavigate={onNavigate}
          permissions={permissions}
        />
      </aside>

      <main className="admin-layout__main">{children}</main>
    </div>
  );
}