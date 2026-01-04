import React, { useState } from 'react';
import { BrandSpyPlatform, BrandSpyResult } from '../types';
import { BrandSpyService } from '../services/brandSpyService';
import { analyzeBrandStrategy, evaluateBrandPerformance } from '../services/geminiService';
import { Search, Loader2, Save, History, X, Trash2, ExternalLink } from 'lucide-react';
import { Toast, ToastType } from './Toast';

interface BrandSpyProps {
    platform: BrandSpyPlatform;
    platformLabel: string;
}

const BrandSpy: React.FC<BrandSpyProps> = ({ platform, platformLabel }) => {
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
            setToast({ message: 'Vui l├▓ng nhß║¡p URL/Page ID', type: 'error' });
            return;
        }

        setLoading(true);
        setProgress('─Éang thu thß║¡p dß╗» liß╗çu...');

        try {
            let profile, posts, ads;

            // For Facebook: Use REAL API data
            if (platform === 'facebook') {
                setProgress(`─Éang kß║┐t nß╗æi Facebook API (Lß║Ñy ${postLimit} b├ái)...`);
                const realData = await BrandSpyService.fetchRealFacebookData(targetUrl, {
                    brandName: brandName || undefined,
                    maxPosts: postLimit
                });

                profile = realData.profile;
                posts = realData.posts;
                ads = realData.ads;

                // If brand name was empty, use the one from profile
                if (!brandName && profile.name) {
                    setBrandName(profile.name);
                }

                setProgress(`Γ£à ─É├ú lß║Ñy ${posts.length} posts v├á ${ads.length} ads thß╗▒c tß║┐`);

                // Wait a bit to show success message
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                // For other platforms: Use mock data (for now)
                setProgress('─Éang tß║ío dß╗» liß╗çu demo...');
                profile = BrandSpyService.generateMockProfile(platform, brandName, targetUrl);
                posts = BrandSpyService.generateMockPosts(platform, 30);
                ads = BrandSpyService.generateMockAds(platform, 15);
            }

            setProgress('─Éang ph├ón t├¡ch chiß║┐n l╞░ß╗úc vß╗¢i AI...');

            // Analyze strategy with AI
            const analysis = await analyzeBrandStrategy(platform, profile, posts, ads);

            if (!analysis) {
                throw new Error('Kh├┤ng thß╗â ph├ón t├¡ch chiß║┐n l╞░ß╗úc');
            }

            setProgress('─Éang ─æ├ính gi├í hiß╗çu suß║Ñt vß╗¢i AI...');

            // Evaluate performance with AI
            const evaluation = await evaluateBrandPerformance(platform, brandName, analysis);

            if (!evaluation) {
                throw new Error('Kh├┤ng thß╗â ─æ├ính gi├í hiß╗çu suß║Ñt');
            }

            // Create result
            const newResult: BrandSpyResult = {
                id: crypto.randomUUID(),
                platform,
                targetUrl,
                brandName,
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
                message: platform === 'facebook'
                    ? `Γ£à Ph├ón t├¡ch ho├án tß║Ñt vß╗¢i dß╗» liß╗çu THß║¼T tß╗½ Facebook!`
                    : 'Ph├ón t├¡ch ho├án tß║Ñt!',
                type: 'success'
            });
        } catch (error: any) {
            console.error('Analysis error:', error);
            const errorMsg = error.message || '─É├ú xß║úy ra lß╗ùi khi ph├ón t├¡ch';

            setToast({
                message: errorMsg.includes('token') || errorMsg.includes('permissions')
                    ? 'Γ¥î Lß╗ùi API: Kiß╗âm tra lß║íi Access Token v├á permissions'
                    : `Γ¥î ${errorMsg}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
            setProgress('');
        }
    };

    const handleSave = async () => {
        if (!result) {
            setToast({ message: 'Ch╞░a c├│ dß╗» liß╗çu ─æß╗â l╞░u!', type: 'error' });
            return;
        }

        const success = await BrandSpyService.saveBrandSpyAnalysis(result);
        if (success) {
            await loadHistory();
            setToast({ message: '─É├ú l╞░u ph├ón t├¡ch!', type: 'success' });
        } else {
            setToast({ message: 'Lß╗ùi khi l╞░u!', type: 'error' });
        }
    };

    const handleLoad = (analysis: BrandSpyResult) => {
        setResult(analysis);
        setTargetUrl(analysis.targetUrl);
        setBrandName(analysis.brandName);
        setSelectedSection('data');
        setShowHistory(false);
        setToast({ message: '─É├ú tß║úi ph├ón t├¡ch!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        const success = await BrandSpyService.deleteBrandSpyAnalysis(id);
        if (success) {
            await loadHistory();
            setToast({ message: '─É├ú x├│a!', type: 'success' });
        } else {
            setToast({ message: 'Lß╗ùi khi x├│a!', type: 'error' });
        }
    };

    return (
        <div className="w-full h-full overflow-auto bg-slate-50/30 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200">
                            <Search className="w-6 h-6 text-slate-700" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{platformLabel}</h2>
                            <p className="text-slate-500 text-sm mt-0.5">Ph├ón t├¡ch chiß║┐n l╞░ß╗úc th╞░╞íng hiß╗çu ─æß╗æi thß╗º chi tiß║┐t</p>
                        </div>
                        <div className="flex gap-2 ml-auto">
                            {result && (
                                <button
                                    onClick={handleSave}
                                    className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm flex items-center gap-2 text-sm font-bold transition-all"
                                >
                                    <Save size={16} />
                                    L╞░u
                                </button>
                            )}
                            <button
                                onClick={() => setShowHistory(true)}
                                className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 shadow-sm flex items-center gap-2 text-sm font-bold transition-all"
                            >
                                <History size={16} />
                                Lß╗ïch sß╗¡
                            </button>
                        </div>
                    </div>
                </div>

                {/* Input Form */}
                {!result && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-5">Th├┤ng tin ph├ón t├¡ch</h3>

                        <div className="space-y-5">
                            {/* URL / Page ID */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    URL / Page ID *
                                </label>
                                <input
                                    type="text"
                                    value={targetUrl}
                                    onChange={(e) => setTargetUrl(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-400/10 transition-all outline-none"
                                    placeholder="VD: https://facebook.com/highlands hoß║╖c Page ID"
                                />
                            </div>

                            {/* Post Limit Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Sß╗æ l╞░ß╗úng b├ái viß║┐t ph├ón t├¡ch
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[1, 5, 10, 30].map((limit) => (
                                        <button
                                            key={limit}
                                            onClick={() => setPostLimit(limit)}
                                            className={`py-2 rounded-xl text-sm font-bold border transition-all ${postLimit === limit
                                                ? 'bg-slate-800 text-white border-slate-800'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            {limit} b├ái
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Analyze Button */}
                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="w-full mt-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {progress || '─Éang ph├ón t├¡ch...'}
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        Bß║»t ─æß║ºu ph├ón t├¡ch
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Results */}
                {result && (
                    <div className="flex gap-6">
                        {/* Left Sidebar Navigation */}
                        <div className="w-64 flex-shrink-0">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm sticky top-8">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 px-2">Ph├ón t├¡ch</h3>
                                <div className="space-y-1">
                                    {[
                                        { id: 'data' as const, label: 'Dß╗» liß╗çu', icon: '≡ƒôè' },
                                        { id: 'analysis' as const, label: 'Ph├ón t├¡ch', icon: '≡ƒöì' },
                                        { id: 'evaluation' as const, label: '─É├ính gi├í', icon: 'Γ¡É' },
                                    ].map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setSelectedSection(section.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${selectedSection === section.id
                                                ? 'bg-slate-100 text-slate-900 border border-slate-200'
                                                : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className="mr-2">{section.icon}</span>
                                            {section.label}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setResult(null)}
                                    className="w-full mt-4 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all"
                                >
                                    Ph├ón t├¡ch mß╗¢i
                                </button>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="flex-1">
                            {selectedSection === 'data' && (
                                <DataSection result={result} />
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <History size={20} /> Lß╗ïch sß╗¡ {platformLabel}
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3">
                            {savedAnalyses.length === 0 ? (
                                <div className="text-center py-10 text-slate-400">Ch╞░a c├│ ph├ón t├¡ch n├áo.</div>
                            ) : (
                                savedAnalyses.map((analysis) => (
                                    <div key={analysis.id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group">
                                        <div className="flex items-start gap-3">
                                            <button onClick={() => handleLoad(analysis)} className="flex-1 text-left">
                                                <div className="font-bold text-slate-800 mb-1">{analysis.brandName}</div>
                                                <div className="text-xs text-slate-400 mb-2">
                                                    {new Date(analysis.createdAt).toLocaleDateString('vi-VN')}
                                                </div>
                                                <div className="text-xs text-slate-600 font-bold">{analysis.targetUrl}</div>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(analysis.id)}
                                                className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

// Data Section Component with Accordion UI
const DataSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Dß╗» liß╗çu</h3>
                <p className="text-slate-500 text-sm">
                    Dß╗» liß╗çu th├┤ tß╗½ {result.platform === 'facebook' ? 'Facebook' : 'Nß╗ün tß║úng'} cß╗ºa th╞░╞íng hiß╗çu {result.brandName} vß╗¢i {result.posts.length} b├ái ─æ─âng gß║ºn nhß║Ñt.
                </p>
            </div>

            {/* Profile Data */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Dß╗» liß╗çu Hß╗ô s╞í</h3>
                <AccordionItem title="Chi tiß║┐t Hß╗ô s╞í" defaultOpen={true}>
                    <div className="space-y-3 py-2">
                        {Object.entries(result.profile).map(([key, value]) => {
                            if (value === undefined || value === null || value === '') return null;
                            return (
                                <div key={key} className="grid grid-cols-[200px_1fr] gap-4 text-sm">
                                    <span className="font-bold text-slate-700">
                                        {key === 'id' ? 'id' :
                                            key === 'url' ? 'url' :
                                                key === 'name' ? 'name' :
                                                    key === 'email' ? 'email' :
                                                        key === 'phone' ? 'phone' :
                                                            key === 'website' ? 'website' :
                                                                key === 'category' ? 'category' :
                                                                    key === 'about' || key === 'pageIntro' ? 'pageIntro' :
                                                                        key === 'followers' || key === 'followerCount' ? 'followerCount' :
                                                                            key === 'likes' || key === 'likeCount' ? 'likeCount' :
                                                                                key === 'verified' ? 'verified' :
                                                                                    key}
                                        :
                                    </span>
                                    <span className="text-slate-600 break-words">{String(value)}</span>
                                </div>
                            );
                        })}
                    </div>
                </AccordionItem>
            </div>

            {/* Posts Data */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Dß╗» liß╗çu B├ái ─æ─âng tß╗▒ nhi├¬n</h3>
                <div className="space-y-3">
                    {result.posts.map((post, index) => {
                        // Determine type
                        const type = post.isReel ? 'Reel' : (post.media && post.media.length > 0 ? 'Image' : 'Text');

                        return (
                            <AccordionItem
                                key={post.id}
                                title={`B├ái ─æ─âng ${index + 1} (Loß║íi: ${type})`}
                            >
                                <div className="space-y-4 py-2 text-sm">
                                    {/* Description */}
                                    <div className="space-y-1">
                                        <div className="font-bold text-slate-900">M├┤ tß║ú:</div>
                                        <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                            {post.description}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-slate-500">Thß╗¥i gian: </span>
                                            <span className="text-slate-700 font-medium">
                                                {new Date(post.time).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Reactions: </span>
                                            <span className="text-slate-700 font-medium">{post.reactions.toLocaleString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Comments: </span>
                                            <span className="text-slate-700 font-medium">{post.comments.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Links */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                        <div>
                                            <span className="text-slate-500">URL: </span>
                                            <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline">
                                                {post.url}
                                            </a>
                                        </div>
                                        {post.media && post.media.length > 0 && (
                                            <div>
                                                <span className="text-slate-500">Media: </span>
                                                <a href={post.media[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline">
                                                    Click to view in new tab
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </AccordionItem>
                        );
                    })}
                </div>
            </div>

            {/* Ads Data */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Dß╗» liß╗çu Quß║úng c├ío</h3>
                <div className="space-y-3">
                    {result.ads.length === 0 ? (
                        <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-500 border border-slate-100 italic">
                            Ch╞░a t├¼m thß║Ñy dß╗» liß╗çu quß║úng c├ío cho trang n├áy.
                        </div>
                    ) : (
                        result.ads.map((ad, index) => (
                            <AccordionItem
                                key={ad.id}
                                title={`Quß║úng c├ío ${index + 1}`}
                            >
                                <div className="space-y-4 py-2 text-sm">
                                    {/* Description */}
                                    <div className="space-y-1">
                                        <div className="font-bold text-slate-900">Nß╗Öi dung:</div>
                                        <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                            {ad.content}
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <div>
                                        <span className="text-slate-500">CTA: </span>
                                        <span className="text-slate-700 font-medium">{ad.cta || 'No button'}</span>
                                    </div>

                                    {/* Platform */}
                                    <div>
                                        <span className="text-slate-500">Platform: </span>
                                        <span className="text-slate-700 font-medium uppercase">{ad.platform}</span>
                                    </div>

                                    {/* Media Link */}
                                    {ad.media && ad.media.length > 0 && (
                                        <div>
                                            <span className="text-slate-500">Media: </span>
                                            <a href={ad.media[0]} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline">
                                                Click to view in new tab
                                            </a>
                                        </div>
                                    )}

                                    {/* Is Active */}
                                    <div>
                                        <span className="text-slate-500">Is_active: </span>
                                        <span className={ad.isActive ? "text-green-600 font-bold" : "text-slate-700"}>
                                            {String(ad.isActive)}
                                        </span>
                                    </div>

                                    {/* Ad Archive ID */}
                                    {ad.adArchiveId && (
                                        <div>
                                            <span className="text-slate-500">Ad_archive_id: </span>
                                            <span className="text-slate-700 font-mono">{ad.adArchiveId}</span>
                                        </div>
                                    )}
                                </div>
                            </AccordionItem>
                        ))
                    )}
                </div>
            </div>
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

// Analysis Section Component
const AnalysisSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    const { analysis, brandName } = result;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Ph├ón t├¡ch</h3>
                <p className="text-slate-500 text-sm">
                    Ph├ón t├¡ch th╞░╞íng hiß╗çu {brandName} tr├¬n {result.platform === 'facebook' ? 'Facebook' : 'Nß╗ün tß║úng'}.
                </p>
            </div>

            {/* PART A: DATA SUMMARY */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">PHß║ªN A: Tß╗öNG Hß╗óP Sß╗É LIß╗åU</h3>

                {/* Channel Health */}
                <AccordionItem title="Sß╗⌐c khß╗Åe K├¬nh" defaultOpen={false}>
                    <div className="space-y-3 py-2">
                        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <span className="font-medium text-slate-700">Tß╗òng l╞░ß╗út th├¡ch:</span>
                            <span className="font-bold text-slate-900">{analysis.channelHealth.totalLikes.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <span className="font-medium text-slate-700">─É├ính gi├í:</span>
                            <span className="font-bold text-slate-900">{analysis.channelHealth.totalReviews > 0 ? analysis.channelHealth.totalReviews.toLocaleString() : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <span className="font-medium text-slate-700">Tß╗òng l╞░ß╗út theo d├╡i:</span>
                            <span className="font-bold text-slate-900">{analysis.channelHealth.totalFollowers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <span className="font-medium text-slate-700">Tß╗╖ lß╗ç L/F:</span>
                            <span className="font-bold text-slate-900">{(analysis.channelHealth.likeFollowerRatio * 100).toFixed(2)}%</span>
                        </div>
                    </div>
                </AccordionItem>

                {/* Natural Content */}
                <AccordionItem title="Nß╗Öi dung Tß╗▒ nhi├¬n" defaultOpen={false}>
                    <div className="space-y-4 py-2 text-sm">
                        <div>
                            <div className="font-bold text-slate-700 mb-2">─Éß╗ïnh dß║íng b├ái ─æ─âng:</div>
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
                            <span className="font-medium text-slate-700">Tß╗òng sß╗æ b├ái ─æ─âng:</span>
                            <span className="font-bold text-slate-900">{analysis.naturalContent.postFormats.total}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                            <span className="font-medium text-slate-700">Comment trung b├¼nh/b├ái:</span>
                            <span className="font-bold text-slate-900">{analysis.naturalContent.avgCommentsPerPost.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                            <span className="font-medium text-slate-700">Reaction trung b├¼nh/b├ái:</span>
                            <span className="font-bold text-slate-900">{analysis.naturalContent.avgReactionsPerPost.toFixed(1)}</span>
                        </div>
                    </div>
                </AccordionItem>

                {/* Ads Activity */}
                <AccordionItem title="Hoß║ít ─æß╗Öng Quß║úng c├ío" defaultOpen={false}>
                    <div className="space-y-4 py-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-slate-700">Tß╗òng sß╗æ quß║úng c├ío ─æang chß║íy:</span>
                            <span className="font-bold text-slate-900">{analysis.adActivity.totalActiveAds}</span>
                        </div>

                        <div>
                            <div className="font-bold text-slate-700 mb-2">Ph├ón bß╗æ ─Éß╗ïnh dß║íng (Quß║úng c├ío):</div>
                            <div className="pl-4 space-y-1">
                                {Object.entries(analysis.adActivity.formatDistribution).map(([format, count]) => (
                                    <div key={format} className="flex justify-between text-slate-600">
                                        <span>{format}:</span>
                                        <span className="font-medium text-slate-900">{count} (Chiß║┐m {analysis.adActivity.totalActiveAds > 0 ? ((count / analysis.adActivity.totalActiveAds) * 100).toFixed(0) : 0}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="font-bold text-slate-700 mb-2">Ph├ón bß╗æ CTA:</div>
                            <div className="pl-4 space-y-1">
                                {Object.entries(analysis.adActivity.ctaDistribution).map(([cta, count]) => (
                                    <div key={cta} className="flex justify-between text-slate-600">
                                        <span>{cta}:</span>
                                        <span className="font-medium text-slate-900">{count} (Chiß║┐m {analysis.adActivity.totalActiveAds > 0 ? ((count / analysis.adActivity.totalActiveAds) * 100).toFixed(0) : 0}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </AccordionItem>

                {/* Comments */}
                <AccordionItem title="B├¼nh luß║¡n" defaultOpen={false}>
                    <div className="space-y-3 py-2 text-sm">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <span className="font-medium text-slate-700">Tß╗òng Comment tß╗½ ng╞░ß╗¥i d├╣ng:</span>
                            <span className="font-bold text-slate-900">{analysis.comments?.totalUserComments?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <span className="font-medium text-slate-700">Tß╗òng Comment tß╗½ th╞░╞íng hiß╗çu:</span>
                            <span className="font-bold text-slate-900">{analysis.comments?.totalBrandComments?.toLocaleString() || 0}</span>
                        </div>
                        <div className="text-xs text-slate-400 italic pt-2">
                            Sß╗æ liß╗çu b├¼nh luß║¡n c├│ thß╗â sai sß╗æ do ch├¡nh s├ích nghi├¬m ngß║╖t cß╗ºa Facebook.
                        </div>
                    </div>
                </AccordionItem>
            </div>

            {/* PART B: STRATEGIC ANALYSIS */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">PHß║ªN B: PH├éN T├ìCH CHIß║╛N L╞»ß╗óC</h3>

                {/* Brand Positioning */}
                <AccordionItem title="─Éß╗ïnh vß╗ï Th╞░╞íng hiß╗çu" defaultOpen={true}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.brandPositioning}
                    </div>
                </AccordionItem>

                {/* Language & Message */}
                <AccordionItem title="Ng├┤n ngß╗» & Th├┤ng ─æiß╗çp" defaultOpen={false}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.messageLanguage}
                    </div>
                </AccordionItem>

                {/* Content Structure */}
                <AccordionItem title="Cß║Ñu tr├║c & C├┤ng thß╗⌐c Nß╗Öi dung" defaultOpen={false}>
                    <div className="space-y-3 py-2">
                        <div className="text-sm text-slate-600 leading-relaxed">
                            {analysis.strategy.contentStructure}
                        </div>
                        {analysis.strategy.contentPillars.length > 0 && (
                            <div className="mt-2">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-2">C├íc tuyß║┐n nß╗Öi dung ch├¡nh:</div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.strategy.contentPillars.map((pillar, idx) => (
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
                <AccordionItem title="Ph├ón t├¡ch Reel Transcript" defaultOpen={false}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2">
                        {analysis.strategy.reelsTranscriptAnalysis || 'Ch╞░a c├│ ph├ón t├¡ch Transcript cho Reel.'}
                    </div>
                </AccordionItem>

                {/* Marketing Funnel */}
                <AccordionItem title="Phß╗àu Marketing" defaultOpen={false}>
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
                <AccordionItem title="Chiß║┐n l╞░ß╗úc T╞░╞íng t├íc & B├¼nh luß║¡n" defaultOpen={false}>
                    <div className="text-sm text-slate-600 leading-relaxed py-2 whitespace-pre-line">
                        {analysis.strategy.engagementStrategy}
                    </div>
                </AccordionItem>
            </div>
        </div>
    );
};

// Evaluation Section Component
const EvaluationSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    const { evaluation } = result;

    return (
        <div className="space-y-4">
            {/* Strategy Summary */}
            <AccordionItem title="T├│m tß║»t Chiß║┐n l╞░ß╗úc" defaultOpen={true}>
                <div className="text-sm text-slate-700 leading-relaxed py-2">
                    {evaluation.strategySummary}
                </div>
            </AccordionItem>

            {/* Strengths */}
            <AccordionItem title="─Éiß╗âm mß║ính" defaultOpen={false}>
                <ul className="space-y-3 py-2">
                    {evaluation.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="font-bold text-slate-900 flex-shrink-0">ΓÇó</span>
                            <span>{strength}</span>
                        </li>
                    ))}
                </ul>
            </AccordionItem>

            {/* Weaknesses & Opportunities */}
            <AccordionItem title="─Éiß╗âm yß║┐u & C╞í hß╗Öi" defaultOpen={false}>
                <div className="space-y-4 py-2">
                    {/* Weaknesses */}
                    {evaluation.weaknesses.length > 0 && (
                        <div>
                            <div className="text-sm font-bold text-red-600 mb-2">─Éiß╗âm yß║┐u:</div>
                            <ul className="space-y-2">
                                {evaluation.weaknesses.map((weakness, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="font-bold text-red-500 flex-shrink-0">ΓÇó</span>
                                        <span>{weakness}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Opportunities */}
                    {evaluation.opportunities.length > 0 && (
                        <div>
                            <div className="text-sm font-bold text-amber-600 mb-2">C╞í hß╗Öi:</div>
                            <ul className="space-y-2">
                                {evaluation.opportunities.map((opportunity, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                        <span className="font-bold text-amber-500 flex-shrink-0">ΓÇó</span>
                                        <span>{opportunity}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </AccordionItem>

            {/* Action Recommendations */}
            <AccordionItem title="─Éß╗ü xuß║Ñt h├ánh ─æß╗Öng" defaultOpen={false}>
                <ul className="space-y-3 py-2">
                    {evaluation.actionRecommendations.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="font-bold text-slate-900 flex-shrink-0">ΓÇó</span>
                            <span>{action}</span>
                        </li>
                    ))}
                </ul>
            </AccordionItem>
        </div>
    );
};

export default BrandSpy;
