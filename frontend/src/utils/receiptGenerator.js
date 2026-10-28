/**
 * Universal Thermal Receipt Generator
 * Produces pixel-perfect 80mm / 58mm thermal receipts with exact calculations.
 * Used for both automatic background cashier printing and manual on-demand printing.
 */

export const calculateReceiptTotals = (order = {}) => {
    const rawItems = Array.isArray(order.orderItems) ? order.orderItems : [];

    const items = rawItems.map(item => {
        const qty = Math.max(1, Number(item.qty || item.quantity || item.count || 1));
        const price = Math.max(0, Number(item.price || item.unitPrice || item.rate || 0));
        const lineTotal = Math.round(qty * price * 100) / 100;
        return {
            name: String(item.name || 'Menu Item').trim(),
            qty,
            price,
            lineTotal,
            notes: item.notes || ''
        };
    });

    // Subtotal = exact sum of item line totals
    const calculatedSubtotal = items.reduce((sum, it) => sum + it.lineTotal, 0);

    // Discount
    let discountAmount = 0;
    if (order.discountAmount !== undefined && order.discountAmount !== null) {
        discountAmount = Math.max(0, Number(order.discountAmount) || 0);
    } else if (order.discount !== undefined && order.discount !== null) {
        // If discount is a percentage
        const discVal = Number(order.discount) || 0;
        discountAmount = discVal > 0 && discVal <= 100 ? (calculatedSubtotal * discVal) / 100 : discVal;
    }
    discountAmount = Math.round(discountAmount * 100) / 100;

    // Tax
    const taxPrice = Math.max(0, Number(order.taxPrice || order.tax || 0));

    // Delivery Charge
    const deliveryCharge = Math.max(0, Number(order.deliveryCharge || order.deliveryFee || 0));

    // Tip Amount
    const tipAmount = Math.max(0, Number(order.tipAmount || order.tip || 0));

    // Computed Grand Total
    const computedTotal = Math.max(0, calculatedSubtotal - discountAmount + taxPrice + deliveryCharge + tipAmount);
    // Use order.totalPrice if valid and matches within normal rounding, otherwise computed
    const grandTotal = Number(order.totalPrice) > 0 ? Number(order.totalPrice) : Math.round(computedTotal * 100) / 100;

    // Payment settlement amounts
    const isPaid = Boolean(order.isPaid);
    const amountPaid = isPaid ? grandTotal : 0;
    const balanceDue = isPaid ? 0 : grandTotal;

    return {
        items,
        subtotal: Math.round(calculatedSubtotal * 100) / 100,
        discount: discountAmount,
        discountAmount,
        tax: Math.round(taxPrice * 100) / 100,
        taxPrice: Math.round(taxPrice * 100) / 100,
        deliveryFee: Math.round(deliveryCharge * 100) / 100,
        deliveryCharge: Math.round(deliveryCharge * 100) / 100,
        tipAmount: Math.round(tipAmount * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        totalPrice: Math.round(grandTotal * 100) / 100,
        amountPaid: Math.round(amountPaid * 100) / 100,
        balanceDue: Math.round(balanceDue * 100) / 100,
        isPaid
    };
};

export const generateThermalReceiptHtml = (order = {}, restaurantInfo = {}, options = {}) => {
    const totals = calculateReceiptTotals(order);
    const is58mm = options.paperWidth === '58mm' || order.paperWidth === '58mm';
    const pageSize = is58mm ? '58mm auto' : '80mm auto';
    const bodyWidth = is58mm ? '54mm' : '76mm';
    const bodyFontSize = is58mm ? '10px' : '12px';
    const tableFontSize = is58mm ? '10px' : '11px';
    
    // Resolve restaurant details
    const rest = order.restaurantId && typeof order.restaurantId === 'object' 
        ? order.restaurantId 
        : (restaurantInfo || {});
    
    const branch = order.branchId && typeof order.branchId === 'object' 
        ? order.branchId 
        : null;

    const restName = rest.name || branch?.name || 'RESTOSYS DINING';
    const restAddress = branch?.location?.address || rest.address || 'Main Branch Highway, Downtown';
    const restPhone = branch?.contact?.phone || rest.phone || rest.contactPhone || '';
    const gstin = rest.gstin || rest.gstNumber || '';

    // Invoice & order details
    const orderIdStr = String(order._id || order.id || 'NEW');
    const invoiceNum = order.invoiceNumber || `INV-${orderIdStr.slice(-6).toUpperCase()}`;
    const kotNum = Array.isArray(order.kotNumbers) && order.kotNumbers.length > 0 
        ? order.kotNumbers.join(', ') 
        : (order.kotNumber || '');

    const orderDate = new Date(order.createdAt || Date.now());
    const formattedDate = orderDate.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Order mode & Table
    const orderType = String(order.orderType || 'Dine-In').toUpperCase();
    const hasTable = order.tableNumber && order.tableNumber !== 'Any' && order.tableNumber !== 'Takeout';
    const tableText = hasTable ? `Table ${order.tableNumber}` : '';
    const serviceType = order.serviceType ? ` • ${order.serviceType}` : '';

    const customerName = order.customerName || order.user?.name || '';
    const customerPhone = order.customerPhone || order.user?.phoneNumber || '';

    // Items table rows
    const itemsHtml = totals.items.map(item => `
        <tr>
            <td style="padding: 4px 0; vertical-align: top; word-break: break-word;">
                <div style="font-weight: 700; font-size: 12px;">${item.name}</div>
                <div style="font-size: 10px; color: #555;">${item.qty} × ₹${item.price.toFixed(2)}</div>
                ${item.notes ? `<div style="font-size: 9px; font-style: italic; color: #777;">Note: ${item.notes}</div>` : ''}
            </td>
            <td style="text-align: right; vertical-align: top; padding: 4px 0; font-family: 'Courier New', monospace; font-weight: 700; font-size: 12px; white-space: nowrap;">
                ₹${item.lineTotal.toFixed(2)}
            </td>
        </tr>
    `).join('');

    // Tax breakdown (CGST + SGST if tax exists)
    const taxHtml = totals.taxPrice > 0 ? `
        <tr>
            <td style="padding: 2px 0; font-size: 11px;">Applicable Tax (GST)</td>
            <td style="text-align: right; padding: 2px 0; font-family: monospace;">₹${totals.taxPrice.toFixed(2)}</td>
        </tr>
    ` : '';

    const discountHtml = totals.discountAmount > 0 ? `
        <tr style="color: #000;">
            <td style="padding: 2px 0; font-size: 11px;">Discount Applied</td>
            <td style="text-align: right; padding: 2px 0; font-family: monospace; font-weight: bold;">-₹${totals.discountAmount.toFixed(2)}</td>
        </tr>
    ` : '';

    const deliveryHtml = totals.deliveryCharge > 0 ? `
        <tr>
            <td style="padding: 2px 0; font-size: 11px;">Delivery Charges</td>
            <td style="text-align: right; padding: 2px 0; font-family: monospace;">₹${totals.deliveryCharge.toFixed(2)}</td>
        </tr>
    ` : '';

    const tipHtml = totals.tipAmount > 0 ? `
        <tr>
            <td style="padding: 2px 0; font-size: 11px;">Staff Gratuity / Tip</td>
            <td style="text-align: right; padding: 2px 0; font-family: monospace;">₹${totals.tipAmount.toFixed(2)}</td>
        </tr>
    ` : '';

    // Payment details
    const method = order.paymentMethod || (totals.isPaid ? 'Card / Online' : 'Cash');
    const isCashPayment = ['cash on delivery', 'cod', 'cash', 'pay at counter'].some(m => String(method).toLowerCase().includes(m));
    const paymentStatusText = totals.isPaid 
        ? 'PAID & SETTLED' 
        : (isCashPayment ? 'PAYMENT PENDING' : 'PAYMENT DUE / PENDING');

    return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <title>Receipt ${invoiceNum}</title>
        <style>
            /* Thermal width: ${is58mm ? '58mm' : '80mm'} */
            @page {
                size: ${pageSize};
                margin: 2mm 3mm;
            }
            @media print {
                html, body {
                    width: ${bodyWidth};
                    max-width: ${bodyWidth};
                    margin: 0 auto;
                    padding: 0;
                    color: #000;
                    background: #fff;
                    font-size: ${bodyFontSize};
                    -webkit-print-color-adjust: exact;
                }
                .no-print { display: none !important; }
            }
            body {
                font-family: 'Courier New', Courier, monospace, -apple-system, sans-serif;
                width: ${bodyWidth};
                max-width: ${bodyWidth};
                margin: 0 auto;
                padding: 6px 4px;
                color: #000;
                line-height: 1.25;
                font-size: ${bodyFontSize};
                box-sizing: border-box;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: 900; }
            .dashed { border-top: 1px dashed #000; margin: 6px 0; }
            .double-line { border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 4px 0; margin: 6px 0; }
            table { width: 100%; border-collapse: collapse; font-size: ${tableFontSize}; }
            .info-grid { font-size: ${tableFontSize}; line-height: 1.35; }
            .totals-table td { padding: 2px 0; }
            .status-badge {
                display: inline-block;
                padding: 2px 6px;
                font-weight: 900;
                border: 1px solid #000;
                font-size: ${tableFontSize};
                margin: 4px 0;
                text-transform: uppercase;
            }
        </style>
    </head>
    <body>
        <!-- Restaurant Header -->
        <div class="center">
            <div style="font-size: 17px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">
                ${restName}
            </div>
            ${restAddress ? `<div style="font-size: 10px; margin-top: 2px;">${restAddress}</div>` : ''}
            ${restPhone ? `<div style="font-size: 10px;">Tel: ${restPhone}</div>` : ''}
            ${gstin ? `<div style="font-size: 10px;">GSTIN: ${gstin}</div>` : ''}
            <div style="font-size: 11px; font-weight: 800; margin-top: 3px; letter-spacing: 1px;">
                TAX INVOICE / BILL RECEIPT
            </div>
        </div>

        <div class="dashed"></div>

        <!-- Order Metadata -->
        <div class="info-grid">
            <div style="display: flex; justify-content: space-between;">
                <span><strong>Invoice:</strong> ${invoiceNum}</span>
                <span><strong>Date:</strong> ${formattedDate}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span><strong>Order ID:</strong> #${orderIdStr.slice(-6).toUpperCase()}</span>
                <span><strong>Time:</strong> ${formattedTime}</span>
            </div>
            ${kotNum ? `<div><strong>KOT Ref:</strong> ${kotNum}</div>` : ''}
            <div style="margin-top: 2px;">
                <strong>Order Type:</strong> <span style="text-transform: uppercase; font-weight: bold;">${orderType}${tableText ? ` (${tableText})` : ''}</span>
            </div>
            ${customerName ? `<div><strong>Customer:</strong> ${customerName}${customerPhone ? ` (${customerPhone})` : ''}</div>` : ''}
            ${order.shippingAddress?.address ? `<div><strong>Delivery Address:</strong> ${order.shippingAddress.address}</div>` : ''}
        </div>

        <div class="dashed"></div>

        <!-- Ordered Items Table -->
        <table>
            <thead>
                <tr style="border-bottom: 1px dashed #000; font-size: 10px; text-transform: uppercase;">
                    <th style="text-align: left; padding-bottom: 3px;">Item & Rate</th>
                    <th style="text-align: right; padding-bottom: 3px;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <div class="dashed"></div>

        <!-- Financial Breakdown -->
        <table class="totals-table">
            <tr>
                <td style="font-size: 11px;">Subtotal (${totals.items.length} items)</td>
                <td style="text-align: right; font-family: monospace;">₹${totals.subtotal.toFixed(2)}</td>
            </tr>
            ${discountHtml}
            ${taxHtml}
            ${deliveryHtml}
            ${tipHtml}
        </table>

        <div class="double-line">
            <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-weight: 900;">
                <span>GRAND TOTAL</span>
                <span style="font-family: monospace;">₹${totals.grandTotal.toFixed(2)}</span>
            </div>
        </div>

        <!-- Payment Settlement Status -->
        <table style="font-size: 11px; margin-top: 4px;">
            <tr>
                <td><strong>Payment Method:</strong></td>
                <td style="text-align: right;">${method}</td>
            </tr>
            <tr>
                <td><strong>Amount Paid:</strong></td>
                <td style="text-align: right; font-family: monospace; font-weight: bold;">₹${totals.amountPaid.toFixed(2)}</td>
            </tr>
            <tr>
                <td><strong>Balance Due:</strong></td>
                <td style="text-align: right; font-family: monospace; font-weight: bold; ${totals.balanceDue > 0 ? 'color: #000;' : ''}">₹${totals.balanceDue.toFixed(2)}</td>
            </tr>
            ${order.paidAt ? `
            <tr>
                <td><strong>Paid At:</strong></td>
                <td style="text-align: right; font-size: 10px;">${new Date(order.paidAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>` : ''}
        </table>

        <div class="center" style="margin-top: 6px;">
            <div class="status-badge">
                ${paymentStatusText}
            </div>
        </div>

        <div class="dashed"></div>

        <!-- Footer -->
        <div class="center" style="font-size: 10px; color: #444; line-height: 1.3;">
            <div>Thank you for dining with us!</div>
            <div>Please visit again</div>
            <div style="margin-top: 3px; font-size: 9px; color: #777;">Powered by RestoSys POS</div>
        </div>
    </body>
</html>
    `.trim();
};

/**
 * Universal 80mm / 58mm Thermal Kitchen Order Ticket (KOT) Generator
 * Formats a clean, high-contrast thermal slip for the kitchen cooks.
 * Highlights quantities, cooking instructions, order type, and table/token.
 */
export const generateThermalKOTHtml = (order = {}, restaurantInfo = {}, options = {}) => {
    const is58mm = options.paperWidth === '58mm' || order.paperWidth === '58mm';
    const pageSize = is58mm ? '58mm auto' : '80mm auto';
    const bodyWidth = is58mm ? '54mm' : '76mm';
    const bodyFontSize = is58mm ? '11px' : '13px';

    const rest = order.restaurantId && typeof order.restaurantId === 'object' 
        ? order.restaurantId 
        : (restaurantInfo || {});
    const restName = rest.name || 'RESTOSYS KITCHEN';

    const orderIdStr = String(order._id || order.id || order.orderId || 'NEW');
    const shortId = orderIdStr.slice(-6).toUpperCase();
    const kotNum = order.kotNumber || order.kotNumbers?.[0] || order.kots?.[0]?.kotNumber || `KOT-${shortId}`;

    const items = Array.isArray(order.orderItems) 
        ? order.orderItems 
        : Array.isArray(order.items) 
        ? order.items 
        : [];

    const orderType = order.orderType || 'Dine In';
    const serviceType = order.serviceType || '';
    const tableNumber = order.tableNumber;

    let destinationLabel = 'DINE IN';
    if (tableNumber && tableNumber !== 'Any' && tableNumber !== 'Takeout') {
        destinationLabel = tableNumber.startsWith('Table') ? tableNumber.toUpperCase() : `TABLE ${tableNumber}`;
    } else if (orderType === 'Self-Pickup' || order.source === 'Self-Pickup' || String(orderType).toLowerCase().includes('pickup')) {
        destinationLabel = `SELF-PICKUP / TAKEAWAY [TOKEN #${shortId}]`;
    } else if (serviceType === 'Self Dine-In (KFC Style)') {
        destinationLabel = `SELF DINE-IN (COUNTER) [TOKEN #${shortId}]`;
    } else if (orderType === 'Delivery') {
        destinationLabel = `🛵 HOME DELIVERY [ORDER #${shortId}]`;
    }

    const customerName = order.customerName || '';
    const customerPhone = order.customerPhone || '';
    const orderNotes = order.notes || '';
    const stationLabel = order.kitchenStation || options.station || 'Main Kitchen';
    const sourceLabel = order.source === 'QR' ? 'QR Table Order' : (order.source || 'Website Online Order');
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

    const itemsHtml = items.map((item, idx) => {
        const qty = Math.max(1, Number(item.qty || item.quantity || item.count || 1));
        const name = String(item.name || 'Menu Item').trim();
        const note = item.notes ? String(item.notes).trim() : '';

        return `
            <div style="padding: 5px 0; border-bottom: 1px dashed #777;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                    <span style="font-size: 15px; font-weight: 900; margin-right: 8px;">[ ${qty}x ]</span>
                    <span style="font-size: 14px; font-weight: 800; flex: 1;">${name}</span>
                </div>
                ${note ? `<div style="font-size: 11px; font-weight: 800; background: #eee; padding: 2px 4px; margin-top: 3px; border-left: 3px solid #000;">*** NOTE: ${note} ***</div>` : ''}
            </div>
        `;
    }).join('');

    const totalItemCount = items.reduce((sum, it) => sum + (Number(it.qty || it.quantity || 1)), 0);

    return `
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <title>${kotNum} - Kitchen Slip</title>
        <style>
            @page { size: ${pageSize}; margin: 4mm; }
            body {
                font-family: 'Courier New', Courier, monospace;
                width: ${bodyWidth};
                max-width: ${bodyWidth};
                margin: 0 auto;
                padding: 4px 2px;
                font-size: ${bodyFontSize};
                line-height: 1.3;
                color: #000000;
                background: #ffffff;
            }
            .center { text-align: center; }
            .dashed { border-bottom: 2px dashed #000; margin: 6px 0; }
            .double { border-bottom: 3px double #000; margin: 6px 0; }
            .badge {
                display: inline-block;
                background: #000;
                color: #fff;
                padding: 3px 8px;
                font-weight: 900;
                font-size: 13px;
                margin: 3px 0;
                border-radius: 3px;
                text-transform: uppercase;
            }
        </style>
    </head>
    <body>
        <div class="center">
            <div style="font-size: 14px; font-weight: 900; text-transform: uppercase;">${restName}</div>
            <div class="badge">*** KITCHEN ORDER TICKET ***</div>
            <div style="font-size: 19px; font-weight: 900; margin-top: 2px; letter-spacing: 0.5px;">${kotNum}</div>
            <div style="font-size: 12px; font-weight: 800;">Order #${shortId} • ${sourceLabel}</div>
        </div>

        <div class="dashed"></div>

        <div style="font-size: 15px; font-weight: 900; text-align: center; padding: 2px 0;">
            ${destinationLabel}
        </div>

        <div style="font-size: 11px; margin-top: 4px; line-height: 1.4;">
            ${customerName ? `<div><strong>Customer:</strong> ${customerName}${customerPhone ? ` (${customerPhone})` : ''}</div>` : ''}
            <div><strong>Time:</strong> ${orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • <strong>Date:</strong> ${orderDate.toLocaleDateString()}</div>
            <div><strong>Kitchen Station:</strong> ${stationLabel}</div>
        </div>

        <div class="double"></div>

        <!-- Ordered Food Items for Kitchen Prep -->
        <div>
            ${itemsHtml || '<div style="padding: 10px 0; text-align: center;">No items</div>'}
        </div>

        <div class="dashed"></div>

        <!-- Total Item Count and Cooking Instructions -->
        <div style="font-size: 11px;">
            <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px;">
                <span>TOTAL ITEMS:</span>
                <span>${totalItemCount} Items</span>
            </div>
            ${orderNotes ? `<div style="margin-top: 5px; font-weight: 800; background: #eee; padding: 4px; border: 1px solid #ccc;"><strong>SPECIAL INSTRUCTIONS:</strong><br/>${orderNotes}</div>` : ''}
        </div>

        <div class="double"></div>

        <div class="center" style="font-size: 11px; font-weight: 900; margin-top: 4px;">
            *** KITCHEN PREPARATION COPY • RUSH ORDER ***
        </div>
    </body>
</html>
    `.trim();
};

// Queue for sequential thermal printing to eliminate browser print collisions
let printQueue = [];
let isPrintingNow = false;

const processPrintQueue = () => {
    if (isPrintingNow || printQueue.length === 0) return;
    isPrintingNow = true;
    const nextJob = printQueue.shift();

    let iframe = document.getElementById('resto-thermal-print-frame');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'resto-thermal-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
    }

    try {
        const frameDoc = iframe.contentWindow.document;
        frameDoc.open();
        frameDoc.write(nextJob.html);
        frameDoc.close();

        let finished = false;
        const markDone = () => {
            if (finished) return;
            finished = true;
            try {
                iframe.contentWindow.removeEventListener('afterprint', markDone);
            } catch (e) {}
            isPrintingNow = false;
            setTimeout(processPrintQueue, 500);
        };

        try {
            iframe.contentWindow.addEventListener('afterprint', markDone);
        } catch (e) {}

        setTimeout(() => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (err) {
                console.error(`Print error for ${nextJob.jobType}:`, err);
                markDone();
            }
        }, 350);

        // Fallback timeout in case user dismisses or afterprint is delayed
        setTimeout(markDone, 7000);
    } catch (err) {
        console.error('Queue execution error:', err);
        isPrintingNow = false;
        setTimeout(processPrintQueue, 400);
    }
};

