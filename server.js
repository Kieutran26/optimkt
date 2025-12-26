import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.VITE_BASE_URL || `http://localhost:${PORT}`;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Resend
const resend = new Resend(process.env.VITE_RESEND_API_KEY);

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// ================== TRACKING ENDPOINTS ==================

// 1x1 transparent pixel for email open tracking
const TRACKING_PIXEL = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
);

// Email open tracking pixel
app.get('/api/track/open/:campaignId/:subscriberId', async (req, res) => {
    const { campaignId, subscriberId } = req.params;

    try {
        // Check if already opened
        const { data: existingEvent } = await supabase
            .from('email_events')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('subscriber_id', subscriberId)
            .eq('event_type', 'opened')
            .limit(1)
            .single();

        const isUnique = !existingEvent;

        // Record open event
        await supabase.from('email_events').insert({
            campaign_id: campaignId,
            subscriber_id: subscriberId,
            event_type: 'opened'
        });

        // Update analytics
        const { data: analytics } = await supabase
            .from('campaign_analytics')
            .select('*')
            .eq('campaign_id', campaignId)
            .single();

        if (analytics) {
            const updates = {
                total_opened: (analytics.total_opened || 0) + 1,
                updated_at: new Date().toISOString()
            };

            // If unique, increment unique_opened (if column exists, otherwise we rely on future recounts)
            // We'll optimistically try to update unique_opened. If it fails, Supabase ignores generic object props usually? 
            // Better: use rpc or just standard update. For now, let's assume valid schema.
            if (isUnique) {
                updates.unique_opened = (analytics.unique_opened || 0) + 1;
            } else {
                updates.unique_opened = analytics.unique_opened || analytics.total_opened; // Fallback
            }

            // Calculate Rate based on UNIQUE opens if available, else standard
            const openCount = isUnique ? updates.unique_opened : analytics.unique_opened;
            const openRate = analytics.total_sent > 0
                ? Math.round((openCount / analytics.total_sent) * 10000) / 100
                : 0;

            updates.open_rate = openRate;

            await supabase
                .from('campaign_analytics')
                .update(updates)
                .eq('campaign_id', campaignId);
        }

        console.log(`📬 Email opened: campaign=${campaignId}, subscriber=${subscriberId}, unique=${isUnique}`);
    } catch (err) {
        console.error('Error tracking open:', err);
    }

    // Return 1x1 transparent GIF
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(TRACKING_PIXEL);
});

// Click tracking with redirect
app.get('/api/track/click/:campaignId/:subscriberId', async (req, res) => {
    const { campaignId, subscriberId } = req.params;
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('Missing URL');
    }

    try {
        // Check if already clicked this link
        const { data: existingEvent } = await supabase
            .from('email_events')
            .select('id')
            .eq('campaign_id', campaignId)
            .eq('subscriber_id', subscriberId)
            .eq('event_type', 'clicked')
            .limit(1)
            .single();

        const isUnique = !existingEvent; // Count unique as distinct subscriber clicking ANY link

        // Record click event
        await supabase.from('email_events').insert({
            campaign_id: campaignId,
            subscriber_id: subscriberId,
            event_type: 'clicked',
            link_url: url
        });

        // Update analytics
        const { data: analytics } = await supabase
            .from('campaign_analytics')
            .select('*')
            .eq('campaign_id', campaignId)
            .single();

        if (analytics) {
            const updates = {
                total_clicked: (analytics.total_clicked || 0) + 1,
                updated_at: new Date().toISOString()
            };

            if (isUnique) {
                updates.unique_clicked = (analytics.unique_clicked || 0) + 1;
            } else {
                updates.unique_clicked = analytics.unique_clicked || analytics.total_clicked;
            }

            const clickCount = isUnique ? updates.unique_clicked : analytics.unique_clicked;
            const clickRate = analytics.total_opened > 0
                ? Math.round((clickCount / analytics.total_opened) * 10000) / 100
                : 0;

            updates.click_rate = clickRate;

            await supabase
                .from('campaign_analytics')
                .update(updates)
                .eq('campaign_id', campaignId);
        }

        console.log(`🖱️ Link clicked: campaign=${campaignId}, subscriber=${subscriberId}, url=${url}, unique=${isUnique}`);
    } catch (err) {
        console.error('Error tracking click:', err);
    }

    // Redirect to actual URL
    res.redirect(decodeURIComponent(url));
});

