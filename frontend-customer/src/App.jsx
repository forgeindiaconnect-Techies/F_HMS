import { Routes, Route } from 'react-router-dom';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';
import CustomerLayout from './layouts/CustomerLayout';
import Explore from './pages/customer/Explore';
import Menu from './pages/customer/Menu';
import RestaurantDetails from './pages/customer/RestaurantDetails';
import CustomerMenu from './pages/customer/CustomerMenu';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Checkout from './pages/customer/Checkout';
import Reservations from './pages/customer/Reservations';
import OrderTracking from './pages/customer/OrderTracking';
import OrderHistory from './pages/customer/OrderHistory';
import ReservationHistory from './pages/customer/ReservationHistory';
import CustomerOrderTracking from './pages/customer/CustomerOrderTracking';
import CustomerAuthPage from './pages/CustomerAuthPage';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Main Customer Layout with Navbar & Footer */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Explore />} />
          <Route path="explore" element={<Explore />} />
          <Route path="menu" element={<Menu />} />
          <Route path="restaurant/:id" element={<RestaurantDetails />} />
          
          {/* Protected Customer Routes */}
          <Route path="profile" element={<CustomerProtectedRoute><CustomerDashboard /></CustomerProtectedRoute>} />
          <Route path="profile/orders" element={<CustomerProtectedRoute><OrderHistory /></CustomerProtectedRoute>} />
          <Route path="profile/reservations" element={<CustomerProtectedRoute><ReservationHistory /></CustomerProtectedRoute>} />
          <Route path="checkout" element={<CustomerProtectedRoute><Checkout /></CustomerProtectedRoute>} />
          <Route path="track/:id" element={<CustomerProtectedRoute><OrderTracking /></CustomerProtectedRoute>} />
          <Route path="reservations" element={<CustomerProtectedRoute><Reservations /></CustomerProtectedRoute>} />
        </Route>

        {/* Standalone / QR Ordering & Live Tracking (Contactless Dining) */}
        <Route path="/customer/menu" element={<CustomerMenu />} />
        <Route path="/customer/track/:orderId" element={<CustomerOrderTracking />} />

        {/* Customer Authentication */}
        <Route path="/login" element={<CustomerAuthPage />} />
        <Route path="/register" element={<CustomerAuthPage />} />
        <Route path="/customer/login" element={<CustomerAuthPage />} />
        <Route path="/customer/register" element={<CustomerAuthPage />} />

        {/* 404 Fallback */}
        <Route path="*" element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4">
            <h1 className="text-6xl font-black mb-3">404</h1>
            <p className="text-lg font-medium text-gray-500 mb-6">Page not found</p>
            <a href="/" className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors">
              Back to Explore
            </a>
          </div>
        } />
      </Routes>
    </>
  );
}

export default App;
