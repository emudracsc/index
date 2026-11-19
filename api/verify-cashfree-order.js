// =========================================================================
// 🚀 Vercel Serverless Function: Verify Cashfree Order Status
// Endpoint: GET or POST /api/verify-cashfree-order?order_id=...
// =========================================================================

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const query = req.query || {};
        let body = {};
        if (req.method === 'POST') {
            body = (typeof req.body === 'string') ? JSON.parse(req.body || '{}') : (req.body || {});
        }

        const orderId = query.order_id || body.order_id || query.cf_order_id || body.cf_order_id;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                error: 'order_id आवश्यक आहे.'
            });
        }

        const env = (query.env || body.env || process.env.CASHFREE_ENV || 'production').toLowerCase();
        const isSandbox = (env === 'sandbox');

        const appId = (process.env.CASHFREE_APP_ID || body.app_id || body.appId || '').trim();
        const secretKey = (process.env.CASHFREE_SECRET_KEY || body.secret_key || body.secretKey || '').trim();

        if (!appId || !secretKey) {
            return res.status(400).json({
                success: false,
                error: 'Cashfree App ID किंवा Secret Key मिळालेले नाहीत.'
            });
        }

        const apiBase = isSandbox
            ? `https://sandbox.cashfree.com/pg/orders/${encodeURIComponent(orderId)}`
            : `https://api.cashfree.com/pg/orders/${encodeURIComponent(orderId)}`;

        const cfResponse = await fetch(apiBase, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey
            }
        });

        const data = await cfResponse.json();

        if (!cfResponse.ok) {
            return res.status(cfResponse.status).json({
                success: false,
                error: data.message || 'ऑर्डर पडताळणी अयशस्वी.',
                details: data
            });
        }

        const isPaid = (data.order_status === 'PAID');

        return res.status(200).json({
            success: true,
            order_id: data.order_id,
            cf_order_id: data.cf_order_id,
            order_status: data.order_status,
            is_paid: isPaid,
            order_amount: data.order_amount,
            order_currency: data.order_currency
        });

    } catch (err) {
        console.error('Vercel Function Error in verify-cashfree-order:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'सर्व्हरवर अनपेक्षित त्रुटी आली.'
        });
    }
};
