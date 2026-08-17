import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';

let cachedTransporter = null;

// Get or Create Transporter (supports live SMTP or dynamic Ethereal real-time test mailbox)
const getTransporter = async () => {
    if (cachedTransporter) return cachedTransporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        cachedTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        return cachedTransporter;
    }

    // Dynamic Real-Time Test Mailbox (Ethereal Email)
    try {
        const testAccount = await nodemailer.createTestAccount();
        cachedTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        console.log(`[Email Service Initialized] Real-time Ethereal test inbox created: ${testAccount.user}`);
        return cachedTransporter;
    } catch (err) {
        console.warn("Failed to create test email account, using console dispatch log:", err.message);
        return null;
    }
};

const getFromAddress = () => {
    return process.env.EMAIL_FROM || '"RestaurantHub SaaS" <no-reply@restosys.com>';
};

/**
 * 1. Send Welcome Email on New User Registration / Subscription
 */
export const sendWelcomeEmail = async ({ email, name, restaurantName, plan }) => {
    if (!email) return;

    const subject = `Welcome to RestaurantHub SaaS - Registration Received!`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Welcome to RestaurantHub SaaS!</h1>
                <p style="margin-top: 8px; opacity: 0.9; font-size: 14px;">Your Restaurant Management Platform</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Valued Customer'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Thank you for subscribing to <strong>RestaurantHub SaaS</strong>! We are thrilled to welcome <strong>${restaurantName || 'Your Restaurant'}</strong> to our platform.
                </p>
                <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Subscribed Plan:</strong> ${plan || 'Basic'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;"><strong>Account Status:</strong> Pending Super Admin Verification</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Your account registration details have been submitted to our Super Admin verification team for review. As soon as your restaurant verification is approved, your full plan dashboard will open automatically.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://f-hms.vercel.app" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Visit Your Portal
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} RestaurantHub SaaS. All rights reserved.
            </div>
        </div>
    `;

    try {
        const transporter = await getTransporter();
        if (transporter) {
            const info = await transporter.sendMail({
                from: getFromAddress(),
                to: email,
                subject,
                html
            });
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log(`Welcome email dispatched to ${email}. Message ID: ${info.messageId}`);
            if (previewUrl) {
                console.log(`[Real-time Email Preview URL]: ${previewUrl}`);
            }
        }
    } catch (error) {
        console.error(`Failed to send Welcome Email to ${email}:`, error.message);
    }
};

/**
 * 2. Send Subscription Expired Email Notification
 */
export const sendSubscriptionExpiredEmail = async ({ email, name, restaurantName, plan, expiryDate }) => {
    if (!email) return;

    const formattedDate = expiryDate ? new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently';
    const subject = `Subscription Expired Alert - Action Required for ${restaurantName || 'Your Restaurant'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Subscription Expired</h1>
                <p style="margin-top: 8px; opacity: 0.9; font-size: 14px;">Action Required for Your Restaurant Account</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Restaurant Owner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    This is an important alert regarding your subscription for <strong>${restaurantName || 'Your Restaurant'}</strong>. Your <strong>${plan || 'Basic'}</strong> plan subscription expired on <strong>${formattedDate}</strong>.
                </p>
                <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; font-size: 13px; color: #991b1b;"><strong>Status:</strong> Expired / Action Required</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #991b1b;">Please renew your subscription to restore full access to your plan modules.</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    You can easily renew or upgrade your plan by visiting the SaaS Subscription portal in your admin dashboard.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://f-hms.vercel.app/admin/billing" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Renew Subscription Now
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} RestaurantHub SaaS. All rights reserved.
            </div>
        </div>
    `;

    try {
        const transporter = await getTransporter();
        if (transporter) {
            const info = await transporter.sendMail({
                from: getFromAddress(),
                to: email,
                subject,
                html
            });
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log(`Subscription Expired email dispatched to ${email}. Message ID: ${info.messageId}`);
            if (previewUrl) {
                console.log(`[Real-time Email Preview URL]: ${previewUrl}`);
            }
        }
    } catch (error) {
        console.error(`Failed to send Subscription Expired Email to ${email}:`, error.message);
    }
};

/**
 * 3. Send Approval Email Notification when Super Admin Approves Restaurant
 */
export const sendApprovalEmail = async ({ email, name, restaurantName, plan }) => {
    if (!email) return;

    const subject = `Congratulations! Your Restaurant Verification is Approved!`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Account Approved! 🎉</h1>
                <p style="margin-top: 8px; opacity: 0.9; font-size: 14px;">Your Dashboard is Now Unlocked</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Great news, ${name || 'Restaurant Owner'}!</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Super Admin has reviewed and approved your restaurant verification for <strong>${restaurantName || 'Your Restaurant'}</strong>!
                </p>
                <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 13px; color: #1e40af;"><strong>Active Plan:</strong> ${plan || 'Basic'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #1e40af;"><strong>Dashboard Access:</strong> Unlocked & Ready</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    You can now access all features, order management, menu setup, staff accounts, and branch operations according to your plan tier.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://f-hms.vercel.app/admin" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Open Your Dashboard
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} RestaurantHub SaaS. All rights reserved.
            </div>
        </div>
    `;

    try {
        const transporter = await getTransporter();
        if (transporter) {
            const info = await transporter.sendMail({
                from: getFromAddress(),
                to: email,
                subject,
                html
            });
            const previewUrl = nodemailer.getTestMessageUrl(info);
            console.log(`Approval email dispatched to ${email}. Message ID: ${info.messageId}`);
            if (previewUrl) {
                console.log(`[Real-time Email Preview URL]: ${previewUrl}`);
            }
        }
    } catch (error) {
        console.error(`Failed to send Approval Email to ${email}:`, error.message);
    }
};
