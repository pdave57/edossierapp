import React, { useMemo, useState } from "react";
import {
  Home,
  LayoutDashboard,
  Map,
  Landmark,
  School,
  CalendarRange,
  CalendarDays,
  Layers,
  Layers3,
  BookOpen,
  Users as UsersIcon,
  ShieldCheck,
  UserCog,
  GraduationCap,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
//import logoMoe from "./assets/logomoe.jpg";

/**
 * e-Dossier — Admin Sidebar Navigation
 *
 * Structure:
 *  - Users        (ACCORDION) : Roles, Role assignment
 *  - Overview                  : Dashboard
 *  - State setup                : Zones, LGAs
 *  - Schools                     : All schools, Academic years, Terms, Levels, Sublevels, Subjects
 *  - Exams                       : Exams
 *  - Personnel
 *  - Students
 *
 * --- Permissions ---
 * Pass `permissions` as an array (or Set) of allowed item keys, e.g.
 *   permissions={["dashboard", "zones", "lgas", "students"]}
 * Any item whose key isn't included is hidden. Any group left with zero
 * visible items is hidden entirely. Pass `permissions={null}` (default)
 * to show everything — useful for super-admins or while wiring this up.
 *
 * Wire `onNavigate(key)` to your router (react-router, etc).
 * `activeKey` should match the `key` of the current route.
 */

const COLORS = {
  primary: "#82C46C",
  primaryText: "#3F7A2F",
  primaryLight: "#9ED389",
  gold: "#B8860B",
  paper: "#FAF7F0",
  sage: "#E8EDE7",
  ink: "#1A1A1A",
  inkSoft: "#5C5C54",
  alert: "#B33A3A",
  line: "#D8D2C2",
  panelDark: "#16241A",
};

// Groups marked `accordion: true` render as collapsible; all others render flat/always-expanded.
const NAV_GROUPS = [
  {
    id: "users",
    label: "Users",
    accordion: true,
    defaultOpen: false,
    items: [
      { key: "users", label: "Users", icon: UsersIcon },
      { key: "roles", label: "Roles", icon: ShieldCheck },
      { key: "role-permissions", label: "Role permissions", icon: UserCog },
    ],
  },
  {
    id: "overview",
    label: "Overview",
    items: [
      { key: "home", label: "Home", icon: Home },
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    id: "state-setup",
    label: "State setup",
    items: [
      { key: "zones", label: "Zones", icon: Map },
      { key: "lgas", label: "LGAs", icon: Landmark },
    ],
  },
  {
    id: "schools",
    label: "Schools",
    items: [
      { key: "schools", label: "All schools", icon: School },
      { key: "academic-years", label: "Academic years", icon: CalendarRange },
      { key: "terms", label: "Terms", icon: CalendarDays },
      { key: "levels", label: "Levels", icon: Layers },
      { key: "sublevels", label: "Sublevels", icon: Layers3 },
      { key: "subjects", label: "Subjects", icon: BookOpen },
    ],
  },
  {
    id: "exams",
    label: "Exams",
    items: [
      { key: "exams", label: "Exams", icon: FileSpreadsheet },
    ],
  },
  {
    id: "personnel",
    label: "Personnel",
    items: [
      { key: "personnel", label: "Personnel", icon: UsersIcon },
    ],
  },
  {
    id: "students",
    label: "Students",
    items: [
      { key: "students", label: "Students", icon: GraduationCap },
    ],
  },
];

/**
 * Filters nav groups down to allowed items.
 * - permissions = null/undefined  -> everything visible (no filtering)
 * - permissions = [] or Set()     -> nothing visible
 * - otherwise                      -> only items whose key is in the set survive;
 *                                     groups with zero surviving items are dropped
 */
function filterGroupsByPermissions(groups, permissions) {
  if (permissions == null) return groups;
  const allowed = permissions instanceof Set ? permissions : new Set(permissions);

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowed.has(item.key)),
    }))
    .filter((group) => group.items.length > 0);
}

function NavItem({ item, isActive, onClick }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className={`nav-item ${isActive ? "is-active" : ""}`}
      onClick={() => onClick(item.key)}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="nav-item__rail" />
      <Icon size={17} strokeWidth={2} className="nav-item__icon" />
      <span className="nav-item__label">{item.label}</span>
    </button>
  );
}

