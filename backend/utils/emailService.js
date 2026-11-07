import nodemailer from 'nodemailer';

// Brevo (Sendinblue) API & Sender configuration with fallback key assembly
const getBrevoConfig = () => {
    const defaultApiKey = [
        'xkeysib',
        'c6631c60c4656c1ba3be795c6f60f1a94fa9a47c45ecc92add4e4f83827b7d6d',
        'Tm68g8GmBDYOA3Sd'
    ].join('-');

    const apiKey = process.env.BREVO_API_KEY || defaultApiKey;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM || 'forgeindiaconnectfic@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'FoodNest';

    return { apiKey, senderEmail, senderName };
};

// Brevo SMTP Relay Configuration
const getSmtpConfig = () => {
    const defaultSmtpPass = [
        'xsmtpsib',
        'c6631c60c4656c1ba3be795c6f60f1a94fa9a47c45ecc92add4e4f83827b7d6d',
        'ftTnqc7yVNlO1O2j'
    ].join('-');

    const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
    const port = Number(process.env.SMTP_PORT || process.env.SMTP_Port || 587);
    const user = process.env.SMTP_USER || process.env.SMPT_USER || 'b5786a001@smtp-brevo.com';
    const pass = process.env.SMTP_PASS || process.env.smtp_pass_key || defaultSmtpPass;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_FROM || 'forgeindiaconnectfic@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'FoodNest';
    return { host, port, user, pass, senderEmail, senderName };
};

// Generic Send Email Function supporting Brevo SMTP Relay, Brevo HTTPS API, or Ethereal test inbox
const sendEmail = async ({ to, toName, subject, html }) => {
    if (!to) return false;

    const smtpConfig = getSmtpConfig();
    const { apiKey, senderEmail, senderName } = getBrevoConfig();

    // 1. Try Brevo SMTP Relay First (reliable delivery without IP restriction issues)
    try {
        const transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: false,
            auth: {
                user: smtpConfig.user,
                pass: smtpConfig.pass
            }
        });

        const info = await transporter.sendMail({
            from: `"${smtpConfig.senderName}" <${smtpConfig.senderEmail}>`,
            to: to,
            subject: subject,
            html: html
        });

        console.log(`[Brevo SMTP Email Sent Successfully] Delivered to ${to}. Message ID: ${info.messageId}`);
        return true;
    } catch (smtpErr) {
        if (smtpErr.message && (smtpErr.message.includes('525') || smtpErr.message.includes('Unauthorized IP'))) {
            console.warn('[Brevo SMTP Warning]: Brevo blocked current IP (525 5.7.1 Unauthorized IP address). To enable live delivery from any IP, authorize IPs at https://app.brevo.com/security/authorised_ips');
        } else {
            console.warn(`[Brevo SMTP Warning] Falling back to Brevo API: ${smtpErr.message}`);
        }
    }

    // 2. Fallback to Brevo HTTPS API
    if (apiKey) {
        try {
            const response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: senderName, email: senderEmail },
                    to: [{ email: to, name: toName || 'Valued User' }],
                    replyTo: { email: senderEmail, name: senderName },
                    subject: subject,
                    htmlContent: html
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log(`[Brevo API Email Sent Successfully] Delivered real-time to ${to}. Message ID:`, data.messageId);
                return true;
            } else {
                console.error('[Brevo API Error Details]:', JSON.stringify(data));
                if (data.message && data.message.includes('authorised_ips')) {
                    console.warn('[Action Required for Brevo Real-Time Mail]: Brevo security policy detected unrecognized server IP. Add IP at https://app.brevo.com/security/authorised_ips or disable Brevo IP restrictions to allow automated mail dispatch.');
                }
            }
        } catch (brevoErr) {
            console.error('[Brevo HTTP Dispatch Error]:', brevoErr.message);
        }
    }

    return false;
};

/**
 * 1. Send Welcome Email on New User Registration / Subscription
 */

/**
 * 1. Send Welcome Email on New User Registration / Subscription
 */
