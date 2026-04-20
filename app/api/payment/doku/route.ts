import { NextRequest, NextResponse } from 'next/server';
import { getDokuConfig, generateDigest, generateSignature } from '@/lib/payments/doku';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { planId, planName, amount, userEmail } = body;

        if (!planId || !amount || !userEmail) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const config = getDokuConfig();
        const requestId = crypto.randomUUID();
        const timestamp = new Date().toISOString().split('.')[0] + 'Z';
        const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        console.log(`[DOKU_AUDIT] Initializing transaction for ${userEmail} | Plan: ${planName}`);

        const dokuBody = {
            order: {
                amount: amount,
                invoice_number: invoiceNumber,
                currency: 'IDR',
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://smartnotes.biz.id'}/dashboard?payment=check`,
                line_items: [
                    {
                        name: `Smart Notes ${planName} Access`,
                        price: amount,
                        quantity: 1
                    }
                ]
            },
            payment: {
                payment_due_date: 60 // 60 minutes
            },
            customer: {
                id: userEmail,
                name: userEmail.split('@')[0],
                email: userEmail
            }
        };

        console.log(`[DOKU_AUDIT] Constructing Payload for Identity: ${dokuBody.customer.email}`);

        const digest = generateDigest(dokuBody);
        const targetPath = '/checkout/v1/payment';
        const signature = generateSignature(
            config.clientId,
            requestId,
            timestamp,
            targetPath,
            digest,
            config.secretKey
        );

        const response = await fetch(`${config.apiUrl}${targetPath}`, {
            method: 'POST',
            headers: {
                'Client-Id': config.clientId,
                'Request-Id': requestId,
                'Request-Timestamp': timestamp,
                'Signature': signature,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dokuBody)
        });

        const data = await response.json();

        if (response.ok && data.response?.payment?.url) {
            // Log the payment attempt in Supabase
            const supabase = await createClient();
            await supabase.from('payment_notifications').insert({
                user_email: userEmail,
                invoice_number: invoiceNumber,
                amount: amount,
                currency: 'IDR',
                plan_name: planName,
                status: 'pending',
                checkout_url: data.response.payment.url
            });

            return NextResponse.json({ url: data.response.payment.url });
        } else {
            console.error('Doku API Error:', data);
            return NextResponse.json({ 
                error: 'Doku Integration Error', 
                details: data.message || 'Payment engine was unable to initialize segment.' 
            }, { status: response.status });
        }

    } catch (error: any) {
        console.error('Checkout Hub Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