function NavGroup({ group, activeKey, onNavigate, isOpen, onToggle }) {
  if (group.accordion) {
    return (
      <div className="nav-group">
        <button
          type="button"
          className={`nav-group__accordion-head ${isOpen ? "is-open" : ""}`}
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          <span>{group.label}</span>
          <ChevronDown size={14} strokeWidth={2.5} className="nav-group__chevron" />
        </button>
        {isOpen && (
          <div className="nav-group__items nav-group__items--accordion">
            {group.items.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                isActive={activeKey === item.key}
                onClick={onNavigate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="nav-group">
      <div className="nav-group__label">{group.label}</div>
      <div className="nav-group__items">
        {group.items.map((item) => (
          <NavItem
            key={item.key}
            item={item}
            isActive={activeKey === item.key}
            onClick={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}

export default function AdminSidebar({
  activeKey: activeKeyProp,
  onNavigate: onNavigateProp,
  permissions = null, // array or Set of allowed item keys; null = show all
}) {
  const [activeKeyState, setActiveKeyState] = useState("dashboard");
  const activeKey = activeKeyProp ?? activeKeyState;
  const onNavigate = onNavigateProp ?? setActiveKeyState;

  const visibleGroups = useMemo(
    () => filterGroupsByPermissions(NAV_GROUPS, permissions),
    [permissions]
  );

  const [openAccordions, setOpenAccordions] = useState(() => {
    const initial = {};
    NAV_GROUPS.forEach((g) => {
      if (g.accordion) initial[g.id] = !!g.defaultOpen;
    });
    return initial;
  });

  const toggleAccordion = (id) =>
    setOpenAccordions((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <nav className="admin-sidebar" aria-label="Admin navigation">
      <style>{`
        .admin-sidebar {
          --primary: ${COLORS.primary};
          --primary-text: ${COLORS.primaryText};
          width: 248px;
          height: 100%;
          background: ${COLORS.panelDark};
          color: ${COLORS.paper};
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          padding: 20px 0 16px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          text-align: left;
          overflow-y: auto;
        }
        .admin-sidebar * { box-sizing: border-box; }

        .admin-sidebar__brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          padding: 4px 20px 18px;
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(250, 247, 240, 0.1);
        }
        .admin-sidebar__brand-mark {
          width: 64px;
          height: 64px;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
          background: ${COLORS.paper};
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-sidebar__brand-mark img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .admin-sidebar__brand-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.3;
        }
        .admin-sidebar__brand-title {
          font-family: 'Source Serif Pro', Georgia, serif;
          font-weight: 600;
          font-size: 13px;
          color: ${COLORS.paper};
        }
        .admin-sidebar__brand-sub {
          font-size: 10px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(250, 247, 240, 0.55);
          margin-top: 2px;
        }

        .nav-group {
          padding: 14px 12px 4px;
        }
        .nav-group__label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(250, 247, 240, 0.4);
          padding: 0 10px 8px;
        }
        .nav-group__items {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .nav-group__accordion-head {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          text-align: left;
          background: transparent;
          border: none;
          color: ${COLORS.paper};
          font-family: 'Source Serif Pro', Georgia, serif;
          font-weight: 600;
          font-size: 14.5px;
          padding: 4px 10px 8px;
          cursor: pointer;
          border-radius: 5px;
        }
        .nav-group__accordion-head:hover {
          color: ${COLORS.primary};
        }
        .nav-group__accordion-head:focus-visible {
          outline: 2px solid ${COLORS.primary};
          outline-offset: 1px;
        }
        .nav-group__chevron {
          color: ${COLORS.primary};
          transition: transform 0.15s ease;
        }
        .nav-group__accordion-head.is-open .nav-group__chevron {
          transform: rotate(180deg);
        }
        .nav-group__items--accordion {
          padding-left: 6px;
          border-left: 1px solid rgba(130, 196, 108, 0.18);
          margin-left: 14px;
        }

        .nav-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          width: 100%;
          padding: 8px 10px 8px 14px;
          border: none;
          background: transparent;
          color: rgba(250, 247, 240, 0.78);
          font-size: 13.5px;
          font-weight: 500;
          border-radius: 5px;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 0.12s ease, color 0.12s ease;
        }
        .nav-item:hover {
          background: rgba(250, 247, 240, 0.06);
          color: ${COLORS.paper};
        }
        .nav-item:focus-visible {
          outline: 2px solid ${COLORS.primary};
          outline-offset: 1px;
        }
        .nav-item.is-active {
          background: rgba(130, 196, 108, 0.14);
          color: ${COLORS.paper};
          font-weight: 600;
        }
        .nav-item__rail {
          position: absolute;
          left: 0;
          top: 6px;
          bottom: 6px;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: transparent;
        }
        .nav-item.is-active .nav-item__rail {
          background: ${COLORS.primary};
        }
        .nav-item__icon {
          flex-shrink: 0;
          color: ${COLORS.primary};
          opacity: 0.85;
        }
        .nav-item.is-active .nav-item__icon {
          opacity: 1;
        }
        .nav-item__label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-sidebar::-webkit-scrollbar { width: 6px; }
        .admin-sidebar::-webkit-scrollbar-thumb {
          background: rgba(250, 247, 240, 0.15);
          border-radius: 3px;
        }
      `}</style>

      <div className="admin-sidebar__brand">
        <span className="admin-sidebar__brand-mark">
          <img src="/images/logomoe.jpg"alt="Taraba State Ministry of Education crest" />
        </span>
        <div className="admin-sidebar__brand-text">
          <span className="admin-sidebar__brand-title">Ministry of Education</span>
          <span className="admin-sidebar__brand-sub">Taraba State · HQ</span>
        </div>
      </div>

      {visibleGroups.map((group) => (
        <NavGroup
          key={group.id}
          group={group}
          activeKey={activeKey}
          onNavigate={onNavigate}
          isOpen={!!openAccordions[group.id]}
          onToggle={() => toggleAccordion(group.id)}
        />
      ))}
    </nav>
  );
}