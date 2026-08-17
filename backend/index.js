import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import connectDB from './config/db.js';
import http from 'http';
import { initWebSocket } from './config/websocket.js';

// Load env vars
dotenv.config();

const app = express();

// Comprehensive Universal CORS setup
const allowedOrigins = [
    'https://f-hms.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000'
];

if (process.env.FRONTEND_URL) {
    const customFrontend = process.env.FRONTEND_URL.startsWith('http')
        ? process.env.FRONTEND_URL
        : `https://${process.env.FRONTEND_URL}`;
    if (!allowedOrigins.includes(customFrontend)) {
        allowedOrigins.push(customFrontend);
    }
}

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production' || origin.endsWith('.vercel.app')) {
            return callback(null, origin);
        }
        return callback(null, origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers']
}));

// app.use(cors(...)) handles OPTIONS requests automatically

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


app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Restaurant SaaS API is running live' });
});

// Serve frontend dist fallback ONLY if non-API route and dist exists
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get(/(.*)/, (req, res, next) => {
        if (req.originalUrl.startsWith('/api')) return next();
        res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });
}

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initWebSocket(server);

// Bind port immediately on process start so Render detects open port instantly
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    
    // Connect to MongoDB Atlas asynchronously in background
    connectDB().then(async () => {
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
    }).catch(err => {
        console.error('MongoDB Atlas connection error on startup:', err.message);
    });
});
