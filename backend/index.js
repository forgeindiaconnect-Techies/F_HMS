import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import http from 'http';
import { initWebSocket } from './config/websocket.js';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Comprehensive Universal CORS setup
app.use((req, res, next) => {
    const origin = req.headers.origin || 'https://f-hms.vercel.app';
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import taxRoutes from './routes/taxRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import planRoutes from './routes/planRoutes.js';
import serviceRequestRoutes from './routes/serviceRequestRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';
import Plan from './models/Plan.js';



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/expenses', expenseRoutes);

import path from 'path';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Serve frontend in production if dist directory exists
if (process.env.NODE_ENV === 'production') {
    const frontendDistPath = path.join(__dirname, '../frontend/dist');
    if (fs.existsSync(frontendDistPath)) {
        app.use(express.static(frontendDistPath));
        app.get('*', (req, res, next) => {
            if (req.originalUrl.startsWith('/api')) return next();
            res.sendFile(path.resolve(frontendDistPath, 'index.html'));
        });
    } else {
        app.get('/', (req, res) => {
            res.status(200).json({ status: 'ok', message: 'Restaurant SaaS API is running live' });
        });
    }
} else {
    // Basic route for development
    app.get('/', (req, res) => {
        res.send('API is running...');
    });
}

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initWebSocket(server);

server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    // Auto-seed default plans if none exist
    try {
        const count = await Plan.countDocuments();
        if (count === 0) {
            await Plan.insertMany([
                { name: 'Starter', monthlyPrice: 2999, yearlyPrice: 2399, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'], isActive: true },
                { name: 'Professional', monthlyPrice: 5999, yearlyPrice: 4799, features: ['Up to 3 Branches', 'Kitchen Display System', 'Online Ordering', 'Advanced Analytics', 'Priority Support'], isActive: true },
                { name: 'Enterprise', monthlyPrice: 12999, yearlyPrice: 10399, features: ['Unlimited Branches', 'Custom APIs & Webhooks', 'Dedicated Account Manager', 'SLA Guarantee', 'White-label Branding'], isActive: true }
            ]);
            console.log('Default subscription plans seeded.');
        }
    } catch (e) {
        console.error('Error seeding plans:', e.message);
    }
});
