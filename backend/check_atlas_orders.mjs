import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ruthralekhaantigraviity_db_user:bPtyhG4yQzSPcGgR@cluster0.3vd0qmf.mongodb.net/?appName=Cluster0";

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const admin = mongoose.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases in cluster:', dbs.databases.map(d => d.name));

        for (const dbInfo of dbs.databases) {
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;
            const useDb = mongoose.connection.client.db(dbInfo.name);
            const cols = await useDb.listCollections().toArray();
            console.log(`\nDB: ${dbInfo.name}`);
            for (const c of cols) {
                const count = await useDb.collection(c.name).countDocuments();
                if (count > 0) {
                    console.log(`  - ${c.name}: ${count} docs`);
                }
            }
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

check();