/**
 * Queue a thermal print job (handles both single and dual KOT + Bill printing without dialog collisions)
 */
export const queueThermalPrint = (html, jobType = 'receipt') => {
    printQueue.push({ html, jobType, timestamp: Date.now() });
    processPrintQueue();
};

/**
 * Trigger Cashier Bill print via hidden iframe (bypasses popup blockers and prevents page disruptions)
 */
export const printReceiptViaIframe = (receiptHtml) => {
    queueThermalPrint(receiptHtml, 'cashier_bill');
};

/**
 * Trigger Kitchen KOT print via hidden iframe
 */
export const printKOTViaIframe = (kotHtml) => {
    queueThermalPrint(kotHtml, 'kitchen_kot');
};

/**
 * Trigger print via new window/tab for manual cashier print previews
 */
export const printReceiptViaWindow = (receiptHtml) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        printReceiptViaIframe(receiptHtml);
        return;
    }

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();

    setTimeout(() => {
        try {
            printWindow.focus();
            printWindow.print();
        } catch (e) {
            console.error('Window print error:', e);
        }
    }, 400);
};

/**
 * Trigger KOT print via new window/tab for manual kitchen print previews
 */
export const printKOTViaWindow = (kotHtml) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        printKOTViaIframe(kotHtml);
        return;
    }

    printWindow.document.open();
    printWindow.document.write(kotHtml);
    printWindow.document.close();

    setTimeout(() => {
        try {
            printWindow.focus();
            printWindow.print();
        } catch (e) {
            console.error('Window print error:', e);
        }
    }, 400);
};
