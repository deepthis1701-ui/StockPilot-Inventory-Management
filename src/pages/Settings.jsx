import React, { useState } from 'react';
import {
  Store,
  Package,
  Bell,
  Palette,
  User,
  Save,
  CheckCircle2,
} from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    storeName: 'GreenMart Grocery',
    ownerName: 'Store Owner',
    storeType: 'Grocery Store',
    location: 'Chennai, Tamil Nadu',

    leadTime: '3',
    lowStockWarning: '3',
    reorderReminder: true,
    safetyBuffer: '10',

    lowStockAlerts: true,
    purchaseReminders: true,
    demandAlerts: true,
    weeklySummary: true,

    currency: '₹ INR',
    dateFormat: 'DD/MM/YYYY',
    viewDensity: 'Comfortable',
  });

  const updateSetting = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  return (
    <div className="settings-page">
      <style>{`
        .settings-page {
          min-height: 100%;
          padding: 34px 38px;
          background: #f7f8fa;
          color: #172033;
        }

        .settings-container {
          max-width: 1050px;
          margin: 0 auto;
        }

        .settings-header {
          padding-bottom: 28px;
          border-bottom: 1px solid #e4e8ed;
        }

        .settings-kicker {
          margin-bottom: 8px;
          color: #7b8794;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .settings-header h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.2;
          font-weight: 760;
          letter-spacing: -0.035em;
        }

        .settings-header p {
          margin: 9px 0 0;
          color: #697686;
          font-size: 13px;
          line-height: 1.6;
        }

        .settings-content {
          margin-top: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settings-section {
          background: #fff;
          border: 1px solid #dfe4ea;
          border-radius: 12px;
          overflow: hidden;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 19px 22px;
          border-bottom: 1px solid #e9edf1;
        }

        .section-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e2e6eb;
          border-radius: 8px;
          background: #fafbfc;
          color: #566273;
          flex-shrink: 0;
        }

        .section-header h2 {
          margin: 0;
          font-size: 13px;
          font-weight: 750;
          color: #202b3b;
        }

        .section-header p {
          margin: 3px 0 0;
          color: #8a95a3;
          font-size: 10px;
        }

        .settings-body {
          padding: 4px 22px;
        }

        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          min-height: 66px;
          border-bottom: 1px solid #edf0f3;
        }

        .setting-row:last-child {
          border-bottom: 0;
        }

        .setting-info {
          min-width: 0;
        }

        .setting-label {
          display: block;
          color: #354154;
          font-size: 12px;
          font-weight: 650;
        }

        .setting-description {
          display: block;
          margin-top: 4px;
          color: #8a95a3;
          font-size: 10px;
          line-height: 1.45;
        }

        .setting-control {
          width: 230px;
          flex-shrink: 0;
        }

        .setting-input,
        .setting-select {
          width: 100%;
          height: 35px;
          padding: 0 10px;
          border: 1px solid #dfe4ea;
          border-radius: 7px;
          outline: none;
          background: #fff;
          color: #263244;
          font-size: 11px;
          font-weight: 600;
          transition: border-color 0.15s ease;
        }

        .setting-input:focus,
        .setting-select:focus {
          border-color: #9aa5b1;
        }

        /* TOGGLE */

        .toggle {
          position: relative;
          width: 38px;
          height: 21px;
          flex-shrink: 0;
          border: 0;
          border-radius: 20px;
          background: #d6dce3;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .toggle.active {
          background: #172033;
        }

        .toggle-circle {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s ease;
        }

        .toggle.active .toggle-circle {
          transform: translateX(17px);
        }

        /* ACCOUNT */

        .account-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 20px 22px;
        }

        .account-info {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .account-avatar {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #eef1f4;
          color: #4b5868;
          font-size: 13px;
          font-weight: 800;
        }

        .account-name {
          color: #263244;
          font-size: 12px;
          font-weight: 750;
        }

        .account-role {
          margin-top: 3px;
          color: #8a95a3;
          font-size: 10px;
        }

        .account-status {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #687586;
          font-size: 10px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #36a269;
        }

        /* SAVE AREA */

        .save-area {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 0 4px;
        }

        .save-message {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #25804b;
          font-size: 11px;
          font-weight: 650;
        }

        .save-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          height: 37px;
          padding: 0 17px;
          border: 1px solid #172033;
          border-radius: 7px;
          background: #172033;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .save-button:hover {
          background: #263244;
        }

        /* RESPONSIVE */

        @media (max-width: 700px) {
          .settings-page {
            padding: 24px 18px;
          }

          .settings-header h1 {
            font-size: 27px;
          }

          .setting-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 12px;
            padding: 16px 0;
          }

          .setting-control {
            width: 100%;
          }

          .setting-row.toggle-row {
            align-items: center;
            flex-direction: row;
          }

          .account-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .save-area {
            align-items: stretch;
            flex-direction: column;
          }

          .save-button {
            width: 100%;
          }
        }

        @media print {
          .settings-page {
            background: #fff;
            padding: 0;
          }

          .save-area {
            display: none;
          }
        }
      `}</style>

      <div className="settings-container">

        {/* HEADER */}
        <header className="settings-header">
          <div className="settings-kicker">
            System preferences
          </div>

          <h1>Settings</h1>

          <p>
            Manage your store information and StockPilot preferences.
          </p>
        </header>

        <div className="settings-content">

          {/* STORE PROFILE */}
          <section className="settings-section">
            <div className="section-header">
              <div className="section-icon">
                <Store size={17} />
              </div>

              <div>
                <h2>Store Profile</h2>
                <p>Basic information about your store.</p>
              </div>
            </div>

            <div className="settings-body">

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Store name
                  </span>
                  <span className="setting-description">
                    The name displayed throughout StockPilot.
                  </span>
                </div>

                <div className="setting-control">
                  <input
                    className="setting-input"
                    value={settings.storeName}
                    onChange={(e) =>
                      updateSetting('storeName', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Owner name
                  </span>
                  <span className="setting-description">
                    Store owner or primary account holder.
                  </span>
                </div>

                <div className="setting-control">
                  <input
                    className="setting-input"
                    value={settings.ownerName}
                    onChange={(e) =>
                      updateSetting('ownerName', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Store type
                  </span>
                  <span className="setting-description">
                    Used to personalize your store experience.
                  </span>
                </div>

                <div className="setting-control">
                  <select
                    className="setting-select"
                    value={settings.storeType}
                    onChange={(e) =>
                      updateSetting('storeType', e.target.value)
                    }
                  >
                    <option>Grocery Store</option>
                    <option>Supermarket</option>
                    <option>Mini Mart</option>
                    <option>Convenience Store</option>
                  </select>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Location
                  </span>
                  <span className="setting-description">
                    Your primary store location.
                  </span>
                </div>

                <div className="setting-control">
                  <input
                    className="setting-input"
                    value={settings.location}
                    onChange={(e) =>
                      updateSetting('location', e.target.value)
                    }
                  />
                </div>
              </div>

            </div>
          </section>

          {/* INVENTORY PREFERENCES */}
          <section className="settings-section">
            <div className="section-header">
              <div className="section-icon">
                <Package size={17} />
              </div>

              <div>
                <h2>Inventory Preferences</h2>
                <p>Set how StockPilot handles purchasing reminders.</p>
              </div>
            </div>

            <div className="settings-body">

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Supplier lead time
                  </span>
                  <span className="setting-description">
                    Typical number of days for a supplier delivery.
                  </span>
                </div>

                <div className="setting-control">
                  <select
                    className="setting-select"
                    value={settings.leadTime}
                    onChange={(e) =>
                      updateSetting('leadTime', e.target.value)
                    }
                  >
                    <option value="1">1 day</option>
                    <option value="2">2 days</option>
                    <option value="3">3 days</option>
                    <option value="4">4 days</option>
                    <option value="5">5 days</option>
                    <option value="7">7 days</option>
                  </select>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Low-stock warning
                  </span>
                  <span className="setting-description">
                    Warn when stock may only cover this many days.
                  </span>
                </div>

                <div className="setting-control">
                  <select
                    className="setting-select"
                    value={settings.lowStockWarning}
                    onChange={(e) =>
                      updateSetting(
                        'lowStockWarning',
                        e.target.value
                      )
                    }
                  >
                    <option value="2">2 days of stock</option>
                    <option value="3">3 days of stock</option>
                    <option value="4">4 days of stock</option>
                    <option value="5">5 days of stock</option>
                  </select>
                </div>
              </div>

              <div className="setting-row toggle-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Reorder reminders
                  </span>
                  <span className="setting-description">
                    Remind you when products may need purchasing.
                  </span>
                </div>

                <button
                  className={`toggle ${
                    settings.reorderReminder ? 'active' : ''
                  }`}
                  onClick={() =>
                    updateSetting(
                      'reorderReminder',
                      !settings.reorderReminder
                    )
                  }
                  aria-label="Toggle reorder reminders"
                >
                  <span className="toggle-circle"></span>
                </button>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Safety buffer
                  </span>
                  <span className="setting-description">
                    Extra units kept as a reserve when planning purchases.
                  </span>
                </div>

                <div className="setting-control">
                  <select
                    className="setting-select"
                    value={settings.safetyBuffer}
                    onChange={(e) =>
                      updateSetting(
                        'safetyBuffer',
                        e.target.value
                      )
                    }
                  >
                    <option value="5">5 units</option>
                    <option value="10">10 units</option>
                    <option value="15">15 units</option>
                    <option value="20">20 units</option>
                  </select>
                </div>
              </div>

            </div>
          </section>

          {/* NOTIFICATIONS */}
          <section className="settings-section">
            <div className="section-header">
              <div className="section-icon">
                <Bell size={17} />
              </div>

              <div>
                <h2>Notifications</h2>
                <p>Choose which store updates you want to receive.</p>
              </div>
            </div>

            <div className="settings-body">

              {[
                [
                  'lowStockAlerts',
                  'Low-stock alerts',
                  'Get notified when products may run low.',
                ],
                [
                  'purchaseReminders',
                  'Purchase reminders',
                  'Receive reminders about upcoming purchases.',
                ],
                [
                  'demandAlerts',
                  'Demand change alerts',
                  'Know when demand changes significantly.',
                ],
                [
                  'weeklySummary',
                  'Weekly summary',
                  'Receive a simple weekly store summary.',
                ],
              ].map(([key, label, description]) => (
                <div
                  className="setting-row toggle-row"
                  key={key}
                >
                  <div className="setting-info">
                    <span className="setting-label">
                      {label}
                    </span>

                    <span className="setting-description">
                      {description}
                    </span>
                  </div>

                  <button
                    className={`toggle ${
                      settings[key] ? 'active' : ''
                    }`}
                    onClick={() =>
                      updateSetting(key, !settings[key])
                    }
                    aria-label={`Toggle ${label}`}
                  >
                    <span className="toggle-circle"></span>
                  </button>
                </div>
              ))}

            </div>
          </section>

          {/* APPEARANCE */}
          <section className="settings-section">
            <div className="section-header">
              <div className="section-icon">
                <Palette size={17} />
              </div>

              <div>
                <h2>Appearance</h2>
                <p>Choose how information is displayed.</p>
              </div>
            </div>

            <div className="settings-body">

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Currency
                  </span>
                  <span className="setting-description">
                    Currency used for sales and purchase values.
                  </span>
                </div>

                <div className="setting-control">
                  <select
                    className="setting-select"
                    value={settings.currency}
                    onChange={(e) =>
                      updateSetting('currency', e.target.value)
                    }
                  >
                    <option>₹ INR</option>
                    <option>$ USD</option>
                    <option>€ EUR</option>
                    <option>£ GBP</option>
                  </select>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    Date format
                  </span>
                  <span className="setting-description">
                    Format used for dates throughout the application.
                  </span>
                </div>

                <div className="setting-control">
                  <select
                    className="setting-select"
                    value={settings.dateFormat}
                    onChange={(e) =>
                      updateSetting('dateFormat', e.target.value)
                    }
                  >
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">
                    View density
                  </span>
                  <span className="setting-description">
                    Control the amount of information shown on screen.
                  </span>
                </div>

                <div className="setting-control">
                  <select
                    className="setting-select"
                    value={settings.viewDensity}
                    onChange={(e) =>
                      updateSetting('viewDensity', e.target.value)
                    }
                  >
                    <option>Comfortable</option>
                    <option>Compact</option>
                  </select>
                </div>
              </div>

            </div>
          </section>

          {/* ACCOUNT */}
          <section className="settings-section">
            <div className="section-header">
              <div className="section-icon">
                <User size={17} />
              </div>

              <div>
                <h2>Account</h2>
                <p>Your StockPilot account information.</p>
              </div>
            </div>

            <div className="account-row">
              <div className="account-info">
                <div className="account-avatar">
                  SO
                </div>

                <div>
                  <div className="account-name">
                    {settings.ownerName}
                  </div>

                  <div className="account-role">
                    Store Owner
                  </div>
                </div>
              </div>

              <div className="account-status">
                <span className="status-dot"></span>
                Active account
              </div>
            </div>
          </section>

        </div>

        {/* SAVE */}
        <div className="save-area">
          {saved && (
            <div className="save-message">
              <CheckCircle2 size={14} />
              Settings saved successfully
            </div>
          )}

          <button
            className="save-button"
            onClick={saveSettings}
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}