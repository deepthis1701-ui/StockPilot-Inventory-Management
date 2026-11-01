import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout.jsx';

import Dashboard from './pages/Dashboard.jsx';
import SalesDemand from './pages/SalesDemand.jsx';
import Inventory from './pages/Inventory.jsx';
import RiskAnalysis from './pages/RiskAnalysis.jsx';
import ReorderRecommendations from './pages/ReorderRecommendations.jsx';
import WhatIfSimulator from './pages/WhatIfSimulator.jsx';

import Assistant from './pages/Assistant.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />

          <Route path="/sales" element={<SalesDemand />} />

          <Route path="/inventory" element={<Inventory />} />

          <Route path="/risk" element={<RiskAnalysis />} />

          <Route
            path="/reorder"
            element={<ReorderRecommendations />}
          />

          <Route
            path="/simulator"
            element={<WhatIfSimulator />}
          />

          <Route
            path="/assistant"
            element={<Assistant />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

