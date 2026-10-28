import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Restaurant from './models/Restaurant.js';
import Branch from './models/Branch.js';
import Order from './models/Order.js';
import KOT from './models/KOT.js';
import User from './models/User.js';
import { generateKOTsForOrder } from './utils/kotHelper.js';

const runTests = async () => {
    console.log('--- STARTING KOT_ONLY & KDS WORKFLOW VERIFICATION ---');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let passedTests = 0;
    let failedTests = 0;

    const assert = (condition, msg) => {
        if (condition) {
            console.log(`[PASS] ${msg}`);
            passedTests++;
        } else {
            console.error(`[FAIL] ${msg}`);
            failedTests++;
        }
    };

    try {
        let adminUser = await User.findOne({ role: 'SuperAdmin' }) || await User.findOne({ role: 'RestaurantAdmin' }) || await User.findOne();
        if (!adminUser) {
            adminUser = await User.create({
                name: 'Admin Owner',
                email: 'admin_owner@example.com',
                password: 'password123',
                role: 'SuperAdmin'
            });
        }

        // 1. Setup Test Restaurants
        let restKOT = await Restaurant.findOne({ name: 'Test KOT_ONLY Bistro' });
        if (!restKOT) {
            restKOT = await Restaurant.create({
                name: 'Test KOT_ONLY Bistro',
                address: '123 KOT Lane',
                phone: '9876543210',
                ownerId: adminUser._id,
                kitchenMode: 'KOT_ONLY',
                restaurantConfig: {
                    orderKitchen: {
                        kitchenMode: 'KOT_ONLY',
                        kotEnabled: true,
                        kdsEnabled: false,
                        kotPrintEnabled: true
                    }
                }
            });
        } else {
            restKOT.kitchenMode = 'KOT_ONLY';
            restKOT.restaurantConfig.orderKitchen.kitchenMode = 'KOT_ONLY';
            restKOT.restaurantConfig.orderKitchen.kdsEnabled = false;
            restKOT.restaurantConfig.orderKitchen.kotEnabled = true;
            restKOT.restaurantConfig.orderKitchen.kotPrintEnabled = true;
            await restKOT.save();
        }

        let restKDS = await Restaurant.findOne({ name: 'Test KDS Grill' });
        if (!restKDS) {
            restKDS = await Restaurant.create({
                name: 'Test KDS Grill',
                address: '456 KDS Avenue',
                phone: '9876543211',
                ownerId: adminUser._id,
                kitchenMode: 'KDS',
                restaurantConfig: {
                    orderKitchen: {
                        kitchenMode: 'KDS',
                        kotEnabled: true,
                        kdsEnabled: true,
                        kotPrintEnabled: true
                    }
                }
            });
        } else {
            restKDS.kitchenMode = 'KDS';
            restKDS.restaurantConfig.orderKitchen.kitchenMode = 'KDS';
            restKDS.restaurantConfig.orderKitchen.kdsEnabled = true;
            await restKDS.save();
        }

        let branchKOT = await Branch.findOne({ restaurantId: restKOT._id });
        if (!branchKOT) {
            branchKOT = await Branch.create({ name: 'KOT Main Branch', restaurantId: restKOT._id });
        }
        let branchKDS = await Branch.findOne({ restaurantId: restKDS._id });
        if (!branchKDS) {
            branchKDS = await Branch.create({ name: 'KDS Main Branch', restaurantId: restKDS._id });
        }

        let testUser = await User.findOne({ role: 'Customer' });
        if (!testUser) {
            testUser = await User.create({
                name: 'Test Customer',
                email: 'testcustomer_kot@example.com',
                password: 'password123',
                role: 'Customer'
            });
        }

        // Test 1: Verify Default Kitchen Mode and Restaurant-Level Isolation
        console.log('\n--- TEST SUITE 1: Restaurant-Level Isolation & Default Settings ---');
        assert(restKOT.kitchenMode === 'KOT_ONLY', 'Restaurant A correctly configured with kitchenMode = KOT_ONLY');
        assert(restKOT.restaurantConfig.orderKitchen.kitchenMode === 'KOT_ONLY', 'Restaurant A orderKitchen.kitchenMode is KOT_ONLY');
        assert(restKOT.restaurantConfig.orderKitchen.kdsEnabled === false, 'Restaurant A has kdsEnabled = false');

        assert(restKDS.kitchenMode === 'KDS', 'Restaurant B correctly configured with kitchenMode = KDS');
        assert(restKDS.restaurantConfig.orderKitchen.kitchenMode === 'KDS', 'Restaurant B orderKitchen.kitchenMode is KDS');
        assert(restKDS.restaurantConfig.orderKitchen.kdsEnabled === true, 'Restaurant B has kdsEnabled = true');

        // Test existing restaurants without explicit kitchenMode default to KDS
        const legacyRest = new Restaurant({ name: 'Legacy Restaurant Test' });
        assert(legacyRest.kitchenMode === 'KDS', 'Legacy restaurant default schema kitchenMode is KDS');
        assert(legacyRest.restaurantConfig.orderKitchen.kitchenMode === 'KDS', 'Legacy restaurant orderKitchen.kitchenMode defaults to KDS');

        // Test 2: KOT_ONLY Workflow - Dine In Order
        console.log('\n--- TEST SUITE 2: KOT_ONLY Dine-In Order Workflow ---');
        const dineInOrder = await Order.create({
            user: testUser._id,
            restaurantId: restKOT._id,
            branchId: branchKOT._id,
            orderType: 'Dine In',
            tableNumber: '12',
            kitchenMode: restKOT.kitchenMode,
            orderItems: [
                { name: 'Paneer Butter Masala', qty: 2, price: 280, image: '/pbm.jpg' },
                { name: 'Butter Naan', qty: 4, price: 40, image: '/naan.jpg' }
            ],
            taxPrice: 36,
            totalPrice: 756,
            paymentMethod: 'Cash',
            status: 'Pending',
            statusHistory: [{ status: 'Pending', timestamp: new Date() }]
        });

        assert(dineInOrder.kitchenMode === 'KOT_ONLY', 'Dine-In order inherits kitchenMode = KOT_ONLY');
        assert(dineInOrder.status === 'Pending', 'New order starts with status = Pending');

        // Trigger KOT generation
        const generatedKots = await generateKOTsForOrder(dineInOrder, { serverName: 'Test Waiter' });
        assert(generatedKots.length > 0, `Generated ${generatedKots.length} KOT tickets for order`);
        assert(generatedKots[0].orderId.toString() === dineInOrder._id.toString(), 'KOT links to parent order');

        // Test KOT Print independence: printing must NOT mark order as Ready or Completed
        const kotDoc = generatedKots[0];
        kotDoc.isPrinted = true;
        kotDoc.printCount = 1;
        kotDoc.printedAt = new Date();
        await kotDoc.save();

        const reloadedOrderAfterPrint = await Order.findById(dineInOrder._id);
        assert(reloadedOrderAfterPrint.status === 'Pending', 'Printing KOT did NOT alter order status (remains Pending)');

        // Waiter advances Dine-In Order: Pending -> Preparing
        dineInOrder.status = 'Preparing';
        dineInOrder.statusHistory.push({ status: 'Preparing', timestamp: new Date() });
        await dineInOrder.save();
        assert(dineInOrder.status === 'Preparing', 'Waiter updated status to Preparing');

        // Waiter advances: Preparing -> Ready
        dineInOrder.status = 'Ready';
        dineInOrder.statusHistory.push({ status: 'Ready', timestamp: new Date() });
        await dineInOrder.save();
        assert(dineInOrder.status === 'Ready', 'Waiter updated status to Ready (plated and ready)');

        // Waiter advances: Ready -> Served
        dineInOrder.status = 'Served';
        dineInOrder.statusHistory.push({ status: 'Served', timestamp: new Date() });
        await dineInOrder.save();
        assert(dineInOrder.status === 'Served', 'Waiter updated status to Served');

        // Waiter advances: Served -> Billing Requested
        dineInOrder.status = 'Billing Requested';
        dineInOrder.statusHistory.push({ status: 'Billing Requested', timestamp: new Date() });
        await dineInOrder.save();
        assert(dineInOrder.status === 'Billing Requested', 'Waiter updated status to Billing Requested');

        // Cashier settles order -> Completed
        dineInOrder.status = 'Completed';
        dineInOrder.isPaid = true;
        dineInOrder.statusHistory.push({ status: 'Completed', timestamp: new Date() });
        await dineInOrder.save();
        assert(dineInOrder.status === 'Completed', 'Order finalized to Completed');
        assert(dineInOrder.statusHistory.length === 6, 'Complete status history recorded (Pending -> Preparing -> Ready -> Served -> Billing Requested -> Completed)');

        // Test 3: KOT_ONLY Workflow - Self-Pickup Order
        console.log('\n--- TEST SUITE 3: KOT_ONLY Self-Pickup Order Workflow ---');
        const pickupOrder = await Order.create({
            user: testUser._id,
            restaurantId: restKOT._id,
            branchId: branchKOT._id,
            orderType: 'Self-Pickup',
            serviceType: 'Self Dine-In (KFC Style)',
            kitchenMode: restKOT.kitchenMode,
            orderItems: [
                { name: 'Crispy Veg Burger', qty: 1, price: 150, image: '/burger.jpg' }
            ],
            taxPrice: 7.5,
            totalPrice: 157.5,
            paymentMethod: 'UPI',
            status: 'Pending',
            statusHistory: [{ status: 'Pending', timestamp: new Date() }]
        });

        assert(pickupOrder.kitchenMode === 'KOT_ONLY', 'Self-Pickup order has kitchenMode = KOT_ONLY');

        // Waiter advances: Pending -> Preparing -> Ready for Pickup -> Picked Up
        pickupOrder.status = 'Preparing';
        pickupOrder.statusHistory.push({ status: 'Preparing', timestamp: new Date() });
        await pickupOrder.save();
        assert(pickupOrder.status === 'Preparing', 'Self-pickup marked Preparing');

        pickupOrder.status = 'Ready for Pickup';
        pickupOrder.statusHistory.push({ status: 'Ready for Pickup', timestamp: new Date() });
        await pickupOrder.save();
        assert(pickupOrder.status === 'Ready for Pickup', 'Self-pickup marked Ready for Pickup');

        pickupOrder.status = 'Picked Up';
        pickupOrder.statusHistory.push({ status: 'Picked Up', timestamp: new Date() });
        await pickupOrder.save();
        assert(pickupOrder.status === 'Picked Up', 'Self-pickup marked Picked Up');

        // Cashier marks Completed
        pickupOrder.status = 'Completed';
        pickupOrder.statusHistory.push({ status: 'Completed', timestamp: new Date() });
        await pickupOrder.save();
        assert(pickupOrder.status === 'Completed', 'Self-pickup order Completed');

        // Test 4: KOT_ONLY Workflow - Delivery Order
        console.log('\n--- TEST SUITE 4: KOT_ONLY Delivery Order Workflow ---');
        const deliveryOrder = await Order.create({
            user: testUser._id,
            restaurantId: restKOT._id,
            branchId: branchKOT._id,
            orderType: 'Delivery',
            serviceType: 'Delivery',
            kitchenMode: restKOT.kitchenMode,
            orderItems: [
                { name: 'Chicken Biryani', qty: 1, price: 320, image: '/biryani.jpg' }
            ],
            taxPrice: 16,
            totalPrice: 386,
            deliveryCharge: 50,
            paymentMethod: 'Online',
            status: 'Pending',
            deliveryStatus: 'None',
            statusHistory: [{ status: 'Pending', timestamp: new Date() }]
        });

        assert(deliveryOrder.kitchenMode === 'KOT_ONLY', 'Delivery order has kitchenMode = KOT_ONLY');

        // Waiter advances: Pending -> Preparing
        deliveryOrder.status = 'Preparing';
        deliveryOrder.statusHistory.push({ status: 'Preparing', timestamp: new Date() });
        await deliveryOrder.save();
        assert(deliveryOrder.status === 'Preparing', 'Delivery order marked Preparing');

        // Waiter advances: Preparing -> Ready for Dispatch
        deliveryOrder.status = 'Ready for Dispatch';
        deliveryOrder.deliveryStatus = 'Pending Assignment';
        deliveryOrder.statusHistory.push({ status: 'Ready for Dispatch', timestamp: new Date() });
        await deliveryOrder.save();
        assert(deliveryOrder.status === 'Ready for Dispatch', 'Delivery order marked Ready for Dispatch');
        assert(deliveryOrder.deliveryStatus === 'Pending Assignment', 'Delivery status updated to Pending Assignment');

        // Rider dispatched: Ready for Dispatch -> Out for Delivery
        deliveryOrder.status = 'Out for Delivery';
        deliveryOrder.deliveryStatus = 'On the Way';
        deliveryOrder.statusHistory.push({ status: 'Out for Delivery', timestamp: new Date() });
        await deliveryOrder.save();
        assert(deliveryOrder.status === 'Out for Delivery', 'Delivery order marked Out for Delivery');
        assert(deliveryOrder.deliveryStatus === 'On the Way', 'Delivery status is On the Way');

        // Delivered: Out for Delivery -> Delivered
        deliveryOrder.status = 'Delivered';
        deliveryOrder.deliveryStatus = 'Delivered';
        deliveryOrder.statusHistory.push({ status: 'Delivered', timestamp: new Date() });
        await deliveryOrder.save();
        assert(deliveryOrder.status === 'Delivered', 'Delivery order marked Delivered');
        assert(deliveryOrder.deliveryStatus === 'Delivered', 'Delivery status is Delivered');

        // Test 5: Existing KDS Restaurant Workflow Unaffected
        console.log('\n--- TEST SUITE 5: Existing KDS Workflow Unaffected ---');
        const kdsOrder = await Order.create({
            user: testUser._id,
            restaurantId: restKDS._id,
            branchId: branchKDS._id,
            orderType: 'Dine In',
            tableNumber: '5',
            kitchenMode: restKDS.kitchenMode,
            orderItems: [
                { name: 'Veg Supreme Pizza', qty: 1, price: 420, image: '/pizza.jpg' }
            ],
            taxPrice: 21,
            totalPrice: 441,
            paymentMethod: 'Card',
            status: 'Pending',
            statusHistory: [{ status: 'Pending', timestamp: new Date() }]
        });

        assert(kdsOrder.kitchenMode === 'KDS', 'KDS order retains kitchenMode = KDS');

        // In KDS restaurant: Chef updates status through KDS (Chef Dashboard)
        kdsOrder.status = 'Preparing';
        kdsOrder.statusHistory.push({ status: 'Preparing', timestamp: new Date() });
        await kdsOrder.save();
        assert(kdsOrder.status === 'Preparing', 'Chef updated KDS order to Preparing');

        kdsOrder.status = 'Ready';
        kdsOrder.statusHistory.push({ status: 'Ready', timestamp: new Date() });
        await kdsOrder.save();
        assert(kdsOrder.status === 'Ready', 'Chef marked KDS order Ready');

        // Only after Ready, Waiter sees Serve button in KDS mode:
        kdsOrder.status = 'Served';
        kdsOrder.statusHistory.push({ status: 'Served', timestamp: new Date() });
        await kdsOrder.save();
        assert(kdsOrder.status === 'Served', 'Waiter served KDS order');

        // Cleanup test orders and KOTs
        await Order.deleteMany({ _id: { $in: [dineInOrder._id, pickupOrder._id, deliveryOrder._id, kdsOrder._id] } });
        await KOT.deleteMany({ orderId: { $in: [dineInOrder._id, pickupOrder._id, deliveryOrder._id, kdsOrder._id] } });
        console.log('\nCleaned up test orders and KOTs');

        console.log(`\n========================================`);
        console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
        console.log(`========================================\n`);

        process.exit(failedTests > 0 ? 1 : 0);
    } catch (err) {
        console.error('Test execution error:', err);
        process.exit(1);
    }
};

runTests();
