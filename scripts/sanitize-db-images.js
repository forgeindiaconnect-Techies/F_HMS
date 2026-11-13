import mongoose from 'mongoose';

const uri = 'mongodb+srv://ruthralekhaantigraviity_db_user:bPtyhG4yQzSPcGgR@cluster0.3vd0qmf.mongodb.net/test?appName=Cluster0';

async function sanitize() {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected! Querying restaurants IDs...');
    const db = conn.connection.db;

    const cursor = db.collection('restaurants').find({}, { projection: { _id: 1, name: 1 } });
    const list = await cursor.toArray();
    console.log(`Found ${list.length} restaurants:`, list.map(x => x.name));

    for (const r of list) {
        console.log(`Checking restaurant ${r.name} (${r._id})...`);
        const fullDoc = await db.collection('restaurants').findOne({ _id: r._id }, { projection: { logo: 1, bannerImage: 1, showcaseImages: 1 } });
        const updateFields = {};
        let needsUpdate = false;

        if (fullDoc.logo && typeof fullDoc.logo === 'string' && fullDoc.logo.length > 5000) {
            updateFields.logo = '';
            needsUpdate = true;
        }
        if (fullDoc.bannerImage && typeof fullDoc.bannerImage === 'string' && fullDoc.bannerImage.length > 5000) {
            updateFields.bannerImage = '';
            needsUpdate = true;
        }
        if (Array.isArray(fullDoc.showcaseImages)) {
            const clean = fullDoc.showcaseImages.filter(img => typeof img === 'string' && img.length <= 5000);
            if (clean.length !== fullDoc.showcaseImages.length) {
                updateFields.showcaseImages = clean;
                needsUpdate = true;
            }
        }

        if (needsUpdate) {
            await db.collection('restaurants').updateOne({ _id: r._id }, { $set: updateFields });
            console.log(`Sanitized images for: ${r.name}`);
        } else {
            console.log(`No large images to sanitize for: ${r.name}`);
        }
    }

    console.log('Finished sanitization.');
    await mongoose.disconnect();
    process.exit(0);
}

sanitize().catch(err => {
    console.error('Sanitize error:', err.message);
    process.exit(1);
});