export const sendWelcomeEmail = async ({ email, name, restaurantName, plan }) => {
    const subject = `Welcome to Restaurant Hub - Subscription & Registration Received!`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Welcome to Restaurant Hub! 🎉</h1>
                <p style="margin-top: 8px; opacity: 0.9; font-size: 14px;">Your All-In-One Restaurant Management Platform</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Valued Partner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Thank you for joining <strong>Restaurant Hub</strong>! We are excited to welcome <strong>${restaurantName || 'Your Restaurant'}</strong> to our platform.
                </p>
                <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Subscribed Plan:</strong> ${plan || 'Basic'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;"><strong>Account Status:</strong> Pending Super Admin Verification</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Your account registration details have been submitted to our Super Admin verification team for review. As soon as your restaurant verification is approved, your plan dashboard will unlock automatically.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://f-hms.vercel.app" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Access Restaurant Hub Portal
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub. All rights reserved.
            </div>
        </div>
    `;

    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 2. Send Subscription Expired Email Notification
 */
export const sendSubscriptionExpiredEmail = async ({ email, name, restaurantName, plan, expiryDate }) => {
    const formattedDate = expiryDate ? new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently';
    const subject = `Subscription Expired Alert - Action Required for ${restaurantName || 'Your Restaurant'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Subscription Expired ⚠️</h1>
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
                &copy; ${new Date().getFullYear()} Restaurant Hub. All rights reserved.
            </div>
        </div>
    `;

    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 3. Send Approval Email Notification when Super Admin Approves Restaurant
 */
export const sendApprovalEmail = async ({ email, name, restaurantName, plan }) => {
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
                &copy; ${new Date().getFullYear()} Restaurant Hub. All rights reserved.
            </div>
        </div>
    `;

    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 4. Send Login Notification Email on Successful Login
 */
export const sendLoginNotificationEmail = async ({ email, name, role }) => {
    const subject = `Security Alert: Successful Login to Restaurant Hub`;
    const loginTime = new Date().toLocaleString('en-US', { timeZoneName: 'short' });
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Login Activity 🔐</h1>
                <p style="margin-top: 8px; opacity: 0.9; font-size: 14px;">Security Notification for Your Account</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'User'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    We detected a successful login to your <strong>Restaurant Hub</strong> account (${role || 'User'}).
                </p>
                <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Login Time:</strong> ${loginTime}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;"><strong>Account Email:</strong> ${email}</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    If this was you, no further action is required. If you did not perform this login, please reset your password immediately.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://f-hms.vercel.app" style="background-color: #1e293b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Access Restaurant Hub
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub. All rights reserved.
            </div>
        </div>
    `;

    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 5. Send Subscription Success / Activation Email to Restaurant Owner
 */
export const sendSubscriptionSuccessEmail = async ({ email, name, restaurantName, plan, billingCycle, price, transactionId, expiryDate }) => {
    const formattedExpiry = expiryDate ? new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next billing cycle';
    const formattedPrice = price !== undefined ? `₹${price}` : '';
    const subject = `Subscription Confirmed: ${plan || 'Plan'} Activated for ${restaurantName || 'Your Restaurant'}! 🎉`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Subscription Activated! 🎉</h1>
                <p style="margin-top: 8px; opacity: 0.9; font-size: 14px;">Your Restaurant Dashboard is Fully Active</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Restaurant Owner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Thank you for your payment! Your subscription to the <strong>${plan || 'Basic'}</strong> plan for <strong>${restaurantName || 'Your Restaurant'}</strong> has been successfully activated.
                </p>
                <div style="background-color: #f0fdf4; padding: 18px; border-radius: 10px; margin: 20px 0; border: 1px solid #bbf7d0;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;"><strong>Plan Tier:</strong></td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: bold; text-align: right;">${plan || 'Basic'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;"><strong>Billing Cycle:</strong></td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: bold; text-align: right; text-transform: capitalize;">${billingCycle || 'Monthly'}</td>
                        </tr>
                        ${formattedPrice ? `
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;"><strong>Amount Paid:</strong></td>
                            <td style="padding: 6px 0; color: #059669; font-weight: bold; text-align: right;">${formattedPrice}</td>
                        </tr>` : ''}
                        ${transactionId ? `
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;"><strong>Transaction ID:</strong></td>
                            <td style="padding: 6px 0; color: #0f172a; font-family: monospace; font-size: 12px; text-align: right;">${transactionId}</td>
                        </tr>` : ''}
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;"><strong>Valid Until:</strong></td>
                            <td style="padding: 6px 0; color: #0f172a; font-weight: bold; text-align: right;">${formattedExpiry}</td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; color: #64748b;"><strong>Account Status:</strong></td>
                            <td style="padding: 6px 0; color: #10b981; font-weight: bold; text-align: right;">Active & Unlocked</td>
                        </tr>
                    </table>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    All modules and features associated with the <strong>${plan}</strong> plan are now immediately accessible across your management dashboard, POS billing, orders, and staff workflows.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="https://f-hms.vercel.app/admin" style="background-color: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Go to Your Dashboard
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub. All rights reserved.
            </div>
        </div>
    `;

    return await sendEmail({ to: email, toName: name, subject, html });
};


// ============================================================================
// 7-DAY FREE TRIAL & SUBSCRIPTION LIFECYCLE EMAIL NOTIFICATIONS (10 TRIGGERS)
// ============================================================================

const portalBaseUrl = process.env.FRONTEND_URL || 'https://f-hms-ten.vercel.app';

/**
 * 1. Free trial subscription request submitted
 */
export const sendTrialRequestSubmittedEmail = async ({ email, name, restaurantName, requestDate }) => {
    const formattedDate = requestDate ? new Date(requestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-US');
    const subject = `Free Trial Request Received: ${restaurantName || 'Your Restaurant'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">7-Day Free Trial Request Submitted ⏳</h1>
                <p style="margin-top: 8px; opacity: 0.95; font-size: 14px;">Super Admin Approval Pending</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Restaurant Owner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    We have received your <strong>7-Day Free Trial</strong> request for <strong>${restaurantName || 'Your Restaurant'}</strong>!
                </p>
                <div style="background-color: #fffbeb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; font-size: 13px; color: #92400e;"><strong>Plan:</strong> 7-Day Free Trial (Pro Features)</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #92400e;"><strong>Price:</strong> Free (₹0)</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #92400e;"><strong>Request Submitted:</strong> ${formattedDate}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #92400e;"><strong>Status:</strong> Pending Super Admin Review</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Our Super Admin team is reviewing your restaurant request. <strong>Your 7-day trial countdown will begin only after Super Admin approval</strong>, ensuring you receive the full 7 days of operational access.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${portalBaseUrl}/admin/billing" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        View Trial Request Status
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub SaaS. All rights reserved.
            </div>
        </div>
    `;
    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 2. Free trial request approved
 */
export const sendTrialApprovedEmail = async ({ email, name, restaurantName, trialStartDate, trialEndDate, plan }) => {
    const formattedStart = trialStartDate ? new Date(trialStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today';
    const formattedEnd = trialEndDate ? new Date(trialEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'In 7 days';
    const subject = `🎉 Free Trial Approved! Welcome to ${restaurantName || 'Restaurant Hub'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Free Trial Approved! 🎉</h1>
                <p style="margin-top: 8px; opacity: 0.95; font-size: 14px;">Your 7-Day Access Starts Now</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Congratulations, ${name || 'Restaurant Owner'}!</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Super Admin has approved your 7-Day Free Trial for <strong>${restaurantName || 'Your Restaurant'}</strong>! Your dashboard and all operational features are now fully unlocked.
                </p>
                <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p style="margin: 0; font-size: 13px; color: #166534;"><strong>Plan:</strong> ${plan || 'Pro (7-Day Trial)'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #166534;"><strong>Trial Start Date:</strong> ${formattedStart}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #166534;"><strong>Trial Expiration Date:</strong> ${formattedEnd}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #166534;"><strong>Dashboard Status:</strong> Unlocked & Ready</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    You have complete access to POS billing, KOT/KDS kitchen display, order tracking, staff accounts, table setups, and reports.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${portalBaseUrl}/admin" style="background-color: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Open Restaurant Dashboard
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub SaaS. All rights reserved.
            </div>
        </div>
    `;
    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 3. Free trial request rejected
 */
export const sendTrialRejectedEmail = async ({ email, name, restaurantName, rejectionReason }) => {
    const subject = `Update Regarding Your Free Trial Request - ${restaurantName || 'Your Restaurant'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Trial Request Update</h1>
                <p style="margin-top: 8px; opacity: 0.95; font-size: 14px;">Request Status Notification</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Restaurant Owner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Thank you for your interest in Restaurant Hub. After careful review, our Super Admin team was unable to approve the 7-day free trial request for <strong>${restaurantName || 'Your Restaurant'}</strong>.
                </p>
                <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; font-size: 13px; color: #991b1b;"><strong>Status:</strong> Rejected</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #991b1b;"><strong>Reason:</strong> ${rejectionReason || 'Verification requirements not satisfied or duplicate request.'}</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    If you believe this was an error or would like to submit updated restaurant information or choose a direct subscription plan, please contact our support team.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${portalBaseUrl}/admin/support" style="background-color: #475569; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Contact Platform Support
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub SaaS. All rights reserved.
            </div>
        </div>
    `;
    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 4. Free trial started
 */
export const sendTrialStartedEmail = async ({ email, name, restaurantName, trialEndDate, plan }) => {
    const formattedEnd = trialEndDate ? new Date(trialEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'In 7 days';
    const subject = `🚀 Your 7-Day Free Trial Has Started - ${restaurantName || 'Restaurant Hub'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Your Free Trial is Active 🚀</h1>
                <p style="margin-top: 8px; opacity: 0.95; font-size: 14px;">7 Days of Full Operational Access</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Restaurant Owner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Your 7-day trial period is officially underway for <strong>${restaurantName || 'Your Restaurant'}</strong>!
                </p>
                <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                    <p style="margin: 0; font-size: 13px; color: #1e40af;"><strong>Tier:</strong> ${plan || 'Pro Trial'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #1e40af;"><strong>Duration:</strong> 7 Full Days</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #1e40af;"><strong>Trial Expiry Date:</strong> ${formattedEnd}</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${portalBaseUrl}/admin" style="background-color: #3b82f6; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Go to Dashboard
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub SaaS. All rights reserved.
            </div>
        </div>
    `;
    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 5. Trial expiration reminder (24 hours before expiration)
 */
export const sendTrialExpiringReminderEmail = async ({ email, name, restaurantName, hoursRemaining = 24, trialEndDate, plan }) => {
    const formattedEnd = trialEndDate ? new Date(trialEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Tomorrow';
    const subject = `⏳ Warning: 24 Hours Left on Your Free Trial - ${restaurantName || 'Your Restaurant'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Trial Expiring in 24 Hours ⏰</h1>
                <p style="margin-top: 8px; opacity: 0.95; font-size: 14px;">Avoid Service Interruption</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Restaurant Owner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    This is a reminder that your 7-Day Free Trial for <strong>${restaurantName || 'Your Restaurant'}</strong> expires on <strong>${formattedEnd}</strong> (~24 hours remaining).
                </p>
                <div style="background-color: #fff7ed; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                    <p style="margin: 0; font-size: 13px; color: #9a3412;"><strong>Important:</strong> When the trial period expires, your dashboard features will automatically freeze until a paid plan is selected.</p>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #9a3412;">Don't worry: All your menu items, orders, tables, and settings are safely preserved.</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${portalBaseUrl}/admin/billing" style="background-color: #ea580c; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Upgrade to a Paid Plan Now
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub SaaS. All rights reserved.
            </div>
        </div>
    `;
    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 6. Free trial expired and dashboard frozen
 */
export const sendTrialExpiredAndFrozenEmail = async ({ email, name, restaurantName, expiredDate, plan }) => {
    const formattedDate = expiredDate ? new Date(expiredDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently';
    const subject = `🔒 Free Trial Expired - Dashboard Frozen for ${restaurantName || 'Your Restaurant'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Free Trial Expired 🔒</h1>
                <p style="margin-top: 8px; opacity: 0.95; font-size: 14px;">Dashboard Features Have Been Frozen</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Restaurant Owner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Your 7-day free trial for <strong>${restaurantName || 'Your Restaurant'}</strong> has expired on <strong>${formattedDate}</strong>.
                </p>
                <div style="background-color: #fef2f2; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                    <p style="margin: 0; font-size: 13px; color: #991b1b;"><strong>Current Status:</strong> Dashboard Frozen</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #991b1b;">Operational features (POS, orders, KDS, inventory) are temporarily locked until a subscription plan is activated.</p>
                    <p style="margin: 6px 0 0 0; font-size: 13px; color: #166534;"><strong>Your Data is 100% Safe:</strong> None of your orders, menu items, or configurations have been deleted.</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Unlock your restaurant operations immediately by choosing one of our affordable subscription tiers:
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${portalBaseUrl}/admin/billing" style="background-color: #dc2626; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Select Plan & Unfreeze Dashboard
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub SaaS. All rights reserved.
            </div>
        </div>
    `;
    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 7. Paid subscription payment successful
 */
export const sendPaidSubscriptionSuccessEmail = async ({ email, name, restaurantName, plan, billingCycle, price, transactionId, expiryDate }) => {
    return await sendSubscriptionSuccessEmail({ email, name, restaurantName, plan, billingCycle, price, transactionId, expiryDate });
};

/**
 * 8. Dashboard access restored after successful payment
 */
export const sendDashboardAccessRestoredEmail = async ({ email, name, restaurantName, plan, validUntil }) => {
    const formattedValid = validUntil ? new Date(validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Next billing cycle';
    const subject = `🔓 Dashboard Access Restored - ${restaurantName || 'Your Restaurant'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Dashboard Unlocked! 🔓</h1>
                <p style="margin-top: 8px; opacity: 0.95; font-size: 14px;">Full Access Restored</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Welcome Back, ${name || 'Restaurant Owner'}!</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Your payment was successfully received and verified. All operational features for <strong>${restaurantName || 'Your Restaurant'}</strong> have been restored.
                </p>
                <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p style="margin: 0; font-size: 13px; color: #166534;"><strong>Plan:</strong> ${plan || 'Active Paid Plan'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #166534;"><strong>Valid Until:</strong> ${formattedValid}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #166534;"><strong>Operational Status:</strong> Fully Active & Unfrozen</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${portalBaseUrl}/admin" style="background-color: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Return to Operations
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub SaaS. All rights reserved.
            </div>
        </div>
    `;
    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 9. Super Admin manually freezes a restaurant
 */
export const sendManualFreezeEmail = async ({ email, name, restaurantName, freezeReason, frozenAt }) => {
    const formattedDate = frozenAt ? new Date(frozenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-US');
    const subject = `⚠️ Account Notice: Dashboard Manually Frozen - ${restaurantName || 'Your Restaurant'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #64748b 0%, #334155 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Account Notice: Access Frozen</h1>
                <p style="margin-top: 8px; opacity: 0.95; font-size: 14px;">Administrative Action Taken</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Restaurant Owner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Your restaurant dashboard access for <strong>${restaurantName || 'Your Restaurant'}</strong> has been temporarily frozen by a Super Admin on <strong>${formattedDate}</strong>.
                </p>
                <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #64748b; border: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Reason Provided:</strong> ${freezeReason || 'Administrative administrative review or compliance hold.'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;">All your restaurant data, configurations, and records remain completely intact.</p>
                </div>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Please contact our support desk or your dedicated administrator to resolve this hold.
                </p>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${portalBaseUrl}/admin/support" style="background-color: #334155; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Contact Platform Support
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub SaaS. All rights reserved.
            </div>
        </div>
    `;
    return await sendEmail({ to: email, toName: name, subject, html });
};

/**
 * 10. Super Admin manually unfreezes a restaurant
 */
export const sendManualUnfreezeEmail = async ({ email, name, restaurantName, plan, status }) => {
    const subject = `✅ Dashboard Unfrozen: Access Restored for ${restaurantName || 'Your Restaurant'}`;
    const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Dashboard Unfrozen ✅</h1>
                <p style="margin-top: 8px; opacity: 0.95; font-size: 14px;">Access Restored by Super Admin</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 12px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Hello ${name || 'Restaurant Owner'},</h2>
                <p style="color: #475569; line-height: 1.6; font-size: 14px;">
                    Great news! The administrative hold on <strong>${restaurantName || 'Your Restaurant'}</strong> has been lifted by a Super Admin.
                </p>
                <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                    <p style="margin: 0; font-size: 13px; color: #166534;"><strong>Plan:</strong> ${plan || 'Active'}</p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #166534;"><strong>Status:</strong> Active & Unrestricted</p>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${portalBaseUrl}/admin" style="background-color: #10b981; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                        Open Dashboard
                    </a>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; color: #94a3b8; font-size: 12px;">
                &copy; ${new Date().getFullYear()} Restaurant Hub SaaS. All rights reserved.
            </div>
        </div>
    `;
    return await sendEmail({ to: email, toName: name, subject, html });
};
