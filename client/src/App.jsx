/**
 * App Component — Root Router
 * 
 * Sets up client-side routing using React Router v6.
 * 
 * Route structure:
 * - Admin routes (with Navbar): /, /event-types/new, /event-types/:id/edit, /availability, /meetings
 * - Public routes (no Navbar): /book/:slug, /booking/confirmation
 * 
 * Why React Router?: It's the standard for SPA routing in React.
 * Alternative: Next.js file-based routing — but we're using Vite + React
 * as specified. React Router gives us full control over route structure.
 * 
 * The admin routes are wrapped in a layout with Navbar. Public booking
 * pages have no navbar to keep the interface clean for invitees.
 */

import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import EventTypeForm from './pages/EventTypeForm';
import Availability from './pages/Availability';
import Meetings from './pages/Meetings';
import PublicBooking from './pages/PublicBooking';
import Confirmation from './pages/Confirmation';

/**
 * Admin Layout — wraps admin pages with the Sidebar
 * Uses CSS Grid: sidebar on left, content on right
 */
function AdminLayout() {
  return (
    <div className="admin-layout">
      <Navbar />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Routes (with Navbar) */}
        <Route element={<AdminLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/event-types/new" element={<EventTypeForm />} />
          <Route path="/event-types/:id/edit" element={<EventTypeForm />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/meetings" element={<Meetings />} />
        </Route>

        {/* Public Routes (no Navbar) */}
        <Route path="/book/:slug" element={<PublicBooking />} />
        <Route path="/booking/confirmation" element={<Confirmation />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
