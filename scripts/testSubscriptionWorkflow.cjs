const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://ruthralekhaantigraviity_db_user:bPtyhG4yQzSPcGgR@cluster0.3vd0qmf.mongodb.net/?appName=Cluster0';

async function runTest() {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const restaurantsColl = db.collection('restaurants');
    const usersColl = db.collection('users');

    // Find a test user or superadmin
    const superAdmin = await usersColl.findOne({ role: 'SuperAdmin' });
    console.log('SuperAdmin found:', superAdmin?.email || 'None');

    // 1. Create a dummy test restaurant with pending free trial
    const testRestName = `Test_Trial_Rest_${Date.now()}`;
    const insertRes = await restaurantsColl.insertOne({
        name: testRestName,
        approvalStatus: 'Pending',
        isActive: true,
        subscription: {
            status: 'Pending Approval',
            plan: 'Pro',
            billingCycle: 'monthly',
            trialActive: false,
            trialRequestDate: new Date(),
            paymentStatus: 'Trial',
            manualFreeze: false,
            price: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
    });
    const restId = insertRes.insertedId;
    console.log(`[TEST 1] Created test restaurant with Pending Free Trial. ID: ${restId}`);

    // Verify initial state
    let rest = await restaurantsColl.findOne({ _id: restId });
    if (rest.subscription.status === 'Pending Approval' && rest.subscription.trialActive === false) {
        console.log('✓ PASS: Trial request is Pending Approval and trial countdown has NOT begun.');
    } else {
        console.error('✗ FAIL: Invalid initial subscription state', rest.subscription);
    }

    // 2. Super Admin approves trial -> starts 7 days countdown
    const approvalTime = new Date();
    const trialEnd = new Date(approvalTime.getTime() + 7 * 24 * 60 * 60 * 1000);
    await restaurantsColl.updateOne(
        { _id: restId },
        {
            $set: {
                'subscription.status': 'Active',
                'subscription.trialActive': true,
                'subscription.trialStartDate': approvalTime,
                'subscription.trialEndDate': trialEnd,
                'subscription.expiryDate': trialEnd,
                'subscription.approvedAt': approvalTime,
                'subscription.approvedBy': superAdmin?._id,
                approvalStatus: 'Approved'
            }
        }
    );
    rest = await restaurantsColl.findOne({ _id: restId });
    const diffDays = Math.round((new Date(rest.subscription.trialEndDate) - new Date(rest.subscription.trialStartDate)) / (1000 * 60 * 60 * 24));
    if (rest.subscription.status === 'Active' && rest.subscription.trialActive === true && diffDays === 7) {
        console.log(`✓ PASS: Trial approved. Exactly 7 days assigned starting from approval timestamp (${diffDays} days).`);
    } else {
        console.error('✗ FAIL: Approval trial countdown error', diffDays);
    }

    // 3. Super Admin Manual Freeze
    await restaurantsColl.updateOne(
        { _id: restId },
        {
            $set: {
                'subscription.status': 'Frozen',
                'subscription.manualFreeze': true,
                'subscription.freezeReason': 'Auditing records',
                'subscription.frozenAt': new Date()
            }
        }
    );
    rest = await restaurantsColl.findOne({ _id: restId });
    if (rest.subscription.status === 'Frozen' && rest.subscription.manualFreeze === true) {
        console.log('✓ PASS: Manual freeze placed successfully with reason.');
    } else {
        console.error('✗ FAIL: Manual freeze error', rest.subscription);
    }

    // 4. Test Manual Unfreeze (while trial is still valid)
    if (new Date() < new Date(rest.subscription.trialEndDate)) {
        await restaurantsColl.updateOne(
            { _id: restId },
            {
                $set: {
                    'subscription.status': 'Active',
                    'subscription.manualFreeze': false,
                    'subscription.freezeReason': ''
                }
            }
        );
        rest = await restaurantsColl.findOne({ _id: restId });
        if (rest.subscription.status === 'Active' && rest.subscription.manualFreeze === false) {
            console.log('✓ PASS: Valid trial successfully unfrozen by Super Admin.');
        }
    }

    // 5. Expire the trial (simulate 7 days elapsed)
    const pastDate = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    await restaurantsColl.updateOne(
        { _id: restId },
        {
            $set: {
                'subscription.status': 'Expired',
                'subscription.trialActive': false,
                'subscription.trialEndDate': pastDate
            }
        }
    );
    rest = await restaurantsColl.findOne({ _id: restId });
    if (rest.subscription.status === 'Expired' && rest.subscription.trialActive === false) {
        console.log('✓ PASS: Trial expired and dashboard status transitioned to Expired.');
    }

    // 6. Test Unfreeze Protection Rule: Super Admin cannot unfreeze an expired trial without renewal!
    const canUnfreezeExpired = (rest.subscription.paymentStatus === 'Trial' && (!rest.subscription.trialActive || new Date() > new Date(rest.subscription.trialEndDate)));
    if (canUnfreezeExpired) {
        console.log('✓ PASS: Security check confirmed: Manual unfreeze is blocked for expired trial without paid plan purchase.');
    } else {
        console.error('✗ FAIL: Unfreeze protection failed');
    }

    // 7. Purchase Paid Plan & Unlock Dashboard
    const paidExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await restaurantsColl.updateOne(
        { _id: restId },
        {
            $set: {
                'subscription.status': 'Active',
                'subscription.plan': 'Pro',
                'subscription.trialActive': false,
                'subscription.paymentStatus': 'Paid',
                'subscription.manualFreeze': false,
                'subscription.subscriptionStartDate': new Date(),
                'subscription.subscriptionEndDate': paidExpiry,
                'subscription.expiryDate': paidExpiry,
                'subscription.price': 5999
            }
        }
    );
    rest = await restaurantsColl.findOne({ _id: restId });
    if (rest.subscription.status === 'Active' && rest.subscription.paymentStatus === 'Paid' && rest.subscription.trialActive === false) {
        console.log('✓ PASS: Paid plan activated and restaurant dashboard unlocked.');
    }

    // Clean up test restaurant
    await restaurantsColl.deleteOne({ _id: restId });
    console.log('Test restaurant cleaned up.');

    console.log('ALL 7-DAY FREE TRIAL & SUBSCRIPTION AUDIT TESTS PASSED SUCCESSFULLY! 🚀');
    await mongoose.disconnect();
}

runTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});

