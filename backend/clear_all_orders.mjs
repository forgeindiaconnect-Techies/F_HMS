import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ruthralekhaantigraviity_db_user:bPtyhG4yQzSPcGgR@cluster0.3vd0qmf.mongodb.net/?appName=Cluster0";

async function clearOrders() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        
        const countBefore = await db.collection('orders').countDocuments();
        console.log(`Current orders in database: ${countBefore}`);
        
        const result = await db.collection('orders').deleteMany({});
        console.log(`Successfully deleted ${result.deletedCount} orders from database.`);
        
    } catch (error) {
        console.error("Error clearing orders:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

clearOrders();
