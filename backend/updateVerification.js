import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Restaurant from './models/Restaurant.js';

dotenv.config();

const updateDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const result = await Restaurant.updateMany(
            {}, 
            { $set: { verificationStatus: 'Verified', approvalStatus: 'Approved' } }
        );
        console.log(`Updated ${result.modifiedCount} restaurant(s) to Verified/Approved.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

updateDB();
