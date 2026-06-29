/**
 * receiptTemplate.js
 * Generates the HTML used to produce the PDF receipt attachment.
 * Ported from IKEA Laravel receipt.blade.php → adapted for Adidas AWA.
 * Rendered to PDF via puppeteer (recommended) or html-pdf-node.
 *
 * @param {object} order  - Sequelize Order instance with OrderItems[].Variant.Product,
 *                          order.Address, order.User
 * @returns {string}      - Full HTML string to feed into your PDF renderer
 */
function receiptTemplate(order) {
    const user    = order.User    || {};
    const address = order.Address || {};
    const items   = order.OrderItems || [];

    const orderId   = String(order.id).padStart(6, '0');
    const orderDate = new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const printedAt = new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const status = order.status || 'pending';
    const fmt    = (n) => parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const subtotal   = parseFloat(order.total_amount) || 0;
    const shipping   = subtotal >= 3000 ? 0 : 150;
    const grandTotal = subtotal + shipping;

    const paymentLabels = {
        cod:           'Cash on Delivery',
        gcash:         'GCash',
        bank_transfer: 'Bank Transfer',
        card:          'Credit / Debit Card',
    };
    const paymentLabel = paymentLabels[order.payment_method] || (order.payment_method || 'N/A');

    const statusBadgeStyles = {
        pending:    'background:#f0f0f0;color:#111111;',
        processing: 'background:#e3f2fd;color:#1565c0;',
        completed:  'background:#e8f5e9;color:#2e7d32;',
        cancelled:  'background:#ffebee;color:#b71c1c;',
    };
    const paymentStatusStyles = {
        paid:    'background:#e8f5e9;color:#2e7d32;',
        unpaid:  'background:#ffebee;color:#b71c1c;',
        pending: 'background:#f0f0f0;color:#111111;',
    };
    const statusStyle  = statusBadgeStyles[status]                        || statusBadgeStyles.pending;
    const payStatusStyle = paymentStatusStyles[order.payment_status]      || paymentStatusStyles.pending;
    const statusLabel  = status.charAt(0).toUpperCase() + status.slice(1);
    const payStatusLabel = (order.payment_status || 'pending').charAt(0).toUpperCase() + (order.payment_status || 'pending').slice(1);

    /* ── Item rows ── */
    const itemRows = items.map(item => {
        const variant = item.Variant || {};
        const product = variant.Product || {};
        const price   = parseFloat(product.price || 0);
        return `
        <tr>
            <td>
                <div class="item-name">${product.name || 'Product'}</div>
                <div class="item-desc">${variant.colorway || ''} · ${variant.size_type || ''} ${variant.size_value || ''}</div>
            </td>
            <td class="right">₱${fmt(price)}</td>
            <td class="right">${item.quantity}</td>
            <td class="right">₱${fmt(price * item.quantity)}</td>
        </tr>`;
    }).join('');

    const cancelledWatermark = status === 'cancelled'
        ? `<div style="position:fixed;top:40%;left:10%;font-size:80px;font-weight:900;color:rgba(180,0,0,0.07);transform:rotate(-30deg);letter-spacing:8px;z-index:-1;">CANCELLED</div>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Receipt #${orderId} — Adidas AWA</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 13px;
            color: #111111;
            background: #ffffff;
        }

        /* HEADER */
        .header { background: #111111; color: white; padding: 28px 36px; }
        .header-inner { display: table; width: 100%; }
        .header-left  { display: table-cell; vertical-align: middle; }
        .header-right { display: table-cell; vertical-align: middle; text-align: right; }

        .logo-box {
            background: #ffffff;
            color: #111111;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 3px;
            padding: 5px 14px;
            display: inline-block;
            margin-bottom: 6px;
        }
        .header-company { font-size: 11px; color: rgba(255,255,255,0.6); letter-spacing: 0.5px; }
        .header-receipt-title { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .header-receipt-num   { font-size: 13px; color: rgba(255,255,255,0.7); margin-top: 4px; }

        /* BODY */
        .body { padding: 28px 36px; }

        /* INFO ROW */
        .info-row { display: table; width: 100%; margin-bottom: 24px; }
        .info-col { display: table-cell; width: 50%; vertical-align: top; padding-right: 16px; }
        .info-col.right-col { padding-right: 0; padding-left: 16px; text-align: right; }
        .info-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #767676;
            margin-bottom: 6px;
            border-bottom: 1.5px solid #e5e5e5;
            padding-bottom: 4px;
        }
        .info-line { font-size: 13px; line-height: 1.7; color: #333; }
        .info-line strong { color: #111; }

        /* BADGES */
        .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* ITEMS TABLE */
        .section-title {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #767676;
            border-bottom: 2px solid #111111;
            padding-bottom: 6px;
            margin-bottom: 0;
        }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th {
            background: #f5f5f0;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #767676;
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid #e5e5e5;
        }
        .items-table th.right { text-align: right; }
        .items-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; vertical-align: top; }
        .items-table td.right { text-align: right; }
        .item-name { font-weight: 700; font-size: 13px; color: #111; }
        .item-desc { font-size: 11px; color: #767676; margin-top: 2px; }

        /* TOTALS */
        .totals-wrap { display: table; width: 100%; margin-bottom: 24px; }
        .totals-spacer { display: table-cell; width: 55%; }
        .totals-box    { display: table-cell; width: 45%; }
        .totals-row    { display: table; width: 100%; padding: 5px 0; }
        .totals-label  { display: table-cell; font-size: 12px; color: #767676; }
        .totals-value  { display: table-cell; font-size: 12px; font-weight: 700; text-align: right; color: #111; }
        .totals-divider { border: none; border-top: 1.5px solid #e5e5e5; margin: 6px 0; }
        .totals-grand .totals-label { font-size: 14px; font-weight: 900; color: #111; }
        .totals-grand .totals-value { font-size: 16px; font-weight: 900; color: #111111; }

        /* PAYMENT */
        .payment-row {
            background: #f5f5f0;
            border-radius: 6px;
            padding: 12px 16px;
            margin-bottom: 24px;
            display: table;
            width: 100%;
        }
        .payment-left  { display: table-cell; vertical-align: middle; }
        .payment-right { display: table-cell; vertical-align: middle; text-align: right; }
        .payment-label { font-size: 11px; color: #767676; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        .payment-value { font-size: 13px; font-weight: 700; color: #111; margin-top: 2px; }

        /* FOOTER */
        .footer {
            border-top: 2px solid #e5e5e5;
            padding-top: 16px;
            text-align: center;
            color: #767676;
            font-size: 11px;
            line-height: 1.8;
        }
        .footer strong { color: #111; }
    </style>
</head>
<body>

${cancelledWatermark}

<!-- HEADER -->
<div class="header">
    <div class="header-inner">
        <div class="header-left">
            <div class="logo-box">ADIDAS</div>
            <div class="header-company">Adidas AWA · Official Receipt</div>
        </div>
        <div class="header-right">
            <div class="header-receipt-title">RECEIPT</div>
            <div class="header-receipt-num">#${orderId}</div>
        </div>
    </div>
</div>

<div class="body">

    <!-- ORDER + CUSTOMER INFO -->
    <div class="info-row">
        <div class="info-col">
            <div class="info-title">Bill To</div>
            <div class="info-line">
                <strong>${address.full_name || user.name || ''}</strong><br>
                ${address.street || ''}<br>
                ${address.city || ''}, ${address.province || ''} ${address.zip_code || ''}<br>
                ${address.phone || user.phone || ''}<br>
                ${user.email || ''}
            </div>
        </div>
        <div class="info-col right-col">
            <div class="info-title">Order Details</div>
            <div class="info-line">
                <strong>Date:</strong> ${orderDate}<br>
                <strong>Order #:</strong> ${orderId}<br>
                <strong>Status:</strong>
                <span class="badge" style="${statusStyle}">${statusLabel}</span><br>
                <strong>Payment:</strong>
                <span class="badge" style="${payStatusStyle}">${payStatusLabel}</span>
            </div>
        </div>
    </div>

    <!-- ITEMS -->
    <div class="section-title">Items Ordered</div>
    <table class="items-table">
        <thead>
            <tr>
                <th style="width:45%;">Product</th>
                <th class="right" style="width:18%;">Unit Price</th>
                <th class="right" style="width:12%;">Qty</th>
                <th class="right" style="width:25%;">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            ${itemRows}
        </tbody>
    </table>

    <!-- TOTALS -->
    <div class="totals-wrap">
        <div class="totals-spacer"></div>
        <div class="totals-box">
            <div class="totals-row">
                <div class="totals-label">Subtotal</div>
                <div class="totals-value">₱${fmt(subtotal)}</div>
            </div>
            <div class="totals-row">
                <div class="totals-label">Shipping Fee</div>
                <div class="totals-value">${shipping === 0 ? 'Free' : '₱' + fmt(shipping)}</div>
            </div>
            <hr class="totals-divider">
            <div class="totals-row totals-grand">
                <div class="totals-label">Total</div>
                <div class="totals-value">₱${fmt(grandTotal)}</div>
            </div>
        </div>
    </div>

    <!-- PAYMENT METHOD -->
    <div class="payment-row">
        <div class="payment-left">
            <div class="payment-label">Payment Method</div>
            <div class="payment-value">${paymentLabel}</div>
        </div>
        <div class="payment-right">
            <div class="payment-label">Payment Status</div>
            <div class="payment-value">
                <span class="badge" style="${payStatusStyle}">${payStatusLabel}</span>
            </div>
        </div>
    </div>

    ${order.notes ? `
    <div style="background:#f5f5f0;border-left:3px solid #111;padding:10px 14px;margin-bottom:24px;font-size:12px;color:#555;">
        <strong>Order Notes:</strong> ${order.notes}
    </div>` : ''}

    <!-- FOOTER -->
    <div class="footer">
        <strong>Thank you for shopping with Adidas AWA!</strong><br>
        For questions about your order, reply to this email.<br>
        This is an official receipt generated on ${printedAt}.<br>
        <br>
        © ${new Date().getFullYear()} Adidas AWA · All rights reserved
    </div>

</div>
</body>
</html>`;
}

module.exports = receiptTemplate;