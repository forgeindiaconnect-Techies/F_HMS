import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant';
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db();
        const items = await db.collection('menus').find({}).toArray();
        console.log(`Found ${items.length} menu items:`);
        items.forEach(item => {
            console.log(`- ID: ${item._id}, Name: "${item.name}", Image: "${item.image || item.img}"`);
        });
    } finally {
        await client.close();
    }
}
main().catch(console.error);
