import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';
import SupportAgent from './models/SupportAgent.js';
import KnowledgeBase from './models/KnowledgeBase.js';
import SupportAnnouncement from './models/SupportAnnouncement.js';

dotenv.config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restosys');
        console.log(`MongoDB Connected for support seeder: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedSupportData = async () => {
    try {
        await connectDB();

        console.log('Cleaning old support collections...');
        await SupportAgent.deleteMany();
        await KnowledgeBase.deleteMany();
        await SupportAnnouncement.deleteMany();

        // 1. Upgrade Pizza Palace subscription to Enterprise
        console.log('Upgrading Pizza Palace subscription to Enterprise...');
        const pizzaPalace = await Restaurant.findOne({ name: 'Pizza Palace' });
        if (pizzaPalace) {
            pizzaPalace.subscription.plan = 'Enterprise';
            pizzaPalace.subscription.status = 'Active';
            await pizzaPalace.save();
            console.log('Pizza Palace upgraded to Enterprise.');
        } else {
            console.log('Pizza Palace restaurant not found. Standard SaaS seeding should run first.');
        }

        // 2. Create Support Agent user and add to SupportAgent collection
        console.log('Creating Support Agent user...');
        let agentUser = await User.findOne({ email: 'agent@restauranthub.com' });
        if (!agentUser) {
            agentUser = await User.create({
                name: 'Support Agent',
                email: 'agent@restauranthub.com',
                password: 'password123',
                role: 'SupportAgent'
            });
        } else {
            agentUser.role = 'SupportAgent';
            await agentUser.save();
        }

        await SupportAgent.create({
            userId: agentUser._id,
            isActive: true,
            workload: 0,
            totalResolved: 0
        });
        console.log('Support Agent created and activated.');

        // 3. Promote Super Admin as backup Support Agent
        const superAdmin = await User.findOne({ role: 'SuperAdmin' });
        if (superAdmin) {
            await SupportAgent.create({
                userId: superAdmin._id,
                isActive: true,
                workload: 0,
                totalResolved: 0
            });
            console.log('Super Admin registered as backup Support Agent.');
        }

        // 4. Seed Knowledge Base articles
        console.log('Seeding Knowledge Base articles...');
        await KnowledgeBase.insertMany([
            {
                title: 'Getting Started with RestoSys POS Printer Setup',
                content: `To set up your thermal receipt printer:
1. Connect the printer to your local network via Ethernet or Wi-Fi.
2. Go to Settings > Printer Configuration in your RestoSys dashboard.
3. Click "Scan Devices" to auto-discover local network printers.
4. Select your thermal printer model, enter its IP address (e.g. 192.168.1.100).
5. Click "Print Test Page" to verify.
6. Toggle "Auto-Print POS Billing Receipts" to true.`,
                category: 'POS'
            },
            {
                title: 'Setting Up Tables and Digital QR Menus',
                content: `RestoSys allows automatic contactless dining ordering using QR codes:
1. Navigate to Organization > Tables.
2. Click "Add Table", enter table number and capacity.
3. A unique QR code is automatically generated.
4. Click the download or print icon to print the QR standee.
5. Place the QR standee on the physical table.
6. Customers scan the QR, access the digital menu, choose items, and place orders directly.
7. Orders appear immediately on the Kitchen Display System (KDS) and POS billing panel.`,
                category: 'QR Digital Menu'
            },
            {
                title: 'How to Manage and Sync Multiple Branches',
                content: `For multi-location restaurants, RestoSys manages branches centrally:
1. Head to Organization > Branches.
2. Click "Add Branch" and enter details.
3. Centrally manage menu items, pricing tiers, and inventories.
4. Assign branch-specific roles like BranchManager, Chef, and Waiter.
5. Analytics can be viewed globally or filtered down to individual branches.`,
                category: 'Getting Started'
            },
            {
                title: 'Troubleshooting Kitchen Display System (KDS) Latency',
                content: `If orders are delayed in showing up on the Chef's iPad/screen:
1. Confirm the chef's device has a stable internet connection.
2. RestoSys uses WebSockets for real-time KDS updates. Verify that ports 5000 and 80 are not blocked by your local router's firewall.
3. Try reloading the KDS interface by clicking the "Sync Queue" button in the upper right.
4. If issues persist, check system notifications or announcements for any active platform outages.`,
                category: 'Troubleshooting'
            },
            {
                title: 'Updating Subscription and Billing Cycles',
                content: `To renew or upgrade your plan:
1. Open System > Billing on the dashboard.
2. Choose between Monthly or Yearly cycles (Yearly yields 20% savings).
3. Click "Upgrade Plan" under Enterprise to unlock 24/7 dedicated Customer Care.
4. Payments are processed securely via Stripe. Your subscription will renew automatically.`,
                category: 'Subscription'
            }
        ]);
        console.log('Knowledge Base articles successfully seeded.');

        // 5. Seed Support Announcements
        console.log('Seeding Announcements...');
        const adminId = superAdmin ? superAdmin._id : agentUser._id;
        await SupportAnnouncement.insertMany([
            {
                title: 'Scheduled System Maintenance: RESTOSYS-v3.2',
                content: 'We will be conducting scheduled system updates on August 2nd, 2026, between 02:00 AM and 04:00 AM EST. During this maintenance window, POS printing sync and digital ordering WebSockets may experience brief intermittent connectivity of up to 10 minutes. POS offline billing will remain functional.',
                type: 'Scheduled Maintenance',
                isActive: true,
                createdBy: adminId
            },
            {
                title: 'Introducing Multi-Language QR Menus & Offline Mode',
                content: 'Our latest release v3.1.5 is now live! Enterprise customers can now upload translated menus for Spanish, French, and German. Customers scanning Table QRs will auto-detect local language. Additionally, POS printer buffers have been optimized to handle brief network disconnects.',
                type: 'Feature Releases',
                isActive: true,
                createdBy: adminId
            }
        ]);
        console.log('Announcements successfully seeded.');

        console.log('Support Data Seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding support data failed:', err.message);
        process.exit(1);
    }
};

seedSupportData();
