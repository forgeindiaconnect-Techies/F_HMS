import Plan from '../models/Plan.js';
import Restaurant from '../models/Restaurant.js';

export const getPublicPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ isActive: { $ne: false } }).sort({ monthlyPrice: 1, createdAt: 1 });
        if (!plans || plans.length === 0) {
            return res.json([
                { _id: 'p1', name: 'Starter', monthlyPrice: 2999, yearlyPrice: 2399, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'], isActive: true },
                { _id: 'p2', name: 'Professional', monthlyPrice: 5999, yearlyPrice: 4799, features: ['Up to 3 Branches', 'Kitchen Display System', 'Online Ordering', 'Advanced Analytics', 'Priority Support'], isActive: true },
                { _id: 'p3', name: 'Enterprise', monthlyPrice: 12999, yearlyPrice: 10399, features: ['Unlimited Branches', 'Custom APIs & Webhooks', 'Dedicated Account Manager', 'SLA Guarantee', 'White-label Branding'], isActive: true }
            ]);
        }
        res.json(plans);
    } catch (error) {
        res.json([
            { _id: 'p1', name: 'Starter', monthlyPrice: 2999, yearlyPrice: 2399, features: ['1 Branch', 'Basic POS Billing', 'QR Ordering', 'Email Support'], isActive: true },
            { _id: 'p2', name: 'Professional', monthlyPrice: 5999, yearlyPrice: 4799, features: ['Up to 3 Branches', 'Kitchen Display System', 'Online Ordering', 'Advanced Analytics', 'Priority Support'], isActive: true },
            { _id: 'p3', name: 'Enterprise', monthlyPrice: 12999, yearlyPrice: 10399, features: ['Unlimited Branches', 'Custom APIs & Webhooks', 'Dedicated Account Manager', 'SLA Guarantee', 'White-label Branding'], isActive: true }
        ]);
    }
};

export const scanActivateSubscription = async (req, res) => {
    const { restaurantId, plan } = req.query;
    try {
        if (!restaurantId || !plan) {
            return res.status(400).send('<h1>Invalid request parameters</h1>');
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).send('<h1>Restaurant not found</h1>');
        }

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30); // 30 days active

        restaurant.subscription = {
            status: 'Active',
            plan: plan,
            billingCycle: 'monthly',
            trialActive: false,
            expiryDate: expiryDate,
            startDate: new Date()
        };

        await restaurant.save();

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Successful</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        background: #f4f7f6;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        text-align: center;
                        color: #333;
                    }
                    .card {
                        background: white;
                        padding: 40px;
                        border-radius: 24px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                        max-width: 320px;
                    }
                    .icon {
                        width: 72px;
                        height: 72px;
                        background: #e6f7ed;
                        color: #2e7d32;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 36px;
                        margin: 0 auto 24px;
                    }
                    h1 {
                        font-size: 24px;
                        font-weight: 800;
                        margin: 0 0 12px;
                    }
                    p {
                        font-size: 14px;
                        color: #666;
                        line-height: 1.5;
                        margin: 0 0 24px;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">✓</div>
                    <h1>Subscription Active</h1>
                    <p>Payment successful! The <strong>${plan}</strong> plan has been activated for your restaurant.</p>
                    <p style="font-size: 12px; color: #999;">You can close this tab and return to your dashboard.</p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send(`<h1>Error activating subscription</h1><p>${error.message}</p>`);
    }
};
