import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant';
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db();
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`Collection: ${col.name} (${count} docs)`);
            if (col.name.toLowerCase().includes('menu') || col.name.toLowerCase().includes('item') || col.name.toLowerCase().includes('food')) {
                const sample = await db.collection(col.name).find({}).limit(10).toArray();
                sample.forEach(s => console.log(`  Doc: name="${s.name}", image="${s.image || s.img}"`));
            }
        }
    } finally {
        await client.close();
    }
}
main().catch(console.error);
