import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const fallbackUri = 'mongodb+srv://ruthralekhaantigraviity_db_user:bPtyhG4yQzSPcGgR@cluster0.3vd0qmf.mongodb.net/?appName=Cluster0';
        const conn = await mongoose.connect(process.env.MONGO_URI || fallbackUri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
