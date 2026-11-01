import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopBar from './TopBar.jsx';
import '../styles/layout.css';

const TITLES = {
  '/': 'Dashboard',
  '/sales': 'Sales & Demand',
  '/inventory': 'Inventory Management',
  '/risk': 'Inventory Risk',
  '/reorder': 'Reorder Recommendations',
  '/simulator': 'Inventory Planner',
  '/assistant': 'StockPilot Assistant',
  '/reports': 'Business Reports',
  '/settings': 'Store Settings',
};

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const title = TITLES[location.pathname] || 'StockPilot';

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`app-main ${
          collapsed ? 'collapsed' : ''
        }`}
      >
        <TopBar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main
          className="app-content page-enter"
          key={location.pathname}
        >
          {children}
        </main>
      </div>
    </div>
  );
}