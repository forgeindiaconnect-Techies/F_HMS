import { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
const FreeTrialManagement = lazy(() => import('./pages/superadmin/FreeTrialManagement'));
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
const DashboardHome = lazy(() => import('./pages/admin/DashboardHome'));
const BranchesManagement = lazy(() => import('./pages/admin/BranchesManagement'));
const MenuManagement = lazy(() => import('./pages/admin/MenuManagement'));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'));
const RoleManagement = lazy(() => import('./pages/admin/RoleManagement'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'));
const InventoryManagement = lazy(() => import('./pages/admin/InventoryManagement'));
const SupplierManagement = lazy(() => import('./pages/admin/SupplierManagement'));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement'));
const ReservationManagement = lazy(() => import('./pages/admin/ReservationManagement'));
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'));
const PaymentManagement = lazy(() => import('./pages/admin/PaymentManagement'));
const BillingManagement = lazy(() => import('./pages/admin/BillingManagement'));
const OfferManagement = lazy(() => import('./pages/admin/OfferManagement'));
const TaxManagement = lazy(() => import('./pages/admin/TaxManagement'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const NotificationCenter = lazy(() => import('./pages/admin/NotificationCenter'));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const RestaurantSetupWizard = lazy(() => import('./pages/admin/RestaurantSetupWizard'));
const TipManagement = lazy(() => import('./pages/admin/TipManagement'));
const SubscriptionPortal = lazy(() => import('./pages/admin/SubscriptionPortal'));
const RestaurantVerification = lazy(() => import('./pages/admin/RestaurantVerification'));
const FranchiseManagement = lazy(() => import('./pages/admin/FranchiseManagement'));
const CentralKitchen = lazy(() => import('./pages/admin/CentralKitchen'));
const DeveloperConfig = lazy(() => import('./pages/admin/DeveloperConfig'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const BusinessIntelligence = lazy(() => import('./pages/admin/BusinessIntelligence'));
const ExpenseSummaryAdmin = lazy(() => import('./pages/admin/ExpenseSummaryAdmin'));
const ProfitAndLoss = lazy(() => import('./pages/admin/ProfitAndLoss'));
const DailyEarnings = lazy(() => import('./pages/admin/DailyEarnings'));
const VerificationManagement = lazy(() => import('./pages/superadmin/VerificationManagement'));
const AdminCustomerCare = lazy(() => import('./pages/admin/AdminCustomerCare'));
const CustomerCareDashboard = lazy(() => import('./pages/admin/CustomerCareDashboard'));
const CreateTicket = lazy(() => import('./pages/admin/CreateTicket'));
const TicketList = lazy(() => import('./pages/admin/TicketList'));
const TicketDetails = lazy(() => import('./pages/admin/TicketDetails'));
const SupportKnowledgeBase = lazy(() => import('./pages/admin/SupportKnowledgeBase'));
const SupportAnnouncements = lazy(() => import('./pages/admin/SupportAnnouncements'));
const WaiterDashboard = lazy(() => import('./pages/staff/WaiterDashboard'));
const WaiterSettings = lazy(() => import('./pages/staff/WaiterSettings'));
const ChefDashboard = lazy(() => import('./pages/staff/ChefDashboard'));
const ChefPrepList = lazy(() => import('./pages/staff/ChefPrepList'));
const ChefRecipes = lazy(() => import('./pages/staff/ChefRecipes'));
const ChefInventory = lazy(() => import('./pages/staff/ChefInventory'));
const ChefKOTManagement = lazy(() => import('./pages/staff/ChefKOTManagement'));
const StaffMyLeave = lazy(() => import('./components/staff/StaffMyLeave'));
const StaffMyPayroll = lazy(() => import('./components/staff/StaffMyPayroll'));

const ManagerDashboard = lazy(() => import('./pages/staff/ManagerDashboard'));
const ManagerOrderMonitoring = lazy(() => import('./pages/staff/ManagerOrderMonitoring'));
const ManagerStaff = lazy(() => import('./pages/staff/ManagerStaff'));
const ManagerKitchenStatus = lazy(() => import('./pages/staff/ManagerKitchenStatus'));
const ManagerInventory = lazy(() => import('./pages/staff/ManagerInventory'));
const ManagerReservations = lazy(() => import('./pages/staff/ManagerReservations'));
const ManagerFeedback = lazy(() => import('./pages/staff/ManagerFeedback'));
const ManagerSales = lazy(() => import('./pages/staff/ManagerSales'));
const ManagerReports = lazy(() => import('./pages/staff/ManagerReports'));
const ManagerAnalytics = lazy(() => import('./pages/staff/ManagerAnalytics'));
const ManagerSettings = lazy(() => import('./pages/staff/ManagerSettings'));
const ManagerExpenses = lazy(() => import('./pages/staff/ManagerExpenses'));
import ManagerLayout from './layouts/ManagerLayout';
import ChefLayout from './layouts/ChefLayout';
import WaiterLayout from './layouts/WaiterLayout';
const WaiterActiveOrders = lazy(() => import('./pages/staff/WaiterActiveOrders'));
const WaiterPendingServes = lazy(() => import('./pages/staff/WaiterPendingServes'));
const WaiterCompleted = lazy(() => import('./pages/staff/WaiterCompleted'));
const WaiterPriorityActions = lazy(() => import('./pages/staff/WaiterPriorityActions'));
const WaiterFloorPlan = lazy(() => import('./pages/staff/WaiterFloorPlan'));
const WaiterKitchenTracker = lazy(() => import('./pages/staff/WaiterKitchenTracker'));
const WaiterTasks = lazy(() => import('./pages/staff/WaiterTasks'));
const WaiterPerformance = lazy(() => import('./pages/staff/WaiterPerformance'));
const WaiterShiftStatus = lazy(() => import('./pages/staff/WaiterShiftStatus'));
import CashierLayout from './layouts/CashierLayout';
const CashierOverview = lazy(() => import('./pages/staff/CashierOverview'));
const CashierDashboard = lazy(() => import('./pages/staff/CashierDashboard'));
const CashierHistory = lazy(() => import('./pages/staff/CashierHistory'));
const Home = lazy(() => import('./pages/customer/Home'));
const ThreeDemoShowcase = lazy(() => import('./pages/customer/ThreeDemoShowcase'));
const ChaiTheoryShowcase = lazy(() => import('./pages/customer/ChaiTheoryShowcase'));
const StaffAuthPage = lazy(() => import('./pages/StaffAuthPage'));
import SuperAdminLayout from './layouts/SuperAdminLayout';
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const PlatformRestaurants = lazy(() => import('./pages/superadmin/PlatformRestaurants'));
const PlanManagement = lazy(() => import('./pages/superadmin/PlanManagement'));
const SupportTickets = lazy(() => import('./pages/superadmin/SupportTickets'));
const GlobalReports = lazy(() => import('./pages/superadmin/GlobalReports'));
const SuperAdminSupportConsole = lazy(() => import('./pages/superadmin/SuperAdminSupportConsole'));
const CommissionManagement = lazy(() => import('./pages/superadmin/CommissionManagement'));
const RevenueAnalytics = lazy(() => import('./pages/superadmin/RevenueAnalytics'));
const UserManagement = lazy(() => import('./pages/superadmin/UserManagement'));
const FeatureManagement = lazy(() => import('./pages/superadmin/FeatureManagement'));
const SystemSettings = lazy(() => import('./pages/superadmin/SystemSettings'));
const NotificationManagement = lazy(() => import('./pages/superadmin/NotificationManagement'));
const BillingDemoRequestsManagement = lazy(() => import('./pages/superadmin/BillingDemoRequestsManagement'));

import PublicLayout from './layouts/PublicLayout';
const TablesManagement = lazy(() => import('./pages/admin/TablesManagement'));
const DeliveryManagement = lazy(() => import('./pages/admin/DeliveryManagement'));
const DeliveryPartnerLogin = lazy(() => import('./pages/customer/DeliveryPartnerLogin'));
const DeliveryPartnerDashboard = lazy(() => import('./pages/customer/DeliveryPartnerDashboard'));
const Contact = lazy(() => import('./pages/customer/Contact'));
const About = lazy(() => import('./pages/customer/About'));
const MyTestimonial = lazy(() => import('./pages/admin/MyTestimonial'));
const TestimonialsManagement = lazy(() => import('./pages/superadmin/TestimonialsManagement'));
const ManagementFeatures = lazy(() => import('./pages/ManagementFeatures'));
const ModuleDetails = lazy(() => import('./pages/ModuleDetails'));
const PosModuleLandingPage = lazy(() => import('./pages/customer/PosModuleLandingPage'));
const OutletTypeLandingPage = lazy(() => import('./pages/customer/OutletTypeLandingPage'));
import ThemeToggle from './components/ThemeToggle';
import FloatingVideoWidget from './components/FloatingVideoWidget';

import { Toaster } from 'react-hot-toast';

// Forwarding handler for customer routes that direct visitors to the Customer Website
const CustomerRedirect = ({ path }) => {
  const customerBaseUrl = import.meta.env.VITE_CUSTOMER_URL
    || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:5174` : '');
  useEffect(() => {
    const fullTarget = path 
      ? `${customerBaseUrl}${path}`
      : `${customerBaseUrl}${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.href = fullTarget;
  }, [customerBaseUrl, path]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-sm">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="font-bold text-slate-900">Redirecting to Customer App...</p>
        <p className="text-xs text-slate-500 mt-1">Taking you to our customer ordering portal</p>
      </div>
    </div>
  );
};


const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] dark:bg-slate-950">
    <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
  </div>
);

function App() {

  return (
    <>
      <Toaster position="top-right" />
      <FloatingVideoWidget />

      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* Public Restaurant Software Landing Page & Showcase */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="features/management" element={<ManagementFeatures />} />
          <Route path="features/details" element={<ModuleDetails />} />
          <Route path="pos/:moduleSlug" element={<PosModuleLandingPage />} />
          <Route path="pos/billing" element={<PosModuleLandingPage module="billing" />} />
          <Route path="pos/inventory" element={<PosModuleLandingPage module="inventory" />} />
          <Route path="pos/online-ordering" element={<PosModuleLandingPage module="online-ordering" />} />
          <Route path="pos/reporting" element={<PosModuleLandingPage module="reporting" />} />
          <Route path="pos/menu" element={<PosModuleLandingPage module="menu" />} />
          <Route path="pos/crm" element={<PosModuleLandingPage module="crm" />} />
          <Route path="pos/purchase-manager" element={<PosModuleLandingPage module="purchase-manager" />} />
          <Route path="pos/offline-pos" element={<PosModuleLandingPage module="offline-pos" />} />

          {/* Dedicated Restaurant Formats (Outlet Types) Landing Pages */}
          <Route path="outlet-types/:formatSlug" element={<OutletTypeLandingPage />} />
          <Route path="outlet-types/fine-dining" element={<OutletTypeLandingPage type="fine-dining" />} />
          <Route path="outlet-types/quick-service" element={<OutletTypeLandingPage type="quick-service" />} />
          <Route path="outlet-types/cafes-bakeries" element={<OutletTypeLandingPage type="cafes-bakeries" />} />
          <Route path="outlet-types/cloud-kitchens" element={<OutletTypeLandingPage type="cloud-kitchens" />} />
          <Route path="outlet-types/multi-outlet-chains" element={<OutletTypeLandingPage type="multi-outlet-chains" />} />
        </Route>
        
        {/* Unified Auth Portal for Staff, Admins, and Super Admin */}
        <Route path="/login" element={<StaffAuthPage />} />
        <Route path="/register" element={<StaffAuthPage />} />
        <Route path="/staff/login" element={<Navigate to="/login" replace />} />
        <Route path="/staff/register" element={<Navigate to="/register" replace />} />

        {/* Standalone 3D Interactive Showcase Page */}
        <Route path="/3d-demo" element={<ThreeDemoShowcase />} />
        <Route path="/chai-theory" element={<ChaiTheoryShowcase />} />

        {/* Delivery Staff App */}
        <Route path="/delivery/login" element={<DeliveryPartnerLogin />} />
        <Route path="/delivery/dashboard" element={<ProtectedRoute allowedRoles={['DeliveryPartner']}><DeliveryPartnerDashboard /></ProtectedRoute>} />

        {/* Customer Route Forwarding to Dedicated Customer Website */}
        <Route path="/explore" element={<CustomerRedirect path="/explore" />} />
        <Route path="/menu" element={<CustomerRedirect path="/menu" />} />
        <Route path="/restaurant/:id" element={<CustomerRedirect />} />
        <Route path="/checkout" element={<CustomerRedirect path="/checkout" />} />
        <Route path="/track/:id" element={<CustomerRedirect />} />
        <Route path="/reservations" element={<CustomerRedirect path="/reservations" />} />
        <Route path="/profile" element={<CustomerRedirect path="/profile" />} />
        <Route path="/profile/*" element={<CustomerRedirect />} />
        <Route path="/customer/login" element={<CustomerRedirect path="/login" />} />
        <Route path="/customer/register" element={<CustomerRedirect path="/register" />} />
        <Route path="/customer/menu" element={<CustomerRedirect />} />
        <Route path="/customer/track/:orderId" element={<CustomerRedirect />} />

        {/* Alias for super admin mistypes */}
        <Route path="/superadmin" element={<Navigate to="/super-admin" replace />} />

        {/* Super Admin Routes */}
        <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'SupportAgent']}><SuperAdminLayout /></ProtectedRoute>}>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="inquiries" element={<BillingDemoRequestsManagement defaultTab="leads" />} />
          <Route path="billing-demos" element={<BillingDemoRequestsManagement />} />
          <Route path="restaurants" element={<PlatformRestaurants />} />
          <Route path="free-trials" element={<FreeTrialManagement />} />
          <Route path="plans" element={<PlanManagement />} />
          <Route path="commissions" element={<CommissionManagement />} />
          <Route path="revenue" element={<RevenueAnalytics />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="features" element={<FeatureManagement />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="reports" element={<GlobalReports />} />
          <Route path="notifications" element={<NotificationManagement />} />
          <Route path="verifications" element={<VerificationManagement />} />
          <Route path="testimonials" element={<TestimonialsManagement />} />
          <Route path="support" element={<SuperAdminSupportConsole />} />
          <Route path="support/tickets/:id" element={<TicketDetails />} />
        </Route>

        {/* Admin Dashboard Routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'RestaurantAdmin', 'Admin']}><DashboardLayout /></ProtectedRoute>}>
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
          <Route path="billing-management" element={<BillingManagement />} />
          <Route path="payments" element={<BillingManagement />} />
          <Route path="offers" element={<OfferManagement />} />
          <Route path="taxes" element={<TaxManagement />} />
          
          {/* Insights & Financial Management */}
          <Route path="daily-earnings" element={<DailyEarnings />} />
          <Route path="profit-loss" element={<ProfitAndLoss />} />
          <Route path="reports" element={<Reports />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="expenses" element={<ExpenseSummaryAdmin />} />
          <Route path="bills" element={<Navigate to="/admin/expenses?tab=bills" replace />} />
          <Route path="attendance" element={<Navigate to="/admin/staff?tab=attendance" replace />} />
          <Route path="payroll" element={<Navigate to="/admin/staff?tab=payroll" replace />} />
          <Route path="leaves" element={<Navigate to="/admin/staff?tab=leaves" replace />} />
          <Route path="payroll-reports" element={<Navigate to="/admin/staff?tab=reports" replace />} />
          
          {/* System & Configuration */}
          <Route path="settings" element={<Settings />} />
          <Route path="my-testimonial" element={<MyTestimonial />} />
          <Route path="setup-wizard" element={<RestaurantSetupWizard />} />
          <Route path="tips" element={<TipManagement />} />
          <Route path="billing" element={<SubscriptionPortal />} />
          <Route path="notifications" element={<NotificationCenter />} />

          {/* Enterprise Modules */}
          <Route path="franchise" element={<FranchiseManagement />} />
          <Route path="central-kitchen" element={<CentralKitchen />} />
          <Route path="developer-config" element={<DeveloperConfig />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="bi" element={<BusinessIntelligence />} />

          {/* Customer Care */}
          <Route path="support" element={<Navigate to="/admin/support/customer" replace />} />
          <Route path="support/customer" element={<AdminCustomerCare />} />
          <Route path="support/super-admin" element={<CustomerCareDashboard />} />
          <Route path="support/tickets" element={<TicketList />} />
          <Route path="support/tickets/create" element={<CreateTicket />} />
          <Route path="support/tickets/:id" element={<TicketDetails />} />
          <Route path="support/knowledge-base" element={<SupportKnowledgeBase />} />
          <Route path="support/announcements" element={<SupportAnnouncements />} />
        </Route>
        
        <Route path="/manager" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'BranchManager', 'RestaurantAdmin']}><ManagerLayout /></ProtectedRoute>}>
          <Route index element={<ManagerDashboard />} />
          <Route path="orders" element={<ManagerOrderMonitoring />} />
          <Route path="staff" element={<ManagerStaff />} />
          <Route path="leaves" element={<Navigate to="/manager/staff?tab=leaves" replace />} />
          <Route path="payroll" element={<Navigate to="/manager/staff?tab=payroll" replace />} />
          <Route path="kitchen" element={<ManagerKitchenStatus />} />
          <Route path="inventory" element={<ManagerInventory />} />
          <Route path="tables" element={<TablesManagement />} />
          <Route path="reservations" element={<ManagerReservations />} />
          <Route path="feedback" element={<ManagerFeedback />} />
          <Route path="expenses" element={<ManagerExpenses />} />
          <Route path="sales" element={<ManagerSales />} />
          <Route path="reports" element={<ManagerReports />} />
          <Route path="analytics" element={<ManagerAnalytics />} />
          <Route path="settings" element={<ManagerSettings />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="delivery" element={<DeliveryManagement />} />
          <Route path="billing-management" element={<BillingManagement />} />
        </Route>
        
        {/* Staff Dashboards */}
        <Route path="/waiter" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Waiter', 'RestaurantAdmin', 'BranchManager']}><WaiterLayout /></ProtectedRoute>}>
          <Route index element={<WaiterDashboard />} />
          <Route path="priority-actions" element={<WaiterPriorityActions />} />
          <Route path="floor-plan" element={<WaiterFloorPlan />} />
          <Route path="orders" element={<WaiterActiveOrders />} />
          <Route path="kitchen-tracker" element={<WaiterKitchenTracker />} />
          <Route path="pending" element={<WaiterPendingServes />} />
          <Route path="completed" element={<WaiterCompleted />} />
          <Route path="tasks" element={<WaiterTasks />} />
          <Route path="performance" element={<WaiterPerformance />} />
          <Route path="shift-status" element={<WaiterShiftStatus />} />
          <Route path="leave" element={<StaffMyLeave />} />
          <Route path="payroll" element={<StaffMyPayroll />} />
          <Route path="settings" element={<WaiterSettings />} />
        </Route>
        
        <Route path="/chef" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Chef', 'RestaurantAdmin', 'BranchManager']}><ChefLayout /></ProtectedRoute>}>
          <Route index element={<ChefDashboard />} />
          <Route path="kot" element={<ChefKOTManagement />} />
          <Route path="prep" element={<ChefPrepList />} />
          <Route path="recipes" element={<ChefRecipes />} />
          <Route path="inventory" element={<ChefInventory />} />
          <Route path="leave" element={<StaffMyLeave />} />
          <Route path="payroll" element={<StaffMyPayroll />} />
          {/* Legacy / Alias redirects */}
          <Route path="orders" element={<Navigate to="/chef" replace />} />
          <Route path="menu" element={<Navigate to="/chef" replace />} />
          <Route path="wastage" element={<Navigate to="/chef/inventory" replace />} />
          <Route path="my-shift" element={<Navigate to="/chef" replace />} />
          <Route path="duty-timer" element={<Navigate to="/chef" replace />} />
          <Route path="my-payroll" element={<Navigate to="/chef/payroll" replace />} />
        </Route>
        
        <Route path="/cashier" element={<ProtectedRoute allowedRoles={['SuperAdmin', 'Cashier', 'RestaurantAdmin', 'BranchManager']}><CashierLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/cashier/billing" replace />} />
          <Route path="billing" element={<CashierDashboard />} />
          <Route path="invoices" element={<CashierDashboard />} />
          <Route path="split" element={<CashierDashboard />} />
          <Route path="merge" element={<CashierDashboard />} />
          <Route path="discounts" element={<CashierDashboard />} />
          <Route path="collection" element={<CashierDashboard />} />
          <Route path="refunds" element={<CashierDashboard />} />
          <Route path="summary" element={<CashierDashboard />} />
          <Route path="history" element={<CashierDashboard />} />
          <Route path="leave" element={<StaffMyLeave />} />
          <Route path="payroll" element={<StaffMyPayroll />} />
          <Route path="settings" element={<CashierDashboard />} />
          {/* Legacy / Alias redirects */}
          <Route path="bills" element={<Navigate to="/cashier/invoices" replace />} />
          <Route path="split-bill" element={<Navigate to="/cashier/split" replace />} />
          <Route path="shift-register" element={<Navigate to="/cashier/summary" replace />} />
          <Route path="table-status" element={<Navigate to="/cashier/billing" replace />} />
          <Route path="transfer-table" element={<Navigate to="/cashier/billing" replace />} />
          <Route path="coupons" element={<Navigate to="/cashier/discounts" replace />} />
          <Route path="my-shift" element={<Navigate to="/cashier/billing" replace />} />
          <Route path="duty-timer" element={<Navigate to="/cashier/billing" replace />} />
          <Route path="my-payroll" element={<Navigate to="/cashier/payroll" replace />} />
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
      </Suspense>
    </>
  );
}

export default App;
