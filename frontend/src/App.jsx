import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import CustomerProtectedRoute from './components/CustomerProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/admin/DashboardHome';
import BranchesManagement from './pages/admin/BranchesManagement';
import MenuManagement from './pages/admin/MenuManagement';
import UsersManagement from './pages/admin/UsersManagement';
import StaffManagement from './pages/admin/StaffManagement';
import RoleManagement from './pages/admin/RoleManagement';
import CategoryManagement from './pages/admin/CategoryManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import SupplierManagement from './pages/admin/SupplierManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import ReservationManagement from './pages/admin/ReservationManagement';
import OrderManagement from './pages/admin/OrderManagement';
import PaymentManagement from './pages/admin/PaymentManagement';
import OfferManagement from './pages/admin/OfferManagement';
import TaxManagement from './pages/admin/TaxManagement';
import Reports from './pages/admin/Reports';
import Analytics from './pages/admin/Analytics';
import NotificationCenter from './pages/admin/NotificationCenter';
import ActivityLogs from './pages/admin/ActivityLogs';
import Settings from './pages/admin/Settings';
import SubscriptionPortal from './pages/admin/SubscriptionPortal';
import RestaurantVerification from './pages/admin/RestaurantVerification';
import VerificationManagement from './pages/superadmin/VerificationManagement';
import CustomerCareDashboard from './pages/admin/CustomerCareDashboard';
import CreateTicket from './pages/admin/CreateTicket';
import TicketList from './pages/admin/TicketList';
import TicketDetails from './pages/admin/TicketDetails';
import SupportKnowledgeBase from './pages/admin/SupportKnowledgeBase';
import SupportAnnouncements from './pages/admin/SupportAnnouncements';
import WaiterDashboard from './pages/staff/WaiterDashboard';
import ChefDashboard from './pages/staff/ChefDashboard';
import ChefPrepList from './pages/staff/ChefPrepList';
import ChefRecipes from './pages/staff/ChefRecipes';
import ChefInventory from './pages/staff/ChefInventory';

import ManagerDashboard from './pages/staff/ManagerDashboard';
import ManagerOrderMonitoring from './pages/staff/ManagerOrderMonitoring';
import ManagerStaff from './pages/staff/ManagerStaff';
import ManagerKitchenStatus from './pages/staff/ManagerKitchenStatus';
import ManagerInventory from './pages/staff/ManagerInventory';
import ManagerReservations from './pages/staff/ManagerReservations';
import ManagerFeedback from './pages/staff/ManagerFeedback';
import ManagerSales from './pages/staff/ManagerSales';
import ManagerReports from './pages/staff/ManagerReports';
import ManagerAnalytics from './pages/staff/ManagerAnalytics';
import ManagerSettings from './pages/staff/ManagerSettings';
import CustomerLayout from './layouts/CustomerLayout';
import ManagerLayout from './layouts/ManagerLayout';
import ChefLayout from './layouts/ChefLayout';
import WaiterLayout from './layouts/WaiterLayout';
import WaiterActiveOrders from './pages/staff/WaiterActiveOrders';
import WaiterPendingServes from './pages/staff/WaiterPendingServes';
import WaiterCompleted from './pages/staff/WaiterCompleted';
import CashierLayout from './layouts/CashierLayout';
import CashierOverview from './pages/staff/CashierOverview';
import CashierDashboard from './pages/staff/CashierDashboard';
import CashierHistory from './pages/staff/CashierHistory';
import Home from './pages/customer/Home';
import Explore from './pages/customer/Explore';
import Menu from './pages/customer/Menu';
import RestaurantDetails from './pages/customer/RestaurantDetails';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Checkout from './pages/customer/Checkout';
import Reservations from './pages/customer/Reservations';
import OrderTracking from './pages/customer/OrderTracking';
import OrderHistory from './pages/customer/OrderHistory';
import ReservationHistory from './pages/customer/ReservationHistory';
import CustomerAuthPage from './pages/CustomerAuthPage';
import StaffAuthPage from './pages/StaffAuthPage';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { CartProvider } from './context/CartContext';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import PlatformRestaurants from './pages/superadmin/PlatformRestaurants';
import PlanManagement from './pages/superadmin/PlanManagement';
import SupportTickets from './pages/superadmin/SupportTickets';
import GlobalReports from './pages/superadmin/GlobalReports';
import SuperAdminSupportConsole from './pages/superadmin/SuperAdminSupportConsole';

