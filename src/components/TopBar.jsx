import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { NOTIFICATIONS } from '../data/sampleData.js';

const ICONS = {
  alert: AlertTriangle,
  'trending-up': TrendingUp,
  check: CheckCircle2,
};

export default function TopBar({ title, onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target)
      ) {
        setNotifOpen(false);
      }

      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  return (
    <header className="topbar">
      {/* Left */}
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn menu-toggle"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>

        <div className="topbar-heading">
          <h1 className="topbar-title">{title}</h1>

          <span className="topbar-context">
            Inventory management dashboard
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="topbar-right">

        {/* Search */}
        <div className="topbar-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search products..."
            aria-label="Search products"
          />

          <span className="search-shortcut">
            /
          </span>
        </div>

        {/* Notifications */}
        <div
          className="dropdown-wrapper"
          ref={notifRef}
        >
          <button
            type="button"
            className={`icon-btn ${
              notifOpen ? 'active' : ''
            }`}
            onClick={() => {
              setNotifOpen(!notifOpen);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="badge-dot" />
          </button>

          {notifOpen && (
            <div className="dropdown notification-dropdown">
              <div className="dropdown-header">
                <div>
                  <h3>Notifications</h3>

                  <span className="dropdown-header-sub">
                    Recent store activity
                  </span>
                </div>

                <span className="badge badge-danger">
                  4 new
                </span>
              </div>

              <div className="dropdown-body">
                {NOTIFICATIONS.map((notification) => {
                  const Icon =
                    ICONS[notification.icon] ||
                    AlertTriangle;

                  return (
                    <div
                      key={notification.id}
                      className="notification-item"
                    >
                      <div
                        className={`notification-icon ${notification.type}`}
                      >
                        <Icon size={17} />
                      </div>

                      <div className="notification-content">
                        <div className="notification-title">
                          {notification.title}
                        </div>

                        <div className="notification-time">
                          {notification.time}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="dropdown-footer">
                <button type="button">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div
          className="dropdown-wrapper"
          ref={profileRef}
        >
          <button
            type="button"
            className={`topbar-profile ${
              profileOpen ? 'active' : ''
            }`}
            onClick={() => {
              setProfileOpen(!profileOpen);
              setNotifOpen(false);
            }}
            aria-label="User menu"
          >
            <div className="topbar-profile-avatar">
              U
            </div>

            <div className="topbar-profile-info">
              <span className="topbar-profile-name">
                User
              </span>

              <span className="topbar-profile-role">
                Store User
              </span>
            </div>

            <ChevronDown
              size={15}
              className={`profile-chevron ${
                profileOpen ? 'open' : ''
              }`}
            />
          </button>

          {profileOpen && (
            <div className="dropdown profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar">
                  U
                </div>

                <div>
                  <div className="profile-dropdown-name">
                    User
                  </div>

                  <div className="profile-dropdown-email">
                    Store User
                  </div>
                </div>
              </div>

              <div className="profile-dropdown-items">
                <button type="button">
                  <User size={16} />
                  Profile
                </button>

                <button type="button">
                  <Settings size={16} />
                  Store Settings
                </button>

                <button
                  type="button"
                  className="danger"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}