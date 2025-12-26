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
            const newOpened = (analytics.total_opened || 0) + 1;
            const openRate = analytics.total_sent > 0
                ? Math.round((newOpened / analytics.total_sent) * 10000) / 100
                : 0;

            await supabase
                .from('campaign_analytics')
                .update({
                    total_opened: newOpened,
                    open_rate: openRate,
                    updated_at: new Date().toISOString()
                })
                .eq('campaign_id', campaignId);
        }

        console.log(`📬 Email opened: campaign=${campaignId}, subscriber=${subscriberId}`);
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
            const newClicked = (analytics.total_clicked || 0) + 1;
            const clickRate = analytics.total_opened > 0
                ? Math.round((newClicked / analytics.total_opened) * 10000) / 100
                : 0;

            await supabase
                .from('campaign_analytics')
                .update({
                    total_clicked: newClicked,
                    click_rate: clickRate,
                    updated_at: new Date().toISOString()
                })
                .eq('campaign_id', campaignId);
        }

        console.log(`🖱️ Link clicked: campaign=${campaignId}, subscriber=${subscriberId}, url=${url}`);
    } catch (err) {
        console.error('Error tracking click:', err);
    }

    // Redirect to actual URL
    res.redirect(decodeURIComponent(url));
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
                            const trackedUrl = `${BASE_URL}/api/track/click/${campaignId}/${sub.id}?url=${encodeURIComponent(url)}`;
                            return `href="${trackedUrl}"`;
                        }
                    );
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

app.listen(PORT, () => {
    console.log(`📧 Email API server running on http://localhost:${PORT}`);
    console.log(`   Resend API Key: ${process.env.VITE_RESEND_API_KEY ? '✓ Configured' : '✗ Missing'}`);
    console.log(`   Supabase: ${process.env.VITE_SUPABASE_URL ? '✓ Configured' : '✗ Missing'}`);
    console.log(`   Tracking Base URL: ${BASE_URL}`);
});
