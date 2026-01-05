import React, { useState, useEffect } from 'react';
import { BrandSpyPlatform, BrandSpyResult } from '../types';
import { BrandSpyService } from '../services/brandSpyService';
import { analyzeBrandStrategy, evaluateBrandPerformance } from '../services/geminiService';
import { Search, Loader2, Save, History, X, Trash2, ExternalLink, MousePointerClick } from 'lucide-react';
import { Toast, ToastType } from './Toast';
import BrandHistoryTable from './BrandHistoryTable';

const GoogleAdsSpy = () => {
    const platform: BrandSpyPlatform = 'google_ads';
    const platformLabel = 'Soi Google Ads';

    const [keyword, setKeyword] = useState('');
    const [brandName, setBrandName] = useState('');
    const [postLimit, setPostLimit] = useState(20); // Default to 20 ads
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [result, setResult] = useState<BrandSpyResult | null>(null);
    const [selectedSection, setSelectedSection] = useState<'data' | 'analysis' | 'evaluation'>('data');

    // History
    const [showHistory, setShowHistory] = useState(false);
    const [savedAnalyses, setSavedAnalyses] = useState<BrandSpyResult[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const allAnalyses = await BrandSpyService.getBrandSpyAnalyses();
        const filtered = allAnalyses.filter(a => a.platform === platform);
        setSavedAnalyses(filtered);
    };

    const handleAnalyze = async () => {
        if (!keyword.trim()) {
            setToast({ message: 'Vui lòng nhập từ khóa', type: 'error' });
            return;
        }

        setLoading(true);
        setProgress('Đang quét Google Search...');

        try {
            let profile, posts, ads;
            let finalBrandName = brandName || keyword; // Default to keyword if no brand name

            // Fetch Real Data via Apify (Google Search Scraper)
            const realData = await BrandSpyService.fetchRealGoogleAdsData(keyword, {
                brandName: brandName || undefined,
                maxPosts: postLimit
            });

            profile = realData.profile;
            ads = realData.ads;
            posts = realData.posts; // Usually empty for Google Ads

            // Should update name if found better one? 
            // Google profile.name is usually just the keyword if not specific
            if (profile.name && profile.name !== keyword) {
                finalBrandName = profile.name;
            }

            if (ads.length === 0) {
                setToast({ message: 'Không tìm thấy quảng cáo nào cho từ khóa này.', type: 'warning' });
            } else {
                setProgress(`✅ Tìm thấy ${ads.length} quảng cáo.`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
            setProgress('Đang phân tích mẫu quảng cáo với AI...');

            // Analyze strategy with AI
            const analysis = await analyzeBrandStrategy(platform, profile, posts, ads);

            if (!analysis) {
                throw new Error('Không thể phân tích chiến lược');
            }

            setProgress('Đang đánh giá hiệu quả quảng cáo...');

            // Evaluate performance with AI
            const evaluation = await evaluateBrandPerformance(platform, finalBrandName, analysis);

            if (!evaluation) {
                throw new Error('Không thể đánh giá hiệu suất');
            }

            // Create result
            const newResult: BrandSpyResult = {
                id: crypto.randomUUID(),
                platform,
                targetUrl: keyword, // Store keyword as targetUrl for Google Ads
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
                message: `✅ Phân tích hoàn tất!`,
                type: 'success'
            });

        } catch (error: any) {
            console.error('Analysis error:', error);
            setToast({
                message: error.message || 'Lỗi khi phân tích',
                type: 'error'
            });
        } finally {
            setLoading(false);
            setProgress('');
        }
    };

    const handleSave = async () => {
        if (!result) return;
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
        setKeyword(analysis.targetUrl);
        setBrandName(analysis.brandName);
        setSelectedSection('data');
        setShowHistory(false);
        setToast({ message: 'Đã tải phân tích!', type: 'success' });
    };

    const handleDelete = async (id: string) => {
        if (confirm('Bạn có chắc muốn xóa?')) {
            const success = await BrandSpyService.deleteBrandSpyAnalysis(id);
            if (success) {
                await loadHistory();
                setToast({ message: 'Đã xóa!', type: 'success' });
            }
        }
    };

    return (
        <div className="w-full h-full overflow-hidden flex flex-col bg-slate-50">
            {/* Header Area */}
            <div className="flex-shrink-0 px-8 py-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{platformLabel}</h2>
                    <p className="text-slate-500 text-sm mt-1">Phân tích chiến lược từ khóa và mẫu quảng cáo Google Ads</p>
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
                                    <p className="text-slate-500 text-sm">Nhập từ khóa hoặc tên thương hiệu để AI tìm kiếm quảng cáo Google.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Keyword Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">
                                        Từ khóa / Brand Name
                                    </label>
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value)}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-900 font-medium placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:ring-0 transition-all outline-none"
                                        placeholder="VD: iphone 15 pro max, highlands coffee..."
                                    />
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

// Data Section
const DataSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Dữ liệu</h3>
                <div className="text-sm text-slate-500">
                    Tìm thấy <span className="font-bold text-slate-900">{result.ads.length}</span> quảng cáo cho từ khóa <span className="font-bold text-slate-900">"{result.targetUrl}"</span>.
                </div>
            </div>

            {/* Advertising Data */}
            <div className="space-y-4">
                <h4 className="text-xl font-bold text-slate-800">Danh sách Quảng cáo</h4>

                {result.ads.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Không tìm thấy quảng cáo nào cho từ khóa này.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {result.ads.map((ad, index) => (
                            <div key={ad.id} className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white uppercase tracking-wider">Ad</span>
                                        <span className="text-xs text-slate-500 truncate max-w-[200px]">{ad.displayedUrl || 'Display URL'}</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-400">#{index + 1}</span>
                                </div>

                                {/* Ad Headline - Blue like Google */}
                                <h5 className="text-blue-700 font-medium text-lg leading-snug mb-1 hover:underline cursor-pointer">
                                    {ad.content.split('\n\n')[0]}
                                </h5>

                                {/* Ad Description */}
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                    {ad.content.split('\n\n')[1] || ''}
                                </p>

                                {/* Metadata if any */}
                                <div className="mt-4 pt-3 border-t border-slate-50 flex gap-4 text-xs text-slate-400">
                                    <div className="flex items-center gap-1">
                                        <MousePointerClick size={12} />
                                        CTA: {ad.cta || 'Mặc định'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Simulated Keyword Data if available in metadata */}
            {result.metadata?.queries && (
                <div className="space-y-4">
                    <h4 className="text-xl font-bold text-slate-800">Từ khóa đã quét</h4>
                    <div className="flex flex-wrap gap-2">
                        {(result.metadata.queries as string[]).map((q, i) => (
                            <span key={i} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm">
                                {q}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Reusable Accordion Item
const AccordionItem: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

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


// Analysis Section - Reuse structure but adapted for Ads
const AnalysisSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    const { analysis, brandName } = result;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Phân tích</h3>
                <p className="text-slate-500 text-sm mt-1">Phân tích chiến lược quảng cáo tìm kiếm của <span className="font-bold text-slate-900">{brandName}</span></p>
            </div>

            <div className="space-y-4">
                <AccordionItem title="Chiến lược Quảng cáo (Ad Strategy)" defaultOpen={true}>
                    <div className="space-y-4 py-2 text-sm">
                        <div>
                            <div className="font-bold text-slate-700 mb-2">Mục tiêu chiến dịch (Dự đoán):</div>
                            <div className="flex flex-wrap gap-2">
                                {analysis.strategy.adStrategy.campaignObjectives.map((obj, i) => (
                                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-100">
                                        {obj}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-50">
                            <div className="font-bold text-slate-700 mb-2">Phân tích Mẫu quảng cáo:</div>
                            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                {analysis.strategy.adStrategy.creativeAnalysis}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-slate-50">
                            <div className="font-bold text-slate-700 mb-2">Góc độ tiếp cận (Ad Angles):</div>
                            <ul className="list-disc pl-5 space-y-1 text-slate-600">
                                {analysis.strategy.adStrategy.adAngles.map((angle, i) => (
                                    <li key={i}>{angle}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </AccordionItem>

                <AccordionItem title="Định vị & Thông điệp" defaultOpen={false}>
                    <div className="space-y-3 py-2 text-sm text-slate-600">
                        <div className="leading-relaxed">
                            <span className="font-bold text-slate-800">Định vị: </span>
                            {analysis.strategy.brandPositioning}
                        </div>
                        <div className="leading-relaxed border-t border-slate-50 pt-2">
                            <span className="font-bold text-slate-800">Thông điệp chính: </span>
                            {analysis.strategy.messageLanguage}
                        </div>
                    </div>
                </AccordionItem>
            </div>
        </div>
    );
};

// Evaluation Section
const EvaluationSection: React.FC<{ result: BrandSpyResult }> = ({ result }) => {
    const { evaluation } = result;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Đánh giá</h3>
                <p className="text-slate-500 text-sm mt-1">Đánh giá hiệu quả và đề xuất tối ưu</p>
            </div>

            <div className="space-y-4">
                <AccordionItem title="Tóm tắt Chiến lược" defaultOpen={true}>
                    <div className="text-sm text-slate-700 leading-relaxed py-2">
                        {evaluation.strategySummary}
                    </div>
                </AccordionItem>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
                        <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Điểm mạnh
                        </h4>
                        <ul className="space-y-2">
                            {evaluation.strengths.map((s, i) => (
                                <li key={i} className="text-sm text-green-900 leading-snug flex items-start gap-2">
                                    <span>•</span> {s}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                        <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Điểm yếu & Cơ hội
                        </h4>
                        <ul className="space-y-2">
                            {evaluation.weaknesses.map((w, i) => (
                                <li key={i} className="text-sm text-red-900 leading-snug flex items-start gap-2">
                                    <span>•</span> {w}
                                </li>
                            ))}
                            {evaluation.opportunities.map((o, i) => (
                                <li key={i + 100} className="text-sm text-red-800 italic leading-snug flex items-start gap-2 opacity-80">
                                    <span>○</span> {o}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <AccordionItem title="Đề xuất Hành động (Action Plan)" defaultOpen={true}>
                    <div className="py-2">
                        <ul className="space-y-3">
                            {evaluation.actionRecommendations.map((action, i) => (
                                <li key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm text-slate-700 font-medium pt-0.5">{action}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </AccordionItem>
            </div>
        </div>
    );
};

export default GoogleAdsSpy;