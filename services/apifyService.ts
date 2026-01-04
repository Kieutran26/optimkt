/**
 * Apify API Service
 * Uses Apify's Facebook Page Scraper actor to get REAL data from any page
 * Docs: https://apify.com/apify/facebook-pages-scraper
 */

interface ApifyPageResult {
    pageId: string;
    name: string;
    verified?: boolean;
    category?: string;
    likes?: number;
    followers?: number;
    about?: string;
    website?: string;
    email?: string;
    phone?: string;
    posts?: Array<{
        postId: string;
        text: string;
        type: string;
        url: string;
        time: string;
        shares?: number;
        comments?: number;
        likes?: number;
        reactions?: number;
        images?: string[];
        video?: string;
    }>;
}

export class ApifyService {
    private static readonly APIFY_API_BASE = 'https://api.apify.com/v2';
    private static readonly ACTOR_ID = 'apify/facebook-pages-scraper';

    private static getApiToken(): string {
        const token = import.meta.env.VITE_APIFY_API_TOKEN;
        if (!token) {
            throw new Error('Missing VITE_APIFY_API_TOKEN in .env.local');
        }
        return token;
    }

    /**
     * Scrape Facebook Page using backend proxy
     * Calls our Express server which handles Apify API server-side
     */
    static async scrapeFacebookPage(
        pageUrl: string,
        options: {
            maxPosts?: number;
        } = {}
    ): Promise<ApifyPageResult | null> {
        try {
            const { maxPosts = 30 } = options;

            console.log('🔍 Calling backend proxy for:', pageUrl);

            // Call our backend proxy (Express server)
            const response = await fetch('http://localhost:3001/api/analyze-facebook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pageUrl, maxPosts })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Backend error: ${response.status}`);
            }

            // Apify returns an ARRAY of items (each item is a post)
            const items = await response.json();

            if (!Array.isArray(items) || items.length === 0) {
                console.warn('⚠️ No items returned from backend');
                return null;
            }

            // Try to find the Page Info object (usually has 'categories' or 'followers' at top level)
            // If not found, fall back to extracting from the first post
            let pageInfo = items.find(i => i.categories || i.username || (i.likes && !i.postId)) || items[0];

            // Handle case where items[0] is a Post and we need to extract author info
            const isPost = !!(pageInfo.postId || pageInfo.text);
            if (isPost) {
                console.log('⚠️ Page info missing, extracting from post metadata');
                // Common Apify post structures:
                // 1. user: { name: '...', ... }
                // 2. pageName: '...'
                // 3. author: { name: '...', ... }
                const authorName = pageInfo.user?.name || pageInfo.pageName || pageInfo.author?.name || pageInfo.name;
                const authorUrl = pageInfo.user?.profileUrl || pageInfo.url || pageInfo.pageUrl;

                // Construct a partial page info from post data
                pageInfo = {
                    ...pageInfo, // keep other props just in case
                    name: authorName, // Critical fix for "Unknown Page"
                    url: authorUrl,
                    category: 'Brand Page', // Fallback since posts don't show category
                    followers: pageInfo.user?.followers || 0,
                    verified: pageInfo.user?.verified || false
                };
            }

            console.log(`✅ Mapping data for Page: ${pageInfo.name}`);

            return {
                pageId: pageInfo.id || pageInfo.pageId || pageInfo.user?.id, // Try user.id if post
                name: pageInfo.name,
                verified: pageInfo.verified,
                category: pageInfo.categories?.[0] || pageInfo.category || 'Page',
                likes: pageInfo.likes,
                followers: pageInfo.followers,
                about: pageInfo.about || pageInfo.intro,
                website: pageInfo.website,
                email: pageInfo.email,
                phone: pageInfo.phone,
                // The items array IS the list of posts (filter out the page object if present)
                posts: items.filter(i => !!i.postId || !!i.text)
            };

        } catch (error: any) {
            console.error('Backend proxy error:', error);
            throw error;
        }
    }

    /**
     * Get account info (credits remaining)
     */
    static async getAccountInfo(): Promise<{ credits: number } | null> {
        try {
            const token = this.getApiToken();

            const response = await fetch(
                `${this.APIFY_API_BASE}/users/me?token=${token}`
            );

            if (!response.ok) return null;

            const data = await response.json();
            return {
                credits: data.data.usageCycle?.availableCredits || 0
            };
        } catch (error) {
            console.error('Error getting Apify account info:', error);
            return null;
        }
    }
}
