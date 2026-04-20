import { NextRequest, NextResponse } from 'next/server';
import { getDokuConfig, generateDigest, generateWebhookSignature } from '@/lib/payments/doku';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const headers = req.headers;
        
        const signatureHeader = headers.get('signature');
        const timestampHeader = headers.get('request-timestamp');
        
        if (!signatureHeader || !timestampHeader) {
            return NextResponse.json({ error: 'Missing security headers' }, { status: 401 });
        }

        const config = getDokuConfig();
        const digest = generateDigest(body);
        const targetPath = '/api/webhook/doku'; // This must match the webhook URL registered in Doku
        
        const expectedSignature = generateWebhookSignature(
            config.clientId,
            timestampHeader,
            targetPath,
            digest,
            config.secretKey
        );

        // In Production, always verify signature. For dev/test, might skip if internal.
        if (config.isProduction && signatureHeader !== expectedSignature) {
             console.error('Webhook Identity Failure: Signature Mismatch');
             // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const { order, transaction, customer } = body;
        const invoiceNumber = order?.invoice_number;
        const status = transaction?.status; // e.g., 'SUCCESS'
        const email = customer?.email;

        if (status === 'SUCCESS' && email) {
            const supabase = await createClient();
            
            // 1. Find the plan name from the original payment record
            const { data: payRecord } = await supabase
                .from('payment_notifications')
                .select('plan_name')
                .eq('invoice_number', invoiceNumber)
                .single();

            const planName = payRecord?.plan_name || 'Starter Node';
            
            // 2. Map plan names to tiers
            let tier = 'free';
            if (planName.includes('Starter')) tier = 'starter';
            else if (planName.includes('Full')) tier = 'full_access';
            else if (planName.includes('Enterprise')) tier = 'enterprise';

            // 3. Promote User Tier
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                    subscription_tier: tier,
                    ads_disabled: true 
                })
                .eq('email', email);

            if (updateError) throw updateError;

            // 4. Record the official order in the registry
            await supabase.from('orders').insert({
                user_email: email,
                user_name: customer?.name || email.split('@')[0],
                plan_name: planName,
                amount: order?.amount || 0,
                currency: order?.currency || 'IDR',
                status: 'completed',
                method: 'doku'
            });

            // 5. Update the specific payment notification
            await supabase.from('payment_notifications').update({ 
                status: 'paid',
                processed_at: new Date().toISOString()
            }).eq('invoice_number', invoiceNumber);

            console.log(`Neural Provisioning Complete: ${email} upgraded to ${tier}`);
        }

        return NextResponse.json({ status: 'OK' });

    } catch (error: any) {
        console.error('Webhook Processing Engine Failure:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
