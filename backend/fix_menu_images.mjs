import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant';
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db();
        
        // Update Garlic Bread image
        await db.collection('menuitems').updateOne(
            { name: { $regex: /garlic bread/i } },
            { $set: { image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?q=80&w=800&auto=format&fit=crop' } }
        );

        // Update Dosa image
        await db.collection('menuitems').updateOne(
            { name: { $regex: /dosa/i } },
            { $set: { image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=800&auto=format&fit=crop' } }
        );

        console.log('Successfully updated Garlic Bread and Dosa image URLs in MongoDB!');
    } finally {
        await client.close();
    }
}
main().catch(console.error);
