import mongoose from 'mongoose';

let cachedPromise = null;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    if (cachedPromise) {
        return cachedPromise;
    }

    const fallbackUri = 'mongodb+srv://ruthralekhaantigraviity_db_user:bPtyhG4yQzSPcGgR@cluster0.3vd0qmf.mongodb.net/?appName=Cluster0';
    const uri = process.env.MONGO_URI || fallbackUri;

    cachedPromise = (async () => {
        let retries = process.env.VERCEL ? 2 : 5;
        while (retries > 0) {
            try {
                const conn = await mongoose.connect(uri, {
                    serverSelectionTimeoutMS: 5000,
                    connectTimeoutMS: 10000,
                });
                console.log(`MongoDB Connected: ${conn.connection.host}`);
                return conn.connection;
            } catch (error) {
                console.error(`MongoDB Connection Error: ${error.message}. Retrying in 1s... (${retries} left)`);
                retries -= 1;
                if (retries > 0) {
                    await new Promise(res => setTimeout(res, 1000));
                }
            }
        }
        cachedPromise = null;
        console.error('Failed to connect to MongoDB after multiple retries.');
        return null;
    })();

    return cachedPromise;
};

export default connectDB;
