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
        
        console.log('Default system roles initialized!');

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

importData();
