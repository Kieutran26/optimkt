import React, { useState } from 'react';
import { BrandSpyPlatform, BrandSpyResult, BrandPost } from '../types';
import { BrandSpyService } from '../services/brandSpyService';
import { analyzeBrandStrategy, evaluateBrandPerformance } from '../services/geminiService';
import { Search, Loader2, Save, History, X, Trash2, ExternalLink } from 'lucide-react';
import { Toast, ToastType } from './Toast';
import BrandHistoryTable from './BrandHistoryTable';

interface BrandSpyProps {
    platform: BrandSpyPlatform;
    platformLabel: string;
}

const TikTokSpy: React.FC<BrandSpyProps> = ({ platform, platformLabel }) => {
    const [targetUrl, setTargetUrl] = useState('');
    const [brandName, setBrandName] = useState('');
    const [postLimit, setPostLimit] = useState(10);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [result, setResult] = useState<BrandSpyResult | null>(null);
    const [selectedSection, setSelectedSection] = useState<'data' | 'analysis' | 'evaluation'>('data');

    // History
    const [showHistory, setShowHistory] = useState(false);
    const [savedAnalyses, setSavedAnalyses] = useState<BrandSpyResult[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [analyzingPosts, setAnalyzingPosts] = useState<Set<string>>(new Set());

    const handleAnalyzePost = async (post: BrandPost) => {
        if (!result) return;

        // Add to analyzing set
        setAnalyzingPosts(prev => {
            const next = new Set(prev);
            next.add(post.id);
            return next;
        });

        const description = await BrandSpyService.analyzePostMedia(post);

        // Update post in result
        const updatedPosts = result.posts.map(p =>
            p.id === post.id ? { ...p, aiDescription: description } : p
        );

        setResult({ ...result, posts: updatedPosts });

        // Remove from analyzing set
        setAnalyzingPosts(prev => {
            const next = new Set(prev);
            next.delete(post.id);
            return next;
        });
    };

    React.useEffect(() => {
        loadHistory();
    }, [platform]);

    const loadHistory = async () => {
        const allAnalyses = await BrandSpyService.getBrandSpyAnalyses();
        // Filter to only show analyses for this platform
        const filtered = allAnalyses.filter(a => a.platform === platform);
        setSavedAnalyses(filtered);
    };

    const handleAnalyze = async () => {
        if (!targetUrl.trim()) {
            setToast({ message: 'Vui lòng nhập URL/Page ID', type: 'error' });
            return;
        }

        setLoading(true);
        setProgress('Đang thu thập dữ liệu...');

        try {
            let profile, posts, ads;
            let finalBrandName = brandName;

            // For TikTok: Use REAL API data
            if (platform === 'tiktok') {
                setProgress(`Đang kết nối TikTok API (Lấy ${postLimit} video)...`);
                const realData = await BrandSpyService.fetchRealTikTokData(targetUrl, {
                    brandName: brandName || undefined,
                    maxPosts: postLimit
                });

                profile = realData.profile;
                posts = realData.posts;
                ads = realData.ads;

                if (!brandName && profile.name) {
                    finalBrandName = profile.name;
                    setBrandName(profile.name);
                } else {
                    finalBrandName = brandName;
                }

                setProgress(`✅ Đã lấy ${posts.length} video từ TikTok`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                // For other platforms (if reused later) or fallback: Use mock data
                setProgress('Đang tạo dữ liệu...');
                profile = BrandSpyService.generateMockProfile(platform, brandName, targetUrl);
                posts = BrandSpyService.generateMockPosts(platform, 30);
                ads = BrandSpyService.generateMockAds(platform, 15);

                finalBrandName = brandName || 'Demo Brand';
            }

            setProgress('Đang phân tích chiến lược với AI...');

            // Analyze strategy with AI
            const analysis = await analyzeBrandStrategy(platform, profile, posts, ads);

            if (!analysis) {
                throw new Error('Không thể phân tích chiến lược');
            }

            setProgress('Đang đánh giá hiệu suất với AI...');

            // Evaluate performance with AI
            const evaluation = await evaluateBrandPerformance(platform, finalBrandName, analysis);

            if (!evaluation) {
                throw new Error('Không thể đánh giá hiệu suất');
            }

            // Create result
            const newResult: BrandSpyResult = {
                id: crypto.randomUUID(),
                platform,
                targetUrl,
                brandName: finalBrandName,
                profile,
                posts,
                ads,
                analysis,
                evaluation,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            setResult(newResult);
            setSelectedSection('data');
            setToast({
                message: `✅ Phân tích hoàn tất với dữ liệu THẬT từ TikTok!`,
                type: 'success'
            });
        } catch (error: any) {
            console.error('Analysis error:', error);
            const errorMsg = error.message || 'Đã xảy ra lỗi khi phân tích';

            setToast({
                message: errorMsg.includes('token') || errorMsg.includes('permissions')
                    ? '❌ Lỗi API: Kiểm tra lại Access Token và permissions'
                    : `❌ ${errorMsg}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
            setProgress('');
        }
    };

    const handleSave = async () => {
        if (!result) {
            setToast({ message: 'Chưa có dữ liệu để lưu!', type: 'error' });
            return;
        }

        const success = await BrandSpyService.saveBrandSpyAnalysis(result);
        if (success) {
            await loadHistory();
            setToast({ message: 'Đã lưu phân tích!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi lưu!', type: 'error' });
        }
    };

    const handleLoad = (analysis: BrandSpyResult) => {
        setResult(analysis);
        setTargetUrl(analysis.targetUrl);
        setBrandName(analysis.brandName);
        setSelectedSection('data');
        setShowHistory(false);
        setToast({ message: 'Đã tải phân tích!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        const success = await BrandSpyService.deleteBrandSpyAnalysis(id);
        if (success) {
            await loadHistory();
            setToast({ message: 'Đã xóa!', type: 'success' });
        } else {
            setToast({ message: 'Lỗi khi xóa!', type: 'error' });
        }
    };

    return (
        <div className="w-full h-full overflow-hidden flex flex-col bg-slate-50">
            {/* Header Area */}
            <div className="flex-shrink-0 px-8 py-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{platformLabel}</h2>
                    <p className="text-slate-500 text-sm mt-1">Phân tích chiến lược thương hiệu đối thủ chi tiết</p>
                </div>
                <div className="flex gap-3">
                    {result && (
                        <button
                            onClick={handleSave}
                            className="bg-white hover:bg-slate-50 text-slate-900 px-5 py-2.5 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm flex items-center gap-2 text-sm font-bold transition-all"
                        >
                            <Save size={18} />
                            Lưu báo cáo
                        </button>
                    )}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="bg-white hover:bg-slate-50 text-slate-900 px-5 py-2.5 rounded-full border border-slate-200 hover:border-slate-300 shadow-sm flex items-center gap-2 text-sm font-bold transition-all"
                    >
                        <History size={18} />
                        Lịch sử
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden px-8 pb-8">
                {/* Input Form */}
                {!result && (
                    <div className="max-w-2xl mx-auto mt-12">
                        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-slate-900 rounded-2xl text-white">
                                    <Search className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Bắt đầu phân tích</h3>
                                    <p className="text-slate-500 text-sm">Nhập TikTok Profile để AI tự động thu thập và phân tích dữ liệu.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* URL / Page ID */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                                        URL / Page ID
                                    </label>
                                    <input
                                        type="text"
                                        value={targetUrl}
                                        onChange={(e) => setTargetUrl(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-0 transition-all outline-none"
                                        placeholder={
                                            platform === 'tiktok'
                                                ? "VD: https://www.tiktok.com/@username hoặc @username"
                                                : "VD: https://facebook.com/highlands hoặc Page ID"
                                        }
                                    />
                                </div>

                                {/* Post Limit Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                                        Số lượng bài viết
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[1, 5, 10, 30].map((limit) => (
                                            <button
                                                key={limit}
                                                onClick={() => setPostLimit(limit)}
                                                className={`py-3 rounded-xl text-sm font-bold border transition-all ${postLimit === limit
                                                    ? 'bg-slate-900 text-white border-slate-900'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {limit} bài
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Analyze Button */}
                                <button
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    className="w-full mt-4 px-6 py-4 bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-lg shadow-slate-900/10 transition-all flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {progress || 'Đang xử lý...'}
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5" />
                                            Phân tích ngay
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results Layout */}
                {result && (
                    <div className="flex gap-8 h-full">
                        {/* Sidebar */}
                        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
                            <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-100">
                                {[
                                    { id: 'data' as const, label: 'Dữ liệu' },
                                    { id: 'analysis' as const, label: 'Phân tích' },
                                    { id: 'evaluation' as const, label: 'Đánh giá' },
                                ].map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => setSelectedSection(section.id)}
                                        className={`w-full text-left px-5 py-4 rounded-2xl text-sm font-bold transition-all mb-1 last:mb-0 ${selectedSection === section.id
                                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                            }`}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setResult(null)}
                                className="mt-auto w-full px-5 py-4 bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-3xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <X size={18} />
                                Đóng báo cáo
                            </button>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 overflow-y-auto custom-scrollbar">
                            {selectedSection === 'data' && (
                                <div className="space-y-8 animate-in fade-in duration-500">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Dữ liệu</h3>
                                        <div className="text-sm text-slate-500">
                                            Dữ liệu {result.metadata?.isRealData ? 'thực tế' : 'demo'} từ {platformLabel} của kênh <span className="font-bold text-slate-900">{result.brandName}</span> với {result.posts.length} {platform === 'tiktok' ? 'video' : 'bài đăng'} gần nhất.
                                        </div>
                                    </div>


                                    {/* Channel Profile Accordion */}
                                    <div className="space-y-4">
                                        <h4 className="text-xl font-bold text-slate-800">Dữ liệu Kênh</h4>
                                        <details className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" open>
                                            <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                                                <span className="font-bold text-slate-700">Hồ sơ Kênh</span>
                                                <span className="transform group-open:rotate-180 transition-transform duration-200">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </span>
                                            </summary>
                                            <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                                                <div className="space-y-4">
                                                    {/* Avatar */}
                                                    <div>
                                                        <span className="font-bold text-slate-900 block mb-2">Avatar:</span>
                                                        <img
                                                            src={result.profile.url || "https://via.placeholder.com/150"}
                                                            alt={result.profile.name}
                                                            className="w-24 h-24 rounded-full border-4 border-slate-100 object-cover shadow-sm"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(result.profile.name)}&background=random`;
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Profile Stats Grid */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-bold text-slate-900 min-w-[120px]">Nickname:</span>
                                                            <span className="text-slate-700">{result.profile.name}</span>
                                                        </div>

                                                        {result.platform === 'tiktok' && (
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="font-bold text-slate-900 min-w-[120px]">UniqueId:</span>
                                                                <span className="text-slate-700">{result.profile.uniqueId || result.profile.id}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-bold text-slate-900 min-w-[120px]">Signature:</span>
                                                            <span className="text-slate-700">{result.profile.signature || result.profile.pageIntro || 'Không có'}</span>
                                                        </div>

                                                        {result.platform === 'tiktok' && (
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="font-bold text-slate-900 min-w-[120px]">BioLink:</span>
                                                                <a href={result.profile.bioLink || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px]">
                                                                    {result.profile.bioLink || 'Không có'}
                                                                </a>
                                                            </div>
                                                        )}

                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-bold text-slate-900 min-w-[120px]">Follower Count:</span>
                                                            <span className="text-slate-700 font-medium">{result.profile.followerCount.toLocaleString('vi-VN')}</span>
                                                        </div>

                                                        {result.platform === 'tiktok' && (
                                                            <>
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="font-bold text-slate-900 min-w-[120px]">Following Count:</span>
                                                                    <span className="text-slate-700 font-medium">{result.profile.followingCount?.toLocaleString('vi-VN') || 0}</span>
                                                                </div>
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="font-bold text-slate-900 min-w-[120px]">Video Count:</span>
                                                                    <span className="text-slate-700 font-medium">{result.profile.videoCount?.toLocaleString('vi-VN') || 0}</span>
                                                                </div>
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="font-bold text-slate-900 min-w-[120px]">Heart Count:</span>
                                                                    <span className="text-slate-700 font-medium">{result.profile.heartCount?.toLocaleString('vi-VN') || 0}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </details>
                                    </div>

                                    {/* Posts Accordion List */}
                                    <div className="space-y-4">
                                        <h4 className="text-xl font-bold text-slate-800">Dữ liệu Bài đăng</h4>
                                        <div className="space-y-3">
                                            {result.posts.map((post, index) => (
                                                <details key={post.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-bold text-slate-700">
                                                                Bài đăng {index + 1}
                                                                {post.type ? ` (Loại: ${post.type.charAt(0).toUpperCase() + post.type.slice(1)})` : ''}
                                                            </span>
                                                            {post.isPinned && (
                                                                <div className="p-1 bg-slate-100 rounded-md border border-slate-200">
                                                                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">📌 Ghim</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="transform group-open:rotate-180 transition-transform duration-200">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                            </svg>
                                                        </span>
                                                    </summary>
                                                    <div className="p-5 pt-0 border-t border-slate-100 mt-2 space-y-4">
                                                        <div className="flex flex-col gap-2 text-sm text-slate-700">
                                                            <div className="flex gap-2">
                                                                <span className="font-bold min-w-[100px]">ID:</span>
                                                                <span className="font-mono text-slate-500">{post.id}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="font-bold min-w-[100px]">URL:</span>
                                                                <a href={post.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                                                                    {post.url}
                                                                </a>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="font-bold min-w-[100px]">Mô tả:</span>
                                                                <p className="flex-1">{post.description}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="font-bold min-w-[100px]">Ngày đăng:</span>
                                                                <span>{new Date(post.time).toLocaleDateString('vi-VN')}</span>
                                                            </div>

                                                            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                                <span className="font-bold block mb-2">Tương tác:</span>
                                                                <ul className="space-y-1 pl-2">
                                                                    <li>Lượt xem: <span className="font-medium">{post.viewCount?.toLocaleString('vi-VN') || 0}</span></li>
                                                                    <li>Lượt thích: <span className="font-medium">{post.reactions.toLocaleString('vi-VN')}</span></li>
                                                                    <li>Bình luận: <span className="font-medium">{post.comments.toLocaleString('vi-VN')}</span></li>
                                                                    <li>Chia sẻ: <span className="font-medium">{post.shareCount?.toLocaleString('vi-VN') || 0}</span></li>
                                                                    <li>Lưu: <span className="font-medium">{post.saveCount?.toLocaleString('vi-VN') || 0}</span></li>
                                                                </ul>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <span className="font-bold min-w-[100px]">Ads:</span>
                                                                <span>Không</span>
                                                            </div>

                                                            <div className="flex gap-2">
                                                                <span className="font-bold min-w-[100px]">Caption:</span>
                                                                <p className="flex-1 text-slate-700 whitespace-pre-wrap">{post.description}</p>
                                                            </div>

                                                            {/* AI Description Section */}
                                                            <div className="space-y-1 mt-3 pt-3 border-t border-slate-100">
                                                                <span className="font-bold block text-blue-800">
                                                                    ✨ Mô tả {post.type === 'video' ? 'Video' : 'Hình ảnh'} (AI Analysis):
                                                                </span>
                                                                {post.aiDescription ? (
                                                                    <p className="text-slate-600 italic bg-blue-50 p-3 rounded-lg border border-blue-100">
                                                                        {post.aiDescription}
                                                                    </p>
                                                                ) : (
                                                                    <div className="text-slate-400 italic text-sm bg-slate-50 p-2 rounded border border-slate-100 flex items-center justify-between gap-2">
                                                                        <span>Chưa có mô tả từ AI.</span>
                                                                        <button
                                                                            onClick={() => handleAnalyzePost(post)}
                                                                            disabled={analyzingPosts.has(post.id)}
                                                                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
                                                                        >
                                                                            {analyzingPosts.has(post.id) ? (
                                                                                <>
                                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                                    Đang phân tích...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    ✨ Phân tích ngay
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Media Gallery */}
                                                            {post.media && post.media.length > 0 && (
                                                                <div className="space-y-2 mt-2">
                                                                    <span className="font-bold block">
                                                                        {post.type === 'video' ? 'Thumbnail:' : 'Danh sách Ảnh:'}
                                                                    </span>
                                                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                                                        {post.type === 'video' ? (
                                                                            <img
                                                                                src={post.thumbnail || post.media[0]}
                                                                                alt="Thumbnail"
                                                                                className="h-32 rounded-lg object-cover border border-slate-200"
                                                                            />
                                                                        ) : (
                                                                            post.media.map((url, i) => (
                                                                                <img
                                                                                    key={i}
                                                                                    src={url}
                                                                                    alt={`Image ${i + 1}`}
                                                                                    className="h-32 rounded-lg object-cover border border-slate-200"
                                                                                />
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </details>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {selectedSection === 'analysis' && (
                                <AnalysisSection result={result} />
                            )}
                            {selectedSection === 'evaluation' && (
                                <EvaluationSection result={result} />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-white rounded-[2rem] w-full max-w-6xl h-[80vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Lịch sử báo cáo</h3>
                                <p className="text-slate-500 text-sm mt-1">Quản lý các báo cáo đã phân tích của bạn</p>
                            </div>
                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-8 bg-slate-50/30">
                            <BrandHistoryTable
                                analyses={savedAnalyses}
                                onLoad={handleLoad}
                                onDelete={handleDelete}
                            />
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

// Reusable Accordion Item
const AccordionItem: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all hover:shadow-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-slate-50 transition-colors"
            >
                <span className="font-bold text-slate-800">{title}</span>
                <span className={`transform transition-transform duration-200 text-slate-400 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>

            {isOpen && (
                <div className="p-4 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="pt-4 border-t border-slate-100">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

// TikTok Analysis Section (Pro UI - Accordion Style)
const TikTokAnalysisSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    const { analysis, brandName, profile } = result;

    // Safely access new metrics with fallbacks for old analyses
    const content = analysis.naturalContent;
    const metrics = analysis.interactionMetrics || {
        engagementRate: 0,
        postingFrequency: 'N/A',
        avgViewsPerPost: 0,
        valueScore: 0,
        viralScore: 0,
        adRatio: 'N/A'
    };
    const contentMetrics = analysis.contentMetrics || {
        totalViews: 0,
        totalLikes: analysis.channelHealth.totalLikes,
        totalShares: 0,
        totalSaves: 0
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Phân tích chuyên sâu (TikTok Pro)</h3>
                <p className="text-slate-500 text-sm">
                    Phân tích kênh <span className="font-bold text-slate-800">{brandName}</span> trên nền tảng TikTok.
                </p>
            </div>

            {/* PART A: DATA SUMMARY */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide px-1">PHẦN A: TỔNG HỢP SỐ LIỆU</h3>

                {/* Channel Metrics */}
                <AccordionItem title="Chỉ số Kênh" defaultOpen={true}>
                    <div className="space-y-3 py-2 text-sm">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="font-medium text-slate-600">Lượt theo dõi:</span>
                            <span className="font-bold text-slate-900">{analysis.channelHealth.totalFollowers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="font-medium text-slate-600">Đang theo dõi:</span>
                            <span className="font-bold text-slate-900">{profile.followingCount?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="font-medium text-slate-600">Số lượng bài đã đăng:</span>
                            <span className="font-bold text-slate-900">{content.postFormats.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-600">Tổng lượt thích (Heart):</span>
                            <span className="font-bold text-slate-900">{analysis.channelHealth.totalLikes.toLocaleString()}</span>
                        </div>
                    </div>
                </AccordionItem>

                {/* Content Metrics */}
                <AccordionItem title="Chỉ số Nội dung" defaultOpen={true}>
                    <div className="space-y-6 py-2 text-sm">
                        {/* Scope */}
                        <div>
                            <div className="font-bold text-slate-800 mb-2">Phạm vi bài đăng: {content.postFormats.total}</div>
                            <div className="pl-4 space-y-1 text-slate-600">
                                <div className="flex justify-between">
                                    <span>Bài ảnh:</span>
                                    <span className="font-medium text-slate-900">{content.postFormats.images}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Bài video:</span>
                                    <span className="font-medium text-slate-900">{content.postFormats.reels}</span>
                                </div>
                            </div>
                        </div>

                        {/* Interactions */}
                        <div>
                            <div className="font-bold text-slate-800 mb-2">Tương tác:</div>
                            <div className="pl-4 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Lượt xem:</span>
                                    <span className="font-bold text-slate-900">{contentMetrics.totalViews.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Lượt thích:</span>
                                    <span className="font-bold text-slate-900">{contentMetrics.totalLikes.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Lượt chia sẻ:</span>
                                    <span className="font-bold text-slate-900">{contentMetrics.totalShares.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Lượt lưu:</span>
                                    <span className="font-bold text-slate-900">{contentMetrics.totalSaves.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Interaction Indices */}
                        <div>
                            <div className="font-bold text-slate-800 mb-2">Chỉ số tương tác:</div>
                            <div className="pl-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Tỉ lệ tương tác:</span>
                                    <span className="font-bold text-blue-600">{metrics.engagementRate.toFixed(2)}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Tần suất đăng bài:</span>
                                    <span className="font-bold text-slate-900">{metrics.postingFrequency}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Lượt xem trung bình:</span>
                                    <span className="font-bold text-slate-900">{metrics.avgViewsPerPost.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Tỉ lệ giá trị (Value Score):</span>
                                    <span className="font-bold text-green-600">{metrics.valueScore.toLocaleString()}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Tỉ lệ lan truyền (Viral Score):</span>
                                    <span className="font-bold text-purple-600">{metrics.viralScore.toFixed(3)}%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Tỉ lệ bài quảng cáo:</span>
                                    <span className="font-bold text-slate-900">{metrics.adRatio}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </AccordionItem>
            </div>

            {/* PART B: STRATEGIC ANALYSIS */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide px-1">PHẦN B: PHÂN TÍCH CHIẾN LƯỢC</h3>

                {/* Brand Positioning */}
                <AccordionItem title="Định vị Thương hiệu" defaultOpen={true}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.brandPositioning}
                    </div>
                </AccordionItem>

                {/* Language & Message */}
                <AccordionItem title="Ngôn ngữ & Thông điệp" defaultOpen={false}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.messageLanguage}
                    </div>
                </AccordionItem>

                {/* Brand Voice */}
                <AccordionItem title="Giọng nói Thương hiệu" defaultOpen={false}>
                    <p className="text-sm text-slate-700 leading-relaxed py-2">
                        {analysis.strategy.brandVoice || "Chưa có dữ liệu."}
                    </p>
                </AccordionItem>

                {/* Shooting Style */}
                <AccordionItem title="Phong cách Quay dựng" defaultOpen={false}>
                    <p className="text-sm text-slate-700 leading-relaxed py-2">
                        {analysis.strategy.shootingStyle || "Chưa có dữ liệu."}
                    </p>
                </AccordionItem>

                {/* Content Structure */}
                <AccordionItem title="Cấu trúc Nội dung" defaultOpen={false}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.contentStructure}
                    </div>
                </AccordionItem>

                {/* Content Pillars */}
                <AccordionItem title="Tuyến Nội dung (Content Pillars)" defaultOpen={false}>
                    <div className="space-y-4 py-2">
                        {analysis.strategy.contentPillars?.length ? (
                            analysis.strategy.contentPillars.map((pillar: any, index: number) => (
                                <div key={index} className="border-l-2 border-blue-500 pl-4 space-y-1">
                                    <div className="font-bold text-slate-900">{pillar.title}</div>
                                    <div className="text-sm text-slate-600"><span className="font-medium text-slate-700">Mục tiêu:</span> {pillar.objective}</div>
                                    <div className="text-sm text-slate-600"><span className="font-medium text-slate-700">Cách thực hiện:</span> {pillar.execution}</div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-600">Chưa có dữ liệu tuyến nội dung.</p>
                        )}
                    </div>
                </AccordionItem>

                {/* Hashtags */}
                <AccordionItem title="Hashtags Phổ biến" defaultOpen={false}>
                    <div className="flex flex-wrap gap-2 py-2">
                        {analysis.strategy.hashtags?.length ? (
                            analysis.strategy.hashtags.map((tag, index) => (
                                <span key={index} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm">
                                    {tag.startsWith('#') ? tag : `#${tag}`}
                                </span>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500">Không có dữ liệu hashtag.</p>
                        )}
                    </div>
                </AccordionItem>

                {/* Chiến lược quảng cáo (Ad Strategy) */}
                <AccordionItem title="Chiến lược Quảng cáo" defaultOpen={false}>
                    <div className="space-y-3 py-2 text-sm text-slate-600">
                        <div>
                            <span className="font-bold text-slate-700 block mb-1">Mục tiêu chiến dịch:</span>
                            <ul className="list-disc ml-5 space-y-1">
                                {analysis.strategy.adStrategy.campaignObjectives?.length > 0
                                    ? analysis.strategy.adStrategy.campaignObjectives.map((obj, i) => <li key={i}>{obj}</li>)
                                    : <li>Chưa có dữ liệu</li>
                                }
                            </ul>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700 block mb-1">Phân tích Creative:</span>
                            <div className="leading-relaxed whitespace-pre-line">{analysis.strategy.adStrategy.creativeAnalysis || "Chưa có dữ liệu"}</div>
                        </div>
                    </div>
                </AccordionItem>

                {/* Top Content */}
                <AccordionItem title="Top Nội dung" defaultOpen={false}>
                    <p className="text-sm text-slate-700 leading-relaxed py-2">
                        {analysis.strategy.topContent || "Đang cập nhật..."}
                    </p>
                </AccordionItem>

                {/* Marketing Funnel */}
                <AccordionItem title="Phễu Marketing (Funnel)" defaultOpen={false}>
                    <div className="space-y-3 py-2 text-sm text-slate-600">
                        <div>
                            <span className="font-bold text-slate-700 block mb-1">ToFu (Nhận thức):</span>
                            <div className="leading-relaxed">{analysis.strategy.marketingFunnel.tofu}</div>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700 block mb-1">MoFu (Cân nhắc):</span>
                            <div className="leading-relaxed">{analysis.strategy.marketingFunnel.mofu}</div>
                        </div>
                        <div>
                            <span className="font-bold text-slate-700 block mb-1">BoFu (Chuyển đổi):</span>
                            <div className="leading-relaxed">{analysis.strategy.marketingFunnel.bofu}</div>
                        </div>
                    </div>
                </AccordionItem>

                {/* Engagement Strategy */}
                <AccordionItem title="Chiến lược Tương tác" defaultOpen={false}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.engagementStrategy || "Chưa có dữ liệu."}
                    </div>
                </AccordionItem>
            </div>
        </div>
    );
};

// Facebook Analysis Section (Classic UI - Stable)
const FacebookAnalysisSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    const { analysis, brandName } = result;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Phân tích</h3>
                <p className="text-slate-500 text-sm">
                    Phân tích thương hiệu <span className="font-bold text-slate-800">{brandName}</span> trên Facebook.
                </p>
            </div>

            {/* PART A: DATA SUMMARY */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide px-1">PHẦN A: TỔNG HỢP SỐ LIỆU</h3>

                {/* Channel Health */}
                <AccordionItem title="Sức khỏe Kênh" defaultOpen={true}>
                    <div className="space-y-3 py-2 text-sm">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="font-medium text-slate-600">Tổng lượt thích:</span>
                            <span className="font-bold text-slate-900">{analysis.channelHealth.totalLikes.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="font-medium text-slate-600">Đánh giá:</span>
                            <span className="font-bold text-slate-900">{analysis.channelHealth.totalReviews > 0 ? analysis.channelHealth.totalReviews.toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="font-medium text-slate-600">Tổng lượt theo dõi:</span>
                            <span className="font-bold text-slate-900">{analysis.channelHealth.totalFollowers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-600">Tỷ lệ L/F:</span>
                            <span className="font-bold text-slate-900">{(analysis.channelHealth.likeFollowerRatio * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                </AccordionItem>

                {/* Natural Content */}
                <AccordionItem title="Nội dung Tự nhiên" defaultOpen={true}>
                    <div className="space-y-4 py-2 text-sm">
                        <div>
                            <div className="font-bold text-slate-800 mb-2">Định dạng bài đăng:</div>
                            <div className="pl-4 space-y-1">
                                <div className="flex justify-between text-slate-600">
                                    <span>Reels:</span>
                                    <span className="font-medium text-slate-900">{analysis.naturalContent.postFormats.reels}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Images:</span>
                                    <span className="font-medium text-slate-900">{analysis.naturalContent.postFormats.images}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                            <span className="font-medium text-slate-600">Tổng số bài đăng:</span>
                            <span className="font-bold text-slate-900">{analysis.naturalContent.postFormats.total}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                            <span className="font-medium text-slate-600">Comment trung bình/bài:</span>
                            <span className="font-bold text-slate-900">{analysis.naturalContent.avgCommentsPerPost.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                            <span className="font-medium text-slate-600">Reaction trung bình/bài:</span>
                            <span className="font-bold text-slate-900">{analysis.naturalContent.avgReactionsPerPost.toFixed(1)}</span>
                        </div>
                    </div>
                </AccordionItem>

                {/* Ads Activity */}
                <AccordionItem title="Hoạt động Quảng cáo" defaultOpen={false}>
                    <div className="space-y-4 py-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-600">Tổng số quảng cáo đang chạy:</span>
                            <span className="font-bold text-slate-900">{analysis.adActivity.totalActiveAds}</span>
                        </div>

                        <div>
                            <div className="font-bold text-slate-800 mb-2">Phân bố định dạng (Quảng cáo):</div>
                            <div className="pl-4 space-y-1">
                                {Object.entries(analysis.adActivity.formatDistribution).map(([format, count]) => (
                                    <div key={format} className="flex justify-between text-slate-600">
                                        <span>{format}:</span>
                                        <span className="font-medium text-slate-900">{count} (Chiếm {analysis.adActivity.totalActiveAds > 0 ? (((count as number) / (analysis.adActivity.totalActiveAds as number)) * 100).toFixed(0) : 0}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="font-bold text-slate-800 mb-2">Phân bố CTA:</div>
                            <div className="pl-4 space-y-1">
                                {Object.entries(analysis.adActivity.ctaDistribution).map(([cta, count]) => (
                                    <div key={cta} className="flex justify-between text-slate-600">
                                        <span>{cta}:</span>
                                        <span className="font-medium text-slate-900">{count} (Chiếm {analysis.adActivity.totalActiveAds > 0 ? (((count as number) / (analysis.adActivity.totalActiveAds as number)) * 100).toFixed(0) : 0}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                {/* Comments */}
                <AccordionItem title="Bình luận" defaultOpen={false}>
                    <div className="space-y-3 py-2 text-sm">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="font-medium text-slate-600">Tổng Comment từ người dùng:</span>
                            <span className="font-bold text-slate-900">{analysis.comments?.totalUserComments?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                            <span className="font-medium text-slate-600">Tổng Comment từ thương hiệu:</span>
                            <span className="font-bold text-slate-900">{analysis.comments?.totalBrandComments?.toLocaleString() || 0}</span>
                        </div>
                        <div className="text-xs text-slate-400 italic pt-2">
                            Số liệu bình luận có thể sai số do chính sách nghiêm ngặt của Facebook.
                        </div>
                    </div>
                </AccordionItem>
            </div>

            {/* PART B: STRATEGIC ANALYSIS */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide px-1">PHẦN B: PHÂN TÍCH CHIẾN LƯỢC</h3>

                {/* Brand Positioning */}
                <AccordionItem title="Định vị Thương hiệu" defaultOpen={true}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.brandPositioning}
                    </div>
                </AccordionItem>

                {/* Language & Message */}
                <AccordionItem title="Ngôn ngữ & Thông điệp" defaultOpen={false}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.messageLanguage}
                    </div>
                </AccordionItem>

                {/* Content Structure */}
                <AccordionItem title="Cấu trúc & Công thức Nội dung" defaultOpen={false}>
                    <div className="space-y-3 py-2">
                        <div className="text-sm text-slate-600 leading-relaxed">
                            {analysis.strategy.contentStructure}
                        </div>
                        {Array.isArray(analysis.strategy.contentPillars) && analysis.strategy.contentPillars.length > 0 && typeof analysis.strategy.contentPillars[0] === 'string' && (
                            <div className="mt-2">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-2">Các tuyến nội dung chính:</div>
                                <div className="flex flex-wrap gap-2">
                                    {(analysis.strategy.contentPillars as string[]).map((pillar, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200">
                                            {pillar}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </AccordionItem>

                {/* Reel Transcript Analysis */}
                <AccordionItem title="Phân tích Reel Transcript" defaultOpen={false}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.reelsTranscriptAnalysis || 'Chưa có phân tích Transcript cho Reel.'}
                    </div>
                </AccordionItem>

                {/* Marketing Funnel */}
                <AccordionItem title="Phễu Marketing" defaultOpen={false}>
                    <div className="space-y-4 py-2 text-sm">
                        <div>
                            <div className="font-bold text-slate-700 mb-1">TOFU (Top of Funnel)</div>
                            <div className="text-slate-600 leading-relaxed">{analysis.strategy.marketingFunnel.tofu}</div>
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 mb-1">MOFU (Middle of Funnel)</div>
                            <div className="text-slate-600 leading-relaxed">{analysis.strategy.marketingFunnel.mofu}</div>
                        </div>
                        <div>
                            <div className="font-bold text-slate-700 mb-1">BOFU (Bottom of Funnel)</div>
                            <div className="text-slate-600 leading-relaxed">{analysis.strategy.marketingFunnel.bofu}</div>
                        </div>
                    </div>
                </AccordionItem>

                {/* Engagement Strategy */}
                <AccordionItem title="Chiến lược Tương tác & Bình luận" defaultOpen={false}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2 whitespace-pre-line">
                        {analysis.strategy.engagementStrategy}
                    </div>
                </AccordionItem>
            </div>
        </div>
    );
};

// Analysis Section Wrapper
const AnalysisSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    // Render different UI based on platform
    if (result.platform === 'tiktok') {
        return <TikTokAnalysisSection result={result} />;
    }
    // Default to Facebook/Classic layout for others for now
    return <FacebookAnalysisSection result={result} />;
};

// Evaluation Section Component
const EvaluationSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    const { evaluation } = result;

    return (
        <div className="space-y-4">
            {/* Strategy Summary */}
            <AccordionItem title="Tóm tắt Chiến lược" defaultOpen={true}>
                <div className="text-sm text-slate-700 leading-relaxed py-2">
                    {evaluation.strategySummary}
                </div>
            </AccordionItem>

            {/* Strengths */}
            <AccordionItem title="Điểm mạnh" defaultOpen={false}>
                <ul className="space-y-3 py-2">
                    {evaluation.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="font-bold text-slate-900 flex-shrink-0">•</span>
                            <span>{strength}</span>
                        </li>
                    ))}
                </ul>
            </AccordionItem>

            {/* Weaknesses & Opportunities */}
            <AccordionItem title="Điểm yếu & Cơ hội" defaultOpen={false}>
                <div className="space-y-4 py-2">
                    {/* Weaknesses */}
                    {evaluation.weaknesses.length > 0 && (
                        <div>
                            <div className="text-sm font-bold text-red-600 mb-2">Điểm yếu:</div>
                            <ul className="space-y-2">
                                {evaluation.weaknesses.map((weakness, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="font-bold text-red-500 flex-shrink-0">•</span>
                                        <span>{weakness}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Opportunities */}
                    {evaluation.opportunities.length > 0 && (
                        <div>
                            <div className="text-sm font-bold text-amber-600 mb-2">Cơ hội:</div>
                            <ul className="space-y-2">
                                {evaluation.opportunities.map((opportunity, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="font-bold text-amber-500 flex-shrink-0">•</span>
                                        <span>{opportunity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </AccordionItem>

            {/* Action Recommendations */}
            <AccordionItem title="Đề xuất hành động" defaultOpen={false}>
                <ul className="space-y-3 py-2">
                    {evaluation.actionRecommendations.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="font-bold text-slate-900 flex-shrink-0">•</span>
                            <span>{action}</span>
                        </li>
                    ))}
                </ul>
            </AccordionItem>
        </div>
    );
};

export default TikTokSpy;
