import { BrandSpyResult, BrandSpyPlatform, BrandProfile, BrandPost, BrandAd, BrandAnalysis, BrandEvaluation } from '../types';

export class BrandSpyService {
    private static readonly TABLE_NAME = 'brand_spy_analyses';

    // Get all saved analyses
    static async getBrandSpyAnalyses(): Promise<BrandSpyResult[]> {
        const { supabase } = await import('../lib/supabase');

        try {
            const { data, error } = await supabase
                .from(this.TABLE_NAME)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return (data || []).map(item => ({
                id: item.id,
                platform: item.platform,
                targetUrl: item.target_url,
                brandName: item.brand_name,
                profile: item.profile,
                posts: item.posts,
                ads: item.ads,
                analysis: item.analysis,
                evaluation: item.evaluation,
                createdAt: new Date(item.created_at).getTime(),
                updatedAt: new Date(item.updated_at).getTime()
            }));
        } catch (error) {
            console.error('Error loading brand spy analyses:', error);
            return [];
        }
    }

    // Save a brand spy analysis
    static async saveBrandSpyAnalysis(analysis: BrandSpyResult): Promise<boolean> {
        const { supabase } = await import('../lib/supabase');

        try {
            // Prepare data for DB (convert to snake_case)
            const dbData = {
                id: analysis.id,
                platform: analysis.platform,
                target_url: analysis.targetUrl,
                brand_name: analysis.brandName,
                profile: analysis.profile,
                posts: analysis.posts,
                ads: analysis.ads,
                analysis: analysis.analysis,
                evaluation: analysis.evaluation,
                updated_at: new Date().toISOString()
            };

            // Check if exists
            const { data: existing } = await supabase
                .from(this.TABLE_NAME)
                .select('id')
                .eq('id', analysis.id)
                .single();

            if (existing) {
                // Update
                const { error } = await supabase
                    .from(this.TABLE_NAME)
                    .update(dbData)
                    .eq('id', analysis.id);
                if (error) throw error;
            } else {
                // Insert
                const { error } = await supabase
                    .from(this.TABLE_NAME)
                    .insert({
                        ...dbData,
                        created_at: new Date(analysis.createdAt || Date.now()).toISOString()
                    });
                if (error) throw error;
            }

            return true;
        } catch (error) {
            console.error('Error saving brand spy analysis:', error);
            return false;
        }
    }

    // Delete a brand spy analysis
    static async deleteBrandSpyAnalysis(id: string): Promise<boolean> {
        const { supabase } = await import('../lib/supabase');

        try {
            const { error } = await supabase
                .from(this.TABLE_NAME)
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting brand spy analysis:', error);
            return false;
        }
    }

    // Generate mock profile data
    static generateMockProfile(platform: BrandSpyPlatform, brandName: string, url: string): BrandProfile {
        const mockProfiles: Record<BrandSpyPlatform, Partial<BrandProfile>> = {
            facebook: {
                category: 'Food & Beverage',
                pageIntro: 'Premium coffee brand delivering excellence since 2020',
                email: 'contact@brand.com',
                phone: '+84 123 456 789',
                website: 'https://brand.com',
                followerCount: 125000,
                isBusinessPageActive: true,
                adStatus: 'Active'
            },
            tiktok: {
                category: 'Food & Beverage',
                pageIntro: 'Making your coffee moments special ☕✨',
                followerCount: 350000,
                isBusinessPageActive: true,
            },
            google_ads: {
                category: 'Food & Beverage',
                followerCount: 0,
                isBusinessPageActive: true,
                adStatus: 'Active'
            },
            linkedin: {
                category: 'Food & Beverage',
                pageIntro: 'B2B Coffee Solutions | Premium Beans & Equipment',
                email: 'business@brand.com',
                website: 'https://brand.com',
                followerCount: 8500,
                isBusinessPageActive: true,
            },
            website: {
                category: 'E-commerce',
                email: 'support@brand.com',
                website: url,
                followerCount: 0,
                isBusinessPageActive: true,
            }
        };

        const mockData = mockProfiles[platform];
        return {
            id: crypto.randomUUID(),
            url,
            name: brandName,
            pageId: `${platform}_${Date.now()}`,
            ...mockData,
            followerCount: mockData.followerCount || 0,
            isBusinessPageActive: mockData.isBusinessPageActive || false,
        };
    }

    // Generate mock posts data (30 posts)
    static generateMockPosts(platform: BrandSpyPlatform, count: number = 30): BrandPost[] {
        const posts: BrandPost[] = [];
        const now = Date.now();

        const descriptions = [
            '☕ Khởi đầu ngày mới với hương vị cà phê đậm đà',
            '🌟 Bí quyết pha chế cà phê hoàn hảo',
            '💚 Cà phê organic - Tốt cho sức khỏe, tốt cho môi trường',
            '🎉 Flash Sale 30% - Đừng bỏ lỡ!',
            '📸 Không gian cà phê đẹp mê hồn',
            '👨‍🍳 Barista chia sẻ tips & tricks',
            '🏆 Giải thưởng cà phê xuất sắc 2024',
            '💝 Quà tặng đặc biệt cho khách hàng thân thiết',
        ];

        for (let i = 0; i < count; i++) {
            const isReel = platform === 'facebook' || platform === 'tiktok' ? Math.random() > 0.6 : false;
            const daysAgo = Math.floor(Math.random() * 90); // Posts within 90 days
            const timestamp = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

            posts.push({
                id: `post_${i}`,
                description: descriptions[i % descriptions.length],
                time: timestamp.toISOString(),
                reactions: Math.floor(Math.random() * 5000) + 100,
                comments: Math.floor(Math.random() * 500) + 10,
                url: `https://${platform}.com/post/${i}`,
                media: [`https://picsum.photos/600/400?random=${i}`],
                isReel: isReel,
                thumbnail: isReel ? `https://picsum.photos/300/400?random=${i}` : undefined,
                transcript: isReel ? 'Hôm nay mình sẽ chia sẻ cách pha cà phê latte hoàn hảo. Đầu tiên, chuẩn bị espresso đậm đà...' : undefined
            });
        }

        return posts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    }

