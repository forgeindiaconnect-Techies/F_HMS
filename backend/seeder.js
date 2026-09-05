import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

// Minimal Mock Role Schema since it's missing
const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});
const Role = mongoose.models.Role || mongoose.model('Role', roleSchema);

import DeliveryPartner from './models/DeliveryPartner.js';
import Restaurant from './models/Restaurant.js';

dotenv.config();

const importData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Role.deleteMany();
        await DeliveryPartner.deleteMany();
        await Restaurant.deleteMany();

        console.log('Data cleared!');

        // Create Roles
        const roles = await Role.insertMany([
            { name: 'Admin' },
            { name: 'Manager' },
            { name: 'Chef' },
            { name: 'Waiter' },
            { name: 'Cashier' },
            { name: 'Customer' },
            { name: 'DeliveryPartner' }
        ]);
        
        console.log('Roles seeded!');

        // Create Admin User
        const adminUser = await User.create({
            name: 'Super Admin',
            email: 'admin@restosys.com',
            password: 'password123',
            role: 'SuperAdmin'
        });

        // Create Demo Restaurant
        const restaurant = await Restaurant.create({
            name: 'RestoSys Demo Kitchen',
            phone: '9876543210',
            address: '123 Main Street, Tech City',
            ownerId: adminUser._id,
            approvalStatus: 'Approved',
            verificationStatus: 'Verified',
            subscription: { status: 'Active', plan: 'Pro' },
            deliverySettings: { enabled: true }
        });

        // Import Branch & Seed Branch
        const Branch = (await import('./models/Branch.js')).default;
        await Branch.deleteMany();
        const branch = await Branch.create({
            name: 'Main Branch',
            restaurantId: restaurant._id,
            location: { address: '123 Main Street, Tech City' }
        });

        // Create Demo Delivery Partner User
        const deliveryUser = await User.create({
            name: 'Demo Delivery Agent',
            email: 'delivery@restosys.com',
            phoneNumber: '9876543210',
            password: 'password123',
            role: 'DeliveryPartner',
            restaurantId: restaurant._id
        });

        // Create Demo Customer User
        await User.create({
            name: 'John Customer',
            email: 'customer@restosys.com',
            phoneNumber: '9999988888',
            password: 'password123',
            role: 'Customer'
        });

        // Create Delivery Partner Profile
        await DeliveryPartner.create({
            userId: deliveryUser._id,
            restaurantId: restaurant._id,
            verificationStatus: 'Approved',
            status: 'Online',
            vehicleDetails: {
                type: 'Bike',
                model: 'Hero Splendor',
                rcNumber: 'KA-01-AB-1234',
                licenseNumber: 'DL-987654321'
            }
        });

        console.log('Admin user seeded! (Email: admin@restosys.com, Password: password123)');
        console.log('Delivery partner seeded! (Phone: 9876543210, OTP: 1234)');
        console.log('Customer user seeded! (Phone: 9999988888 / Email: customer@restosys.com, Password: password123)');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
