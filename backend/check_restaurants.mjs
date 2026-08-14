import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant';
    console.log('Connecting to URI:', mongoUri);
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db = client.db();
        
        const restaurants = await db.collection('restaurants').find({}).toArray();
        
        console.log(`Found ${restaurants.length} restaurants:`);
        restaurants.forEach(r => {
            console.log(`- ID: ${r._id}, Name: "${r.name}", Logo: "${r.logo}", Img: "${r.img}", Active: ${r.isActive}`);
        });
    } finally {
        await client.close();
    }
}
main().catch(console.error);
