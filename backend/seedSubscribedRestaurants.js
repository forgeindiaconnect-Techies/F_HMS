import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Restaurant from './models/Restaurant.js';
import User from './models/User.js';
import Branch from './models/Branch.js';
import SubscriptionPayment from './models/SubscriptionPayment.js';
import RestaurantVerification from './models/RestaurantVerification.js';

const subscribedData = [
    {
        name: "The Grand Olive Resto-Bar",
        city: "Mumbai, Maharashtra",
        phone: "+91 98201 12345",
        ownerName: "Rajesh Singhania",
        ownerEmail: "rajesh.singhania@grandolive.com",
        plan: "Enterprise",
        price: 10399,
        billingCycle: "yearly",
        daysRemaining: 280,
        outletFormat: "Fine Dine & Resto-Bar",
        isCustom: false
    },
    {
        name: "Punjab Grill & Co.",
        city: "Connaught Place, New Delhi",
        phone: "+91 98110 54321",
        ownerName: "Manpreet Singh",
        ownerEmail: "manpreet@punjabgrillco.in",
        plan: "Enterprise",
        price: 12999,
        billingCycle: "monthly",
        daysRemaining: 24,
        outletFormat: "Fine Dining",
        isCustom: true
    },
    {
        name: "Barbeque Central",
        city: "Indiranagar, Bengaluru",
        phone: "+91 99001 88776",
        ownerName: "Anita Nair",
        ownerEmail: "anita@barbequecentral.com",
        plan: "Enterprise",
        price: 10399,
        billingCycle: "yearly",
        daysRemaining: 195,
        outletFormat: "Multi-Outlet Chain",
        isCustom: false
    },
    {
        name: "Dakshin Express Fine Dining",
        city: "T. Nagar, Chennai",
        phone: "+91 94440 22334",
        ownerName: "Senthil Kumar",
        ownerEmail: "senthil@dakshinexpress.in",
        plan: "Enterprise",
        price: 12999,
        billingCycle: "monthly",
        daysRemaining: 18,
        outletFormat: "Fine Dining",
        isCustom: false
    },
    {
        name: "Urban Bites Cafe & Bakery",
        city: "Koregaon Park, Pune",
        phone: "+91 97654 33221",
        ownerName: "Pooja Desai",
        ownerEmail: "pooja@urbanbites.co",
        plan: "Pro",
        price: 5999,
        billingCycle: "monthly",
        daysRemaining: 21,
        outletFormat: "Cafes & Bakeries",
        isCustom: true
    },
    {
        name: "Saffron Leaf QSR",
        city: "Banjara Hills, Hyderabad",
        phone: "+91 90001 77665",
        ownerName: "Farhan Ahmed",
        ownerEmail: "farhan@saffronleaf.in",
        plan: "Pro",
        price: 5999,
        billingCycle: "monthly",
        daysRemaining: 15,
        outletFormat: "Quick Service (QSR)",
        isCustom: true
    },
    {
        name: "Chai Theory Bistro",
        city: "Salt Lake, Kolkata",
        phone: "+91 98300 44556",
        ownerName: "Debashis Mukherjee",
        ownerEmail: "debashis@chaitheory.com",
        plan: "Pro",
        price: 4799,
        billingCycle: "yearly",
        daysRemaining: 310,
        outletFormat: "Cafes & Bakeries",
        isCustom: false
    },
    {
        name: "Wok & Roll Asian Kitchen",
        city: "SG Highway, Ahmedabad",
        phone: "+91 99250 88990",
        ownerName: "Hiren Patel",
        ownerEmail: "hiren@wokandroll.in",
        plan: "Pro",
        price: 5999,
        billingCycle: "monthly",
        daysRemaining: 27,
        outletFormat: "Quick Service (QSR)",
        isCustom: false
    },
    {
        name: "Green Garden Pizzeria",
        city: "Panaji, Goa",
        phone: "+91 98221 66554",
        ownerName: "Dylan Fernandes",
        ownerEmail: "dylan@greengardenpizza.com",
        plan: "Basic",
        price: 2999,
        billingCycle: "monthly",
        daysRemaining: 19,
        outletFormat: "Quick Service (QSR)",
        isCustom: false
    },
    {
        name: "The Daily Brew Cafe",
        city: "Sector 17, Chandigarh",
        phone: "+91 98880 11223",
        ownerName: "Simran Kaur",
        ownerEmail: "simran@dailybrew.in",
        plan: "Basic",
        price: 2999,
        billingCycle: "monthly",
        daysRemaining: 29,
        outletFormat: "Cafes & Bakeries",
        isCustom: false
    },
    {
        name: "Cloud Crave Dark Kitchen",
        city: "Koramangala, Bengaluru",
        phone: "+91 97400 99887",
        ownerName: "Karthik R",
        ownerEmail: "karthik@cloudcrave.com",
        plan: "Pro",
        price: 5999,
        billingCycle: "monthly",
        daysRemaining: 22,
        outletFormat: "Cloud Kitchen",
        isCustom: true
    },
    {
        name: "Brew & Barrel Gastropub",
        city: "Cyber City, Gurugram",
        phone: "+91 98180 33445",
        ownerName: "Kunal Mehta",
        ownerEmail: "kunal@brewbarrel.in",
        plan: "Enterprise",
        price: 10399,
        billingCycle: "yearly",
        daysRemaining: 140,
        outletFormat: "Bar & Brewery",
        isCustom: true
    }
];

