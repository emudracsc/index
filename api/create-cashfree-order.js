// =========================================================================
// 🚀 Vercel Serverless Function: Create Cashfree Order
// Endpoint: POST /api/create-cashfree-order
// =========================================================================

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed. Please use POST.'
        });
    }

    try {
        const body = (typeof req.body === 'string') ? JSON.parse(req.body || '{}') : (req.body || {});

        // Determine environment: from request or Vercel environment variables
        const env = (body.env || process.env.CASHFREE_ENV || 'production').toLowerCase();
        const isSandbox = (env === 'sandbox');

        // Credentials from process.env (Vercel Project Settings) or fallback from request
        const appId = (process.env.CASHFREE_APP_ID || body.app_id || body.appId || '').trim();
        const secretKey = (process.env.CASHFREE_SECRET_KEY || body.secret_key || body.secretKey || '').trim();

        if (!appId || !secretKey) {
            return res.status(400).json({
                success: false,
                error: 'Cashfree App ID किंवा Secret Key मिळालेले नाहीत. कृपया Vercel Settings > Environment Variables मध्ये CASHFREE_APP_ID आणि CASHFREE_SECRET_KEY जोडा, किंवा पोर्टल सेटिंग्जमध्ये प्रविष्ट करा.'
            });
        }

        const rawAmount = parseFloat(body.order_amount || body.amount || '10');
        const orderAmount = (!isNaN(rawAmount) && rawAmount > 0) ? rawAmount : 10.00;
        const orderId = body.order_id || `ADH_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const customerName = (body.customer_name || 'Aadhaar Applicant').trim();
        let rawPhone = (body.customer_phone || body.phone || '9890869793').toString().replace(/\D/g, '');
        if (rawPhone.length < 10) rawPhone = '9890869793';
        const customerPhone = rawPhone.slice(-10);
        const customerEmail = (body.customer_email || 'citizen@emudracsc.in').trim();

        const returnUrl = body.return_url || `https://emudracsc.vercel.app/aadhaar-certificate.html?cf_order_id={order_id}`;

        const apiBase = isSandbox
            ? 'https://sandbox.cashfree.com/pg/orders'
            : 'https://api.cashfree.com/pg/orders';

        const cashfreePayload = {
            order_id: orderId,
            order_amount: orderAmount,
            order_currency: 'INR',
            customer_details: {
                customer_id: `CUST_${Date.now()}`,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_email: customerEmail
            },
            order_meta: {
                return_url: returnUrl
            },
            order_note: 'Aadhaar Certificate Form Filing Fee'
        };

        const cfResponse = await fetch(apiBase, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': appId,
                'x-client-secret': secretKey
            },
            body: JSON.stringify(cashfreePayload)
        });

        const data = await cfResponse.json();

        if (!cfResponse.ok) {
            console.error('Cashfree API error:', data);
            return res.status(cfResponse.status).json({
                success: false,
                error: data.message || 'Cashfree कडून ऑर्डर तयार करता आली नाही.',
                details: data
            });
        }

        return res.status(200).json({
            success: true,
            order_id: data.order_id || orderId,
            cf_order_id: data.cf_order_id,
            payment_session_id: data.payment_session_id,
            order_status: data.order_status,
            order_amount: data.order_amount,
            environment: env
        });

    } catch (err) {
        console.error('Vercel Function Error in create-cashfree-order:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'सर्व्हरवर अनपेक्षित त्रुटी आली.'
        });
    }
};
