import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Package,
  ShieldAlert,
  ShoppingCart,
  FlaskConical,
  FileBarChart,
  Settings,
  Boxes,
  ChevronLeft,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'MAIN',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        icon: LayoutDashboard,
        end: true,
      },
      {
        to: '/sales',
        label: 'Sales & Demand',
        icon: TrendingUp,
      },
      {
        to: '/inventory',
        label: 'Inventory',
        icon: Package,
      },
      {
        to: '/risk',
        label: 'Risk Analysis',
        icon: ShieldAlert,
      },
      {
        to: '/reorder',
        label: 'Reorder Recommendations',
        icon: ShoppingCart,
      },
    ],
  },

  {
    title: 'TOOLS',
    items: [
      {
        to: '/simulator',
        label: 'Inventory Planner',
        icon: FlaskConical,
      },
      {
        to: '/reports',
        label: 'Reports',
        icon: FileBarChart,
      },
    ],
  },

  {
    title: 'SYSTEM',
    items: [
      {
        to: '/settings',
        label: 'Settings',
        icon: Settings,
      },
    ],
  },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${
          mobileOpen ? 'show' : ''
        }`}
        onClick={onCloseMobile}
      />

      {/* Sidebar */}
      <aside
        className={`sidebar ${
          collapsed ? 'collapsed' : ''
        } ${
          mobileOpen ? 'mobile-open' : ''
        }`}
      >
        {/* Brand */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Boxes size={21} />
          </div>

          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">
              StockPilot
            </span>

            <span className="sidebar-brand-sub">
              Inventory Intelligence
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div
              className="nav-section"
              key={section.title}
            >
              <div className="nav-section-title">
                {section.title}
              </div>

              <div className="nav-section-items">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `nav-item ${
                          isActive ? 'active' : ''
                        }`
                      }
                      data-tooltip={
                        collapsed
                          ? item.label
                          : undefined
                      }
                    >
                      <Icon size={18} />

                      <span className="nav-label">
                        {item.label}
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-info">
            <div className="sidebar-footer-avatar">
              U
            </div>

            <div className="sidebar-footer-details">
              <div className="sidebar-footer-name">
                User
              </div>

              <div className="sidebar-footer-role">
                Store User
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Collapse Button */}
      <button
        type="button"
        className={`sidebar-collapse-btn ${
          collapsed ? 'collapsed' : ''
        }`}
        onClick={onToggleCollapse}
        aria-label={
          collapsed
            ? 'Expand sidebar'
            : 'Collapse sidebar'
        }
      >
        <ChevronLeft size={15} />
      </button>
    </>
  );
}