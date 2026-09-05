import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Restaurant from './models/Restaurant.js';
import Branch from './models/Branch.js';
import MenuItem from './models/MenuItem.js';
import Order from './models/Order.js';
import Table from './models/Table.js';
import Plan from './models/Plan.js';
import RestaurantVerification from './models/RestaurantVerification.js';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const importData = async () => {
    try {
        await connectDB();

        console.log('Clearing old data...');
        await User.deleteMany();
        await Restaurant.deleteMany();
        await Branch.deleteMany();
        await MenuItem.deleteMany();
        await Order.deleteMany();
        await Table.deleteMany();
        await Plan.deleteMany();
        await RestaurantVerification.deleteMany();

        console.log('Creating SaaS Plans...');
        await Plan.insertMany([
            {
                name: 'Basic',
                monthlyPrice: 49,
                yearlyPrice: 390,
                branchesLimit: 1,
                staffLimit: 5,
                features: [
                    'Restaurant Management',
                    'Menu Management',
                    'QR Digital Menu',
                    'Order Management',
                    'Sales Reports',
                    'Upgrade/Downgrade',
                    'Billing History',
                    'Payment History',
                    'Renewal',
                    'Feature Access'
                ],
                isActive: true
            },
            {
                name: 'Pro',
                monthlyPrice: 129,
                yearlyPrice: 990,
                branchesLimit: 3,
                staffLimit: 9999,
                features: [
                    'Restaurant Management',
                    'Menu Management',
                    'QR Digital Menu',
                    'Order Management',
                    'Sales Reports',
                    'Upgrade/Downgrade',
                    'Billing History',
                    'Payment History',
                    'Renewal',
                    'Feature Access',
                    'Multi-Branch Management',
                    'Advanced Staff Management',
                    'Delivery Partner Management',
                    'Advanced Order Analytics',
                    'Advanced Table Management',
                    'Raw Materials',
                    'Stock Levels',
                    'Low Stock Alerts',
                    'Expiry Tracking',
                    'Purchase Orders',
                    'Vendor Management',
                    'Stock Transfer',
                    'Waste Management',
                    'Profit & Loss',
                    'Inventory Reports',
                    'Staff Performance',
                    'Customer Analytics',
                    'Order Analytics',
                    'Tax Reports',
                    'PDF Export',
                    'Excel Export',
                    'Advanced Customer Analytics',
                    'Customer Segmentation',
                    'Customer Complaints',
                    'Refund Requests',
                    'Ticket History'
                ],
                isActive: true
            },
            {
                name: 'Enterprise',
                monthlyPrice: 299,
                yearlyPrice: 2490,
                branchesLimit: 9999,
                staffLimit: 9999,
                features: [
                    'Restaurant Management',
                    'Menu Management',
                    'QR Digital Menu',
                    'Order Management',
                    'Sales Reports',
                    'Upgrade/Downgrade',
                    'Billing History',
                    'Payment History',
                    'Renewal',
                    'Feature Access',
                    'Multi-Branch Management',
                    'Advanced Staff Management',
                    'Delivery Partner Management',
                    'Advanced Order Analytics',
                    'Advanced Table Management',
                    'Raw Materials',
                    'Stock Levels',
                    'Low Stock Alerts',
                    'Expiry Tracking',
                    'Purchase Orders',
                    'Vendor Management',
                    'Stock Transfer',
                    'Waste Management',
                    'Profit & Loss',
                    'Inventory Reports',
                    'Staff Performance',
                    'Customer Analytics',
                    'Order Analytics',
                    'Tax Reports',
                    'PDF Export',
                    'Excel Export',
                    'Advanced Customer Analytics',
                    'Customer Segmentation',
                    'Customer Complaints',
                    'Refund Requests',
                    'Ticket History',
                    'Advanced AI Insights',
                    'Sales Prediction',
                    'Inventory Forecast',
                    'Demand Forecast',
                    'Menu Recommendations',
                    'Business Health Score',
                    'Live Chat / Priority Support'
                ],
                isActive: true
            }
        ]);

        console.log('Creating Super Admin...');
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'admin@restauranthub.com',
            password: 'password123',
            role: 'SuperAdmin'
        });

        console.log('Creating Restaurant Owner...');
        const owner = await User.create({
            name: 'John Owner',
            email: 'owner@pizzapalace.com',
            password: 'password123',
            role: 'RestaurantAdmin'
        });

        console.log('Creating Restaurant...');
        const restaurant = await Restaurant.create({
            name: 'Pizza Palace',
            logo: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=200&auto=format&fit=crop',
            ownerId: owner._id,
            verificationStatus: 'Verified',
            approvalStatus: 'Approved',
            subscription: {
                plan: 'Pro',
                status: 'Active',
                expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            }
        });

        // Link owner to restaurant
        owner.restaurantId = restaurant._id;
        await owner.save();

        console.log('Creating Branches...');
        const branch1 = await Branch.create({
            restaurantId: restaurant._id,
            name: 'Downtown Branch',
            address: '123 Main St, Downtown',
            contactNumber: '555-0100'
        });

        const branch2 = await Branch.create({
            restaurantId: restaurant._id,
            name: 'Uptown Branch',
            address: '456 High St, Uptown',
            contactNumber: '555-0200'
        });

        console.log('Creating Branch Staff...');
        const staffRoles = ['BranchManager', 'Chef', 'Waiter', 'Cashier'];
        
        for (const role of staffRoles) {
            // Branch 1 Staff
            await User.create({
                name: `Downtown ${role}`,
                email: `${role.toLowerCase()}1@pizzapalace.com`,
                password: 'password123',
                role: role,
                restaurantId: restaurant._id,
                branchId: branch1._id
            });
            // Branch 2 Staff
            await User.create({
                name: `Uptown ${role}`,
                email: `${role.toLowerCase()}2@pizzapalace.com`,
                password: 'password123',
                role: role,
                restaurantId: restaurant._id,
                branchId: branch2._id
            });
        }

        console.log('Creating Customers...');
        const customer = await User.create({
            name: 'Jane Customer',
            email: 'customer@example.com',
            password: 'password123',
            role: 'Customer'
        });

        console.log('Creating Menu Items (Global to Restaurant)...');
        const menuItems = await MenuItem.insertMany([
            {
                name: 'Margherita Pizza',
                description: 'Classic cheese and tomato',
                price: 15,
                category: 'Pizza',
                restaurantId: restaurant._id,
                image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop'
            },
            {
                name: 'Pepperoni Pizza',
                description: 'Spicy pepperoni',
                price: 18,
                category: 'Pizza',
                restaurantId: restaurant._id,
                image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop'
            }
        ]);

        console.log('Creating Tables for Branch 1...');
        const tables = [];
        for (let i = 1; i <= 10; i++) {
            tables.push({
                restaurantId: restaurant._id,
                branchId: branch1._id,
                tableNumber: i,
                capacity: 4
            });
        }
        await Table.insertMany(tables);

        console.log('Creating sample orders...');
        await Order.create([
            {
                user: customer._id,
                restaurantId: restaurant._id,
                branchId: branch1._id,
                source: 'Walk-in',
                orderType: 'Dine In',
                tableNumber: '1',
                orderItems: [
                    { name: menuItems[0].name, qty: 1, image: menuItems[0].image, price: menuItems[0].price, product: menuItems[0]._id }
                ],
                totalPrice: 15,
                status: 'Pending'
            },
            {
                user: customer._id,
                restaurantId: restaurant._id,
                branchId: branch1._id,
                source: 'Self-Pickup',
                orderType: 'Self-Pickup',
                orderItems: [
                    { name: menuItems[1].name, qty: 2, image: menuItems[1].image, price: menuItems[1].price, product: menuItems[1]._id }
                ],
                totalPrice: 36,
                status: 'Ready',
                isPaid: true
            }
        ]);

        console.log('Data Imported successfully!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();