import PublicLayout from './layouts/PublicLayout';
import TablesManagement from './pages/admin/TablesManagement';
import CustomerMenu from './pages/customer/CustomerMenu';
import CustomerOrderTracking from './pages/customer/CustomerOrderTracking';
import DeliveryManagement from './pages/admin/DeliveryManagement';
import DeliveryPartnerLogin from './pages/customer/DeliveryPartnerLogin';
import DeliveryPartnerDashboard from './pages/customer/DeliveryPartnerDashboard';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Customer Facing Application */}
        <Route path="/" element={<CustomerAuthProvider><PublicLayout /></CustomerAuthProvider>}>
          <Route index element={<Home />} />
          <Route path="explore" element={<Explore />} />
        </Route>
        <Route path="/" element={<CustomerAuthProvider><CartProvider><CustomerLayout /></CartProvider></CustomerAuthProvider>}>
          <Route path="menu" element={<Menu />} />
          <Route path="restaurant/:id" element={<RestaurantDetails />} />
          <Route path="profile" element={<CustomerProtectedRoute><CustomerDashboard /></CustomerProtectedRoute>} />
          <Route path="profile/orders" element={<CustomerProtectedRoute><OrderHistory /></CustomerProtectedRoute>} />
          <Route path="profile/reservations" element={<CustomerProtectedRoute><ReservationHistory /></CustomerProtectedRoute>} />
          <Route path="checkout" element={<CustomerProtectedRoute><Checkout /></CustomerProtectedRoute>} />
          <Route path="track/:id" element={<CustomerProtectedRoute><OrderTracking /></CustomerProtectedRoute>} />
          <Route path="reservations" element={<CustomerProtectedRoute><Reservations /></CustomerProtectedRoute>} />
        </Route>
        
        {/* Auth */}
        <Route path="/login" element={<CustomerAuthProvider><CustomerAuthPage /></CustomerAuthProvider>} />
        <Route path="/register" element={<CustomerAuthProvider><CustomerAuthPage /></CustomerAuthProvider>} />
        
        <Route path="/staff/login" element={<StaffAuthPage />} />
        <Route path="/staff/register" element={<StaffAuthPage />} />

        {/* Public QR ordering flow */}
        <Route path="/customer/menu" element={<CustomerMenu />} />
        <Route path="/customer/track/:orderId" element={<CustomerOrderTracking />} />

        {/* Alias for super admin mistypes */}
        <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />

        {/* Super Admin Routes */}
        <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'SupportAgent']}><SuperAdminLayout /></ProtectedRoute>}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="restaurants" element={<PlatformRestaurants />} />
          <Route path="plans" element={<PlanManagement />} />
          <Route path="reports" element={<GlobalReports />} />
          <Route path="verifications" element={<VerificationManagement />} />
          <Route path="support" element={<SuperAdminSupportConsole />} />
          <Route path="support/tickets/:id" element={<TicketDetails />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['RestaurantAdmin', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="activity" element={<ActivityLogs />} />
          <Route path="verification" element={<RestaurantVerification />} />
          
          {/* Organization */}
          <Route path="branches" element={<BranchesManagement />} />
          <Route path="tables" element={<TablesManagement />} />
          
          {/* People */}
          <Route path="customers" element={<CustomerManagement />} />
          <Route path="staff" element={<StaffManagement />} />
          <Route path="users" element={<UsersManagement />} />
          <Route path="roles" element={<RoleManagement />} />
          
          {/* Operations */}
          <Route path="reservations" element={<ReservationManagement />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="delivery" element={<DeliveryManagement />} />
          
          {/* Kitchen & Catalog */}
          <Route path="menu" element={<MenuManagement />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="inventory" element={<InventoryManagement />} />
          <Route path="suppliers" element={<SupplierManagement />} />
          
          {/* Finance & Marketing */}
          <Route path="payments" element={<PaymentManagement />} />
          <Route path="offers" element={<OfferManagement />} />
          <Route path="taxes" element={<TaxManagement />} />
          
          {/* Insights */}
          <Route path="reports" element={<Reports />} />
          <Route path="analytics" element={<Analytics />} />
          
          {/* System */}
          <Route path="settings" element={<Settings />} />
          <Route path="billing" element={<SubscriptionPortal />} />
          <Route path="notifications" element={<NotificationCenter />} />

          {/* Customer Care */}
          <Route path="support" element={<CustomerCareDashboard />} />
          <Route path="support/tickets" element={<TicketList />} />
          <Route path="support/tickets/create" element={<CreateTicket />} />
          <Route path="support/tickets/:id" element={<TicketDetails />} />
          <Route path="support/knowledge-base" element={<SupportKnowledgeBase />} />
          <Route path="support/announcements" element={<SupportAnnouncements />} />
        </Route>
        
        <Route path="/manager" element={<ProtectedRoute allowedRoles={['BranchManager', 'RestaurantAdmin']}><ManagerLayout /></ProtectedRoute>}>
          <Route index element={<ManagerDashboard />} />
          <Route path="orders" element={<ManagerOrderMonitoring />} />
          <Route path="staff" element={<ManagerStaff />} />
          <Route path="kitchen" element={<ManagerKitchenStatus />} />
          <Route path="inventory" element={<ManagerInventory />} />
          <Route path="tables" element={<TablesManagement />} />
          <Route path="reservations" element={<ManagerReservations />} />
          <Route path="feedback" element={<ManagerFeedback />} />
          <Route path="sales" element={<ManagerSales />} />
          <Route path="reports" element={<ManagerReports />} />
          <Route path="analytics" element={<ManagerAnalytics />} />
          <Route path="settings" element={<ManagerSettings />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="delivery" element={<DeliveryManagement />} />
        </Route>
        
        {/* Staff Dashboards */}
        <Route path="/waiter" element={<ProtectedRoute allowedRoles={['Waiter', 'RestaurantAdmin', 'BranchManager']}><WaiterLayout /></ProtectedRoute>}>
          <Route index element={<WaiterDashboard />} />
          <Route path="orders" element={<WaiterActiveOrders />} />
          <Route path="pending" element={<WaiterPendingServes />} />
          <Route path="completed" element={<WaiterCompleted />} />
        </Route>
        
        <Route path="/chef" element={<ProtectedRoute allowedRoles={['Chef', 'RestaurantAdmin', 'BranchManager']}><ChefLayout /></ProtectedRoute>}>
          <Route index element={<ChefDashboard />} />
          <Route path="prep" element={<ChefPrepList />} />
          <Route path="recipes" element={<ChefRecipes />} />
          <Route path="inventory" element={<ChefInventory />} />
        </Route>
        
        <Route path="/cashier" element={<ProtectedRoute allowedRoles={['Cashier', 'RestaurantAdmin', 'BranchManager']}><CashierLayout /></ProtectedRoute>}>
          <Route index element={<CashierOverview />} />
          <Route path="billing" element={<CashierDashboard />} />
          <Route path="history" element={<CashierHistory />} />
        </Route>

        {/* Delivery Staff App */}
        <Route path="/delivery/login" element={<DeliveryPartnerLogin />} />
        <Route path="/delivery/dashboard" element={<ProtectedRoute allowedRoles={['DeliveryPartner']}><DeliveryPartnerDashboard /></ProtectedRoute>} />

        {/* 404 Fallback */}
        <Route path="*" element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h1 className="text-6xl font-black text-gray-900 mb-4">404</h1>
            <p className="text-xl font-medium text-gray-500 mb-8">Page not found</p>
            <a href="/" className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">Go Home</a>
          </div>
        } />
      </Routes>
    </>
  );
}

export default App;
