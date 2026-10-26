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
    getEmployeeSalaryHistory
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

// ── Payroll Routes ───────────────────────────────────────────────────────────
router.post('/payroll/calculate', authorize('RestaurantAdmin', 'BranchManager'), calculatePayroll);
router.post('/payroll/generate', authorize('RestaurantAdmin'), generatePayroll);
router.get('/payroll', authorize('RestaurantAdmin', 'BranchManager'), getPayrollRecords);
router.get('/payroll/:id', authorize('RestaurantAdmin', 'BranchManager'), getPayrollById);
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
