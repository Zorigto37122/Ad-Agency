import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { authService } from './services/authService';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Monitoring } from './pages/Monitoring';
import { Orders } from './pages/Orders';
import { OrderForm } from './pages/OrderForm';
import { OrderDetail } from './pages/OrderDetail';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { Profile } from './pages/Profile';
import { Contact } from './pages/Contact';
import { Messages } from './pages/Messages';
import { Discounts } from './pages/Discounts';
import { Campaigns } from './pages/Campaigns';
import { CampaignDetail } from './pages/CampaignDetail';
import { Channels } from './pages/Channels';
import { AudienceSegments } from './pages/AudienceSegments';
import { Placements } from './pages/Placements';
import { ContentCalendar } from './pages/ContentCalendar';
import { Invoices } from './pages/Invoices';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { Tasks } from './pages/Tasks';
import { Leads } from './pages/Leads';
import { Contracts } from './pages/Contracts';
import { Vendors } from './pages/Vendors';
import { User } from './types';

function SupportPage() {
  return (
    <div className="page-content max-w-2xl">
      <h1 className="page-title">Поддержка</h1>
      <div className="card space-y-4">
        <p className="text-gray-500 text-sm">Раздел поддержки находится в разработке.</p>
        <div className="flex items-center gap-3 p-4 bg-dark-hover rounded-xl border border-dark-border">
          <svg className="w-5 h-5 text-accent-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-white">Email поддержки</p>
            <p className="text-xs text-gray-600 mt-0.5">support@adagency.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const { toasts, addToast, removeToast } = useToast();
  const navigate = useNavigate();

  const handleLogin = () => {
    const stored = authService.getStoredUser();
    setUser(stored);
    navigate(stored?.is_admin ? '/' : '/profile');
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} addToast={addToast} />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-screen bg-dark-bg">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header user={user} onLogout={handleLogout} />
          <main className="flex-1 overflow-auto">
            <Routes>
              {user.is_admin ? (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/monitoring" element={<Monitoring />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="/messages" element={<Messages addToast={addToast} />} />
                  <Route path="/discounts" element={<Discounts addToast={addToast} />} />
                  <Route path="/orders" element={<Orders addToast={addToast} />} />
                  <Route path="/orders/new" element={<OrderForm addToast={addToast} />} />
                  <Route path="/orders/:id" element={<OrderDetail addToast={addToast} />} />
                  <Route path="/orders/:id/edit" element={<OrderForm addToast={addToast} />} />
                  <Route path="/clients" element={<Clients addToast={addToast} />} />
                  <Route path="/clients/:id" element={<ClientDetail addToast={addToast} />} />
                  <Route path="/campaigns" element={<Campaigns addToast={addToast} />} />
                  <Route path="/campaigns/:id" element={<CampaignDetail addToast={addToast} />} />
                  <Route path="/channels" element={<Channels addToast={addToast} />} />
                  <Route path="/segments" element={<AudienceSegments addToast={addToast} />} />
                  <Route path="/placements" element={<Placements addToast={addToast} />} />
                  <Route path="/content-calendar" element={<ContentCalendar addToast={addToast} />} />
                  <Route path="/invoices" element={<Invoices addToast={addToast} />} />
                  <Route path="/invoices/:id" element={<InvoiceDetail addToast={addToast} />} />
                  <Route path="/tasks" element={<Tasks addToast={addToast} />} />
                  <Route path="/leads" element={<Leads addToast={addToast} />} />
                  <Route path="/contracts" element={<Contracts addToast={addToast} />} />
                  <Route path="/vendors" element={<Vendors addToast={addToast} />} />
                  <Route path="/profile" element={<Profile user={user} />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              ) : (
                <>
                  <Route path="/profile" element={<Profile user={user} />} />
                  <Route path="/orders" element={<Orders addToast={addToast} />} />
                  <Route path="/orders/new" element={<OrderForm addToast={addToast} />} />
                  <Route path="/orders/:id" element={<OrderDetail addToast={addToast} />} />
                  <Route path="/orders/:id/edit" element={<OrderForm addToast={addToast} />} />
                  <Route path="/contact" element={<Contact addToast={addToast} />} />
                  <Route path="*" element={<Navigate to="/profile" />} />
                </>
              )}
            </Routes>
          </main>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