// Unsubscribe endpoint
app.get('/api/unsubscribe/:campaignId/:subscriberId', async (req, res) => {
    const { campaignId, subscriberId } = req.params;

    try {
        // Record unsubscribe event
        await supabase.from('email_events').insert({
            campaign_id: campaignId,
            subscriber_id: subscriberId,
            event_type: 'unsubscribed'
        });

        // Update subscriber status
        await supabase
            .from('subscribers')
            .update({ status: 'unsubscribed' })
            .eq('id', subscriberId);

        // Update analytics (simple increment)
        const { data: analytics } = await supabase
            .from('campaign_analytics')
            .select('*')
            .eq('campaign_id', campaignId)
            .single();

        if (analytics) {
            await supabase
                .from('campaign_analytics')
                .update({
                    total_unsubscribed: (analytics.total_unsubscribed || 0) + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('campaign_id', campaignId);
        }

        console.log(`🚫 Unsubscribed: campaign=${campaignId}, subscriber=${subscriberId}`);
    } catch (err) {
        console.error('Error handling unsubscribe:', err);
    }

    // Return simple HTML confirmation
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Đã hủy đăng ký</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f9fafb; color: #111827; }
                .card { background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); max-width: 400px; text-align: center; }
                h1 { margin-bottom: 1rem; font-size: 1.5rem; }
                p { color: #6b7280; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Đã hủy đăng ký</h1>
                <p>Bạn đã hủy đăng ký nhận email thành công. Chúng tôi rất tiếc khi phải chia tay bạn.</p>
            </div>
        </body>
        </html>
    `);
});

// ================== EMAIL ENDPOINTS ==================

// Send single email
app.post('/api/email/send', async (req, res) => {
    try {
        const { to, subject, html, from, replyTo } = req.body;

        if (!to || !subject || !html) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const { data, error } = await resend.emails.send({
            from: from || 'Campaign <onboarding@resend.dev>',
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            replyTo
        });

        if (error) {
            console.error('Resend error:', error);
            return res.status(400).json({ success: false, error: error.message });
        }

        res.json({ success: true, id: data?.id });
    } catch (err) {
        console.error('Email send error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Send campaign (batch emails) with tracking
app.post('/api/email/campaign', async (req, res) => {
    try {
        const { campaignId, subject, html, fromName, fromEmail, replyTo, subscribers } = req.body;

        if (!subject || !html || !subscribers || subscribers.length === 0) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const results = [];
        let sentCount = 0;
        let failedCount = 0;

        // Send emails one by one with tracking
        for (const sub of subscribers) {
            try {
                // Personalize content
                let personalizedSubject = subject
                    .replace(/\{\{firstName\}\}/g, sub.firstName || '')
                    .replace(/\{\{lastName\}\}/g, sub.lastName || '')
                    .replace(/\{\{email\}\}/g, sub.email);

                let personalizedHtml = html
                    .replace(/\{\{firstName\}\}/g, sub.firstName || '')
                    .replace(/\{\{lastName\}\}/g, sub.lastName || '')
                    .replace(/\{\{email\}\}/g, sub.email);

                // Add tracking pixel for open tracking (if campaignId provided)
                if (campaignId && sub.id) {
                    const trackingPixel = `<img src="${BASE_URL}/api/track/open/${campaignId}/${sub.id}" width="1" height="1" style="display:none" alt="" />`;
                    personalizedHtml = personalizedHtml.replace('</body>', `${trackingPixel}</body>`);

                    // If no </body>, append at end
                    if (!personalizedHtml.includes(trackingPixel)) {
                        personalizedHtml += trackingPixel;
                    }

                    // Wrap links for click tracking
                    personalizedHtml = personalizedHtml.replace(
                        /href="(https?:\/\/[^"]+)"/g,
                        (match, url) => {
                            if (url.includes('unsubscribe')) return match; // Don't track unsubscribe clicks as regular clicks (optional)
                            const trackedUrl = `${BASE_URL}/api/track/click/${campaignId}/${sub.id}?url=${encodeURIComponent(url)}`;
                            return `href="${trackedUrl}"`;
                        }
                    );

                    // Replace Unsubscribe URL
                    const unsubscribeUrl = `${BASE_URL}/api/unsubscribe/${campaignId}/${sub.id}`;
                    personalizedHtml = personalizedHtml.replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);
                }

                const { data, error } = await resend.emails.send({
                    from: `${fromName} <${fromEmail}>`,
                    to: sub.email,
                    subject: personalizedSubject,
                    html: personalizedHtml,
                    replyTo
                });

                if (error) {
                    console.error(`Failed to send to ${sub.email}:`, error);
                    results.push({ success: false, email: sub.email, error: error.message });
                    failedCount++;
                } else {
                    results.push({ success: true, email: sub.email, id: data?.id });
                    sentCount++;
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                console.error(`Error sending to ${sub.email}:`, err);
                results.push({ success: false, email: sub.email, error: err.message });
                failedCount++;
            }
        }

        res.json({
            success: failedCount === 0,
            sentCount,
            failedCount,
            results
        });
    } catch (err) {
        console.error('Campaign send error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

import serverless from 'serverless-http';

// ... (keep existing code)

// Export for Netlify Functions
export const handler = serverless(app);

// Only listen if running locally (not in Netlify)
if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
    app.listen(PORT, () => {
        console.log(`📧 Email API server running on http://localhost:${PORT}`);
        console.log(`   Resend API Key: ${process.env.VITE_RESEND_API_KEY ? '✓ Configured' : '✗ Missing'}`);
        console.log(`   Supabase: ${process.env.VITE_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}`);
        console.log(`   Tracking Base URL: ${BASE_URL}`);

        // ================== AUTOMATED SCHEDULER ==================
        // Poll for scheduled campaigns every 60 seconds
        let isProcessing = false;
        setInterval(async () => {
            if (isProcessing) return;
            isProcessing = true;
            try {
                // 1. Find due campaigns
                const now = new Date().toISOString();
                const { data: dueCampaigns, error } = await supabase
                    .from('email_campaigns')
                    .select('*')
                    .eq('status', 'scheduled')
                    .lte('scheduled_at', now);

                if (error) throw error;

                if (dueCampaigns && dueCampaigns.length > 0) {
                    console.log(`⏰ Found ${dueCampaigns.length} due campaigns.`);

                    // Import server-side renderer dynamically
                    const { generateEmailHTML } = await import('./server-email-renderer.js');

                    for (const campaign of dueCampaigns) {
                        try {
                            console.log(`🚀 Starting processing for campaign: ${campaign.name} (${campaign.id})`);

                            // 2. Mark as sending
                            await supabase
                                .from('email_campaigns')
                                .update({ status: 'sending' })
                                .eq('id', campaign.id);

                            // 3. Get Template & Generate HTML
                            // Note: We need to handle case where no template_id (manual html?) - simplified for now
                            let htmlContent = '';
                            if (campaign.template_id) {
                                const { data: template } = await supabase
                                    .from('email_designs')
                                    .select('doc')
                                    .eq('id', campaign.template_id)
                                    .single();

                                if (template && template.doc) {
                                    htmlContent = generateEmailHTML(template.doc);
                                }
                            }

                            if (!htmlContent) {
                                console.error(`❌ No HTML content generated for campaign ${campaign.id}`);
                                await supabase
                                    .from('email_campaigns')
                                    .update({ status: 'paused' }) // Pause if error
                                    .eq('id', campaign.id);
                                continue;
                            }

                            // 4. Get Subscribers
                            if (!campaign.list_id) {
                                console.error(`❌ No list_id for campaign ${campaign.id}`);
                                continue;
                            }

                            const { data: subscribers } = await supabase
                                .from('subscribers')
                                .select('*')
                                .eq('list_id', campaign.list_id)
                                .eq('status', 'active');

                            if (!subscribers || subscribers.length === 0) {
                                console.log(`⚠️ No active subscribers for campaign ${campaign.id}`);
                                await supabase
                                    .from('email_campaigns')
                                    .update({ status: 'sent', sent_at: new Date().toISOString() })
                                    .eq('id', campaign.id);
                                continue;
                            }

                            // 5. Send Batch (Reusing the API logic by calling internal function or just fetch API?
                            // Since we are IN the server, we should call internal logic. 
                            // Duplicating the core loop for simplicity and robustness in this context.

                            let sentCount = 0;

                            for (const sub of subscribers) {
                                // Personalize
                                let personalizedHtml = htmlContent
                                    .replace(/\{\{firstName\}\}/g, sub.firstName || '')
                                    .replace(/\{\{lastName\}\}/g, sub.lastName || '')
                                    .replace(/\{\{email\}\}/g, sub.email);

                                // Add Tracking (Simplified manual version of what the API does)
                                const trackingPixel = `<img src="${BASE_URL}/api/track/open/${campaign.id}/${sub.id}" width="1" height="1" style="display:none" alt="" />`;
                                personalizedHtml = personalizedHtml.replace('</body>', `${trackingPixel}</body>`);

                                // Send
                                await resend.emails.send({
                                    from: `${campaign.sender_name} <${campaign.sender_email}>`,
                                    to: sub.email,
                                    subject: campaign.subject,
                                    html: personalizedHtml,
                                    replyTo: campaign.reply_to
                                });
                                sentCount++;
                                await new Promise(r => setTimeout(r, 100)); // Rate limit
                            }

                            // 6. Mark as Sent
                            await supabase
                                .from('email_campaigns')
                                .update({ status: 'sent', sent_at: new Date().toISOString() })
                                .eq('id', campaign.id);

                            // Initialize Analytics
                            await supabase.from('campaign_analytics').insert({
                                campaign_id: campaign.id,
                                total_sent: sentCount
                            }).select(); // insert if not exists logic might be needed but campaign_id is unique

                            console.log(`✅ Automatically sent campaign ${campaign.name} to ${sentCount} subscribers.`);

                        } catch (err) {
                            console.error(`❌ Failed to auto-send campaign ${campaign.id}:`, err);
                            // Set back to scheduled? or paused?
                            await supabase
                                .from('email_campaigns')
                                .update({ status: 'paused' })
                                .eq('id', campaign.id);
                        }
                    }
                }
            } catch (err) {
                console.error('Error in campaign scheduler:', err);
            } finally {
                isProcessing = false;
            }
        }, 60000); // Check every 60 seconds
    });
}
