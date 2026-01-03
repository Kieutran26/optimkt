// functions/news-fetch.js
// Netlify Function for Manual News Fetching (triggered from UI)

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
    }
});

// RSS Feeds Configuration
const FEED_SOURCES = [
    { url: 'https://cafef.vn/tai-chinh-quoc-te.rss', source: 'CafeF', category: 'Finance' },
    { url: 'https://vietnambiz.vn/tai-chinh.rss', source: 'VietnamBiz', category: 'Finance' },
    { url: 'https://vneconomy.vn/tai-chinh.rss', source: 'VnEconomy', category: 'Finance' },
    {
        url: 'https://news.google.com/rss/search?q=site:brandsvietnam.com&hl=vi&gl=VN&ceid=VN:vi',
        source: 'BrandsVietnam',
        category: 'Marketing'
    },
    {
        url: 'https://news.google.com/rss/search?q="Advertising+Vietnam"&hl=vi&gl=VN&ceid=VN:vi',
        source: 'Advertising Vietnam',
        category: 'Marketing'
    },
    {
        url: 'https://news.google.com/rss/search?q=site:vietcetera.com&hl=vi&gl=VN&ceid=VN:vi',
        source: 'Vietcetera',
        category: 'Lifestyle'
    },
    { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', category: 'Tech' },
    { url: 'https://feeds.feedburner.com/entrepreneur/latest', source: 'Entrepreneur', category: 'Business' }
];

async function fetchAndStoreNews(supabase) {
    console.log('📰 Starting News Aggregation...');
    let totalNew = 0;

    for (const feed of FEED_SOURCES) {
        try {
            console.log(`   Fetching ${feed.source}...`);
            const feedData = await parser.parseURL(feed.url);
            const items = feedData.items.slice(0, 50);

            for (const item of items) {
                const { data: existing } = await supabase
                    .from('news_articles')
                    .select('id')
                    .eq('link', item.link)
                    .single();

                if (!existing) {
                    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();

                    let imageUrl = null;
                    if (item.enclosure && item.enclosure.url) {
                        imageUrl = item.enclosure.url;
                    } else if (item['content:encoded'] && item['content:encoded'].match(/src="([^"]+)"/)) {
                        imageUrl = item['content:encoded'].match(/src="([^"]+)"/)[1];
                    } else if (item.content && item.content.match(/src="([^"]+)"/)) {
                        imageUrl = item.content.match(/src="([^"]+)"/)[1];
                    } else if (item.description && item.description.match(/src="([^"]+)"/)) {
                        imageUrl = item.description.match(/src="([^"]+)"/)[1];
                    }

                    const { error } = await supabase.from('news_articles').insert({
                        title: item.title,
                        link: item.link,
                        pub_date: pubDate.toISOString(),
                        source: feed.source,
                        category: feed.category,
                        summary: item.contentSnippet || item.content?.substring(0, 200) + '...',
                        image_url: imageUrl
                    });
                    if (!error) totalNew++;
                }
            }
        } catch (error) {
            console.error(`❌ Error fetching ${feed.source}:`, error.message);
        }
    }

    console.log(`✅ News Aggregation Complete. Added ${totalNew} new articles.`);
    return totalNew;
}

// Handler for manual trigger via API
export const handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    console.log('📰 Manual news fetch triggered!');

    const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
    );

    try {
        const newArticles = await fetchAndStoreNews(supabase);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: `Đã thu thập ${newArticles} bài viết mới!`,
                newArticlesCount: newArticles,
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('News fetch error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
