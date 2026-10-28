import express from 'express';
import { 
    getStaff, 
    createStaff, 
    deleteStaff, 
    updateStaff,
    bulkMarkAttendance,
    getAttendance,
    correctAttendance,
    getAttendanceSummary,
    calculatePayroll,
    generatePayroll,
    getPayrollRecords,
    getPayrollById,
    recordPayrollPayment,
    getEmployeeSalaryHistory,
    applyLeave,
    getMyLeaves,
    cancelMyLeave,
    getLeaveRequests,
    updateLeaveStatus,
    getMyPayroll,
    getMyPayrollSlip,
    correctPayrollRecord,
    getPayrollReports,
    getPayrollConfig,
    updatePayrollConfig
} from '../controllers/staffController.js';
import { protect, authorize, checkSubscription, checkBillingModule } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(checkSubscription);
router.use(checkBillingModule('staffManagement'));

// ── Attendance Routes ────────────────────────────────────────────────────────
router.post('/attendance/bulk', authorize('RestaurantAdmin', 'BranchManager'), bulkMarkAttendance);
router.get('/attendance', authorize('RestaurantAdmin', 'BranchManager'), getAttendance);
router.put('/attendance/:id/correct', authorize('RestaurantAdmin', 'BranchManager'), correctAttendance);
router.get('/attendance/summary', authorize('RestaurantAdmin', 'BranchManager'), getAttendanceSummary);

// ── Leave Management Routes ──────────────────────────────────────────────────
// Staff personal leave endpoints (Any authenticated staff)
router.post('/leave', applyLeave);
router.get('/leave/my', getMyLeaves);
router.put('/leave/:id/cancel', cancelMyLeave);

// Manager / Admin leave review & approval endpoints
router.get('/leave', authorize('RestaurantAdmin', 'BranchManager'), getLeaveRequests);
router.put('/leave/:id/status', authorize('RestaurantAdmin', 'BranchManager'), updateLeaveStatus);

// ── Payroll Routes ───────────────────────────────────────────────────────────
// Staff personal payroll endpoints (Staff can only view their own)
router.get('/payroll/my', getMyPayroll);
router.get('/payroll/my/:id/slip', getMyPayrollSlip);

// Admin & Manager payroll calculation & management endpoints
router.post('/payroll/calculate', authorize('RestaurantAdmin', 'BranchManager'), calculatePayroll);
router.post('/payroll/generate', authorize('RestaurantAdmin'), generatePayroll);
router.get('/payroll/reports', authorize('RestaurantAdmin', 'BranchManager'), getPayrollReports);
router.get('/payroll/config', authorize('RestaurantAdmin', 'BranchManager'), getPayrollConfig);
router.put('/payroll/config', authorize('RestaurantAdmin'), updatePayrollConfig);
router.get('/payroll', authorize('RestaurantAdmin', 'BranchManager'), getPayrollRecords);
router.get('/payroll/:id', authorize('RestaurantAdmin', 'BranchManager'), getPayrollById);
router.put('/payroll/:id/correct', authorize('RestaurantAdmin', 'BranchManager'), correctPayrollRecord);
router.post('/payroll/:id/pay', authorize('RestaurantAdmin'), recordPayrollPayment);
router.get('/payroll/employee/:id/history', authorize('RestaurantAdmin', 'BranchManager'), getEmployeeSalaryHistory);

// ── Staff Profile Routes ─────────────────────────────────────────────────────
router.route('/')
    .get(authorize('RestaurantAdmin', 'BranchManager'), getStaff)
    .post(authorize('RestaurantAdmin'), createStaff);

router.route('/:id')
    .put(authorize('RestaurantAdmin'), updateStaff)
    .delete(authorize('RestaurantAdmin'), deleteStaff);

export default router;
