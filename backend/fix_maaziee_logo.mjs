import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant';
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db();
        
        // Find Maaziee restaurants and update logo to valid file
        const validLogo = '/uploads/verification/logo-1784806465544-277829645.png';
        const res = await db.collection('restaurants').updateMany(
            { name: { $regex: /maaziee/i } },
            { $set: { logo: validLogo, img: validLogo, isActive: true } }
        );
        console.log(`Updated ${res.modifiedCount} Maaziee restaurant logo(s) to ${validLogo}`);
    } finally {
        await client.close();
    }
}
main().catch(console.error);
