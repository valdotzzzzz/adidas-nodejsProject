/**
 * sendOrderEmail.js
 * Drop-in replacement for sendOrderStatusEmail.js
 *
 * Two exported functions mirror the two Laravel Mailables:
 *   sendOrderConfirmationEmail(order)  ← called when order is first placed
 *   sendOrderStatusEmail(order)        ← called when admin updates order status
 *
 * Both expect `order` to be a fully-loaded Sequelize instance with:
 *   order.User
 *   order.Address
 *   order.OrderItems[].Variant.Product
 *
 * PDF generation uses html-pdf-node (install: npm install html-pdf-node)
 * You can swap it for puppeteer if you prefer.
 */

const transporter               = require('../config/mailer');
// Change these three lines in sendOrderEmail.js:
const orderConfirmationTemplate = require('./orderConfirmation');
const orderStatusTemplate       = require('./orderStatus');
const receiptTemplate           = require('./reciept');   // matches your filename

/* ── PDF helper ─────────────────────────────────────────── */
async function generatePdfBuffer(order) {
    // html-pdf-node is lightweight and works well for server-side PDF generation.
    // Run: npm install html-pdf-node
    const htmlPdf = require('html-pdf-node');
    const html    = receiptTemplate(order);

    const options = { format: 'A4', printBackground: true };
    const file    = { content: html };

    return htmlPdf.generatePdf(file, options); // returns a Buffer
}

/* ── Shared mailer ──────────────────────────────────────── */
async function buildAndSend({ order, subject, htmlBody, attachPdf = false }) {
    const user     = order.User || {};
    const orderId  = String(order.id).padStart(6, '0');
    const filename = `Adidas-AWA-Receipt-${orderId}.pdf`;

    const mailOptions = {
        from   : '"Adidas AWA" <no-reply@adidas-awa.com>',
        to     : user.email,
        subject,
        html   : htmlBody,
        attachments: [],
    };

    if (attachPdf) {
        const pdfBuffer = await generatePdfBuffer(order);
        mailOptions.attachments.push({
            filename,
            content    : pdfBuffer,
            contentType: 'application/pdf',
        });
    }

    return transporter.sendMail(mailOptions);
}

/* ── 1. Order Confirmation (on placement) ───────────────── */
async function sendOrderConfirmationEmail(order) {
    const orderId = String(order.id).padStart(6, '0');
    return buildAndSend({
        order,
        subject   : `Order Confirmed — #${orderId} | Adidas AWA`,
        htmlBody  : orderConfirmationTemplate(order),
        attachPdf : true,   // attach the PDF receipt on confirmation
    });
}

/* ── 2. Order Status Update (on admin change) ───────────── */
async function sendOrderStatusEmail(order) {
    const orderId     = String(order.id).padStart(6, '0');
    const statusLabel = (order.status || 'Updated').charAt(0).toUpperCase() + (order.status || '').slice(1);
    return buildAndSend({
        order,
        subject   : `Your Order #${orderId} has been ${statusLabel} | Adidas AWA`,
        htmlBody  : orderStatusTemplate(order),
        attachPdf : false,  // no PDF on status updates, matching IKEA pattern
    });
}

module.exports = { sendOrderConfirmationEmail, sendOrderStatusEmail };