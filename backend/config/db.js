import mongoose from 'mongoose';

const connectDB = async () => {
    const fallbackUri = 'mongodb+srv://ruthralekhaantigraviity_db_user:bPtyhG4yQzSPcGgR@cluster0.3vd0qmf.mongodb.net/?appName=Cluster0';
    const uri = process.env.MONGO_URI || fallbackUri;

    let retries = 5;
    while (retries > 0) {
        try {
            const conn = await mongoose.connect(uri);
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            return;
        } catch (error) {
            console.error(`MongoDB Connection Error: ${error.message}. Retrying in 3s... (${retries} left)`);
            retries -= 1;
            await new Promise(res => setTimeout(res, 3000));
        }
    }
    console.error('Failed to connect to MongoDB after multiple retries.');
};

export default connectDB;