async function seedSubscribedRestaurants() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding subscribed restaurants...');

    for (const item of subscribedData) {
        // Check if restaurant already exists by name
        let restaurant = await Restaurant.findOne({ name: item.name });
        let owner = await User.findOne({ email: item.ownerEmail });

        if (!owner) {
            owner = await User.create({
                name: item.ownerName,
                email: item.ownerEmail,
                phoneNumber: item.phone,
                password: 'password123',
                role: 'RestaurantAdmin',
                isActive: true
            });
            console.log(`✓ Created Owner User: ${item.ownerName} (${item.ownerEmail})`);
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + item.daysRemaining);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (item.billingCycle === 'yearly' ? 365 - item.daysRemaining : 30 - item.daysRemaining));

        if (!restaurant) {
            restaurant = await Restaurant.create({
                name: item.name,
                ownerId: owner._id,
                phone: item.phone,
                address: item.city,
                approvalStatus: 'Approved',
                verificationStatus: 'Verified',
                isActive: true,
                subscription: {
                    status: 'Active',
                    plan: item.plan,
                    billingCycle: item.billingCycle,
                    trialActive: false,
                    price: item.price,
                    startDate: startDate,
                    expiryDate: expiryDate,
                    downgradeScheduledPlan: '',
                    downgradeScheduledDate: null
                },
                billingConfig: item.isCustom ? {
                    isCustomBillingActive: true,
                    activatedAt: startDate,
                    outletFormat: item.outletFormat,
                    modules: {
                        posBilling: true,
                        menuManagement: true,
                        tableManagement: item.outletFormat !== 'Cloud Kitchen',
                        dineInTakeawayOrders: true,
                        kitchenOrderManagement: true,
                        gstInvoice: true,
                        discounts: true,
                        customerManagement: true,
                        inventoryManagement: true,
                        salesReports: true,
                        staffManagement: true
                    },
                    paymentMethods: {
                        cash: true,
                        upi: true,
                        card: true,
                        splitPayment: true
                    },
                    serviceChargePercent: 5,
                    gstRatePercent: 5
                } : {
                    isCustomBillingActive: false,
                    outletFormat: item.outletFormat
                }
            });
            console.log(`✓ Created Subscribed Restaurant: ${item.name} (${item.plan} - ${item.billingCycle})`);
        } else {
            // Update to ensure ownerId and subscription match
            restaurant.ownerId = owner._id;
            restaurant.subscription = {
                status: 'Active',
                plan: item.plan,
                billingCycle: item.billingCycle,
                trialActive: false,
                price: item.price,
                startDate: startDate,
                expiryDate: expiryDate,
                downgradeScheduledPlan: '',
                downgradeScheduledDate: null
            };
            restaurant.approvalStatus = 'Approved';
            restaurant.verificationStatus = 'Verified';
            restaurant.isActive = true;
            if (item.isCustom) {
                restaurant.billingConfig = {
                    isCustomBillingActive: true,
                    activatedAt: startDate,
                    outletFormat: item.outletFormat,
                    modules: {
                        posBilling: true,
                        menuManagement: true,
                        tableManagement: item.outletFormat !== 'Cloud Kitchen',
                        dineInTakeawayOrders: true,
                        kitchenOrderManagement: true,
                        gstInvoice: true,
                        discounts: true,
                        customerManagement: true,
                        inventoryManagement: true,
                        salesReports: true,
                        staffManagement: true
                    },
                    paymentMethods: { cash: true, upi: true, card: true, splitPayment: true },
                    serviceChargePercent: 5,
                    gstRatePercent: 5
                };
            }
            await restaurant.save();
            console.log(`✓ Updated Subscribed Restaurant: ${item.name}`);
        }

        owner.restaurantId = restaurant._id;
        await owner.save();

        // Ensure Branch exists
        let branch = await Branch.findOne({ restaurantId: restaurant._id });
        if (!branch) {
            branch = await Branch.create({
                restaurantId: restaurant._id,
                name: `${restaurant.name} - Flagship Outlet`,
                location: { address: item.city },
                contact: { phone: item.phone },
                isActive: true
            });
        }

        // Ensure SubscriptionPayment history entry exists
        const paymentExists = await SubscriptionPayment.findOne({ restaurantId: restaurant._id });
        if (!paymentExists) {
            const txnId = 'TXN-SaaS-' + Math.floor(10000000 + Math.random() * 90000000);
            await SubscriptionPayment.create({
                restaurantId: restaurant._id,
                planName: item.plan,
                amount: item.price,
                billingCycle: item.billingCycle,
                paymentMethod: 'Card',
                transactionId: txnId,
                status: 'Completed',
                effectiveDate: startDate,
                expiryDate: expiryDate
            });
        }

        // Ensure RestaurantVerification exists as Verified
        let verif = await RestaurantVerification.findOne({ restaurantId: restaurant._id });
        if (!verif) {
            await RestaurantVerification.create({
                restaurantId: restaurant._id,
                status: 'Verified',
                documents: {
                    addressProof: { addressText: item.city, status: 'Approved' },
                    fssai: { status: 'Approved', expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
                    businessRegistration: { status: 'Approved' },
                    panCard: { status: 'Approved' },
                    aadhaarCard: { status: 'Approved' },
                    bankProof: { status: 'Approved' }
                },
                history: [{
                    status: 'Verified',
                    comments: 'Approved by Super Admin on platform registration verification.',
                    actionDate: startDate
                }]
            });
        }
    }

    console.log('\n--- ALL SUBSCRIBED RESTAURANTS SEEDED & VERIFIED SUCCESSFULLY! ---');
    await mongoose.disconnect();
}

seedSubscribedRestaurants().catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
});