    // Generate mock ads data
    static generateMockAds(platform: BrandSpyPlatform, count: number = 15): BrandAd[] {
        const ads: BrandAd[] = [];

        const adContents = [
            'Giảm giá 40% tất cả sản phẩm - Chỉ hôm nay!',
            'Khám phá bộ sưu tập cà phê mới',
            'Miễn phí giao hàng cho đơn hàng trên 500k',
            'Combo tiết kiệm - Mua 2 tặng 1',
            'Đăng ký ngay để nhận ưu đãi đặc biệt',
        ];

        const ctas = ['Sign Up', 'Shop Now', 'Learn More', 'Send Message', 'Call Now'];

        for (let i = 0; i < count; i++) {
            ads.push({
                id: `ad_${i}`,
                content: adContents[i % adContents.length],
                cta: ctas[i % ctas.length],
                platform: platform,
                media: [`https://picsum.photos/600/315?random=${i + 100}`],
                isActive: Math.random() > 0.3,
                adArchiveId: `archive_${platform}_${i}`
            });
        }

        return ads;
    }



    // ===== Fetch REAL Facebook Data via Apify =====
    static async fetchRealFacebookData(pageUrl: string, options: { brandName?: string; maxPosts?: number } = {}) {
        const { ApifyService } = await import('./apifyService');
        const { brandName, maxPosts = 10 } = options;

        try {
            console.log(`🔍 Fetching real data via Apify for: ${pageUrl} (Limit: ${maxPosts} posts)`);

            // Fetch page data with Apify
            const pageData = await ApifyService.scrapeFacebookPage(pageUrl, { maxPosts });

            if (!pageData) {
                throw new Error(
                    'Không lấy được data từ Apify. ' +
                    'Page có thể không tồn tại hoặc không public.'
                );
            }

            console.log(`✅ Got real data: ${pageData.posts?.length || 0} posts`);

            // Convert to BrandSpy format
            const brandProfile: BrandProfile = {
                id: pageData.pageId,
                url: pageUrl,
                name: pageData.name || brandName || 'Unknown Page',
                email: pageData.email,
                website: pageData.website,
                phone: pageData.phone,
                category: pageData.category || 'Unknown Category',
                pageIntro: pageData.about || `✅ Real data from ${pageData.name}`,
                followerCount: pageData.followers || pageData.likes || 0,
                isBusinessPageActive: true,
                pageId: pageData.pageId,
                adStatus: pageData.verified ? 'Verified Page' : 'Public Page'
            };

            // DEBUG: Log raw items to understand structure
            console.log('🔍 Raw Apify Items:', pageData.posts);

            // Filter out items that are likely just Page Info (no text, no media, no postId)
            const validPosts = (pageData.posts || []).filter((post: any) => {
                const hasContent = !!(post.text || post.images?.length || post.videoUrl);
                const hasId = !!post.postId;
                // If it looks like the Page Info object (has likes but no post content), skip it
                if (post.pageId && !hasId && !hasContent) return false;
                return true;
            });

            console.log(`✅ Valid Posts Filtered: ${validPosts.length} / ${pageData.posts?.length || 0}`);

            // Convert Posts
            const brandPosts: BrandPost[] = validPosts.map((post: any) => ({
                id: post.postId || `post-${Math.random()}`,
                description: post.text || post.content || '(No text)',
                time: post.time || new Date().toISOString(),
                reactions: post.reactions || post.likes || 0,
                comments: post.comments || 0,
                url: post.url || post.postUrl || '',
                // Handle different image/video structures
                media: post.images?.length ? post.images : (post.videoUrl ? [post.videoUrl] : []),
                isReel: post.type === 'video' || !!post.videoUrl,
                thumbnail: post.thumbnail || post.images?.[0] || undefined
            }));

            console.log('✅ Mapped Posts:', brandPosts);

            // Currently Apify scraper doesn't fetch Ads Library
            // We return empty array so UI shows "No ads found" instead of fake mocks
            const brandAds: BrandAd[] = [];

            return {
                profile: brandProfile,
                posts: brandPosts,
                ads: brandAds,
                metadata: {
                    dataSource: 'Apify (Real Data)',
                    isRealData: true,
                    postsCount: brandPosts.length,
                    verified: pageData.verified
                }
            };

        } catch (error: any) {
            console.error('❌ Apify error:', error);

            // Fallback to mock data
            console.log('📝 Falling back to mock data');
            return {
                profile: this.generateMockProfile('facebook', brandName, pageUrl),
                posts: this.generateMockPosts('facebook', 30),
                ads: this.generateMockAds('facebook', 15),
                metadata: {
                    dataSource: 'Mock Data (Apify Error)',
                    isRealData: false,
                    error: error.message
                }
            };
        }
    }
}
