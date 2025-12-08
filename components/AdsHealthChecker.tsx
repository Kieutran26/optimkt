import React, { useState } from 'react';
import { AdsHealthInput, AdsHealthResult } from '../types';
import { checkAdsHealth } from '../services/geminiService';
import { Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, Scissors, RefreshCw, Layout, Monitor, Globe } from 'lucide-react';

interface Props {
    isActive: boolean;
}

const AdsHealthChecker: React.FC<Props> = ({ isActive }) => {
    const [input, setInput] = useState<AdsHealthInput>({
        platform: 'Facebook Ads',
        industry: '',
        dataMode: 'paste',
        manualMetrics: { spend: 0, impressions: 0, clicks: 0, conversions: 0 },
        rawText: ''
    });
    const [result, setResult] = useState<AdsHealthResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState('');
    const [error, setError] = useState('');

    if (!isActive) return null;

    const handleAnalyze = async () => {
        if (!input.industry) {
            setError('Vui lòng nhập ngành hàng của bạn (VD: Thời trang, Bất động sản)');
            return;
        }
        if (input.dataMode === 'paste' && !input.rawText) {
            setError('Vui lòng dán dữ liệu chiến dịch của bạn');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await checkAdsHealth(input, (step) => {
                if (step.includes('Initializing')) setLoadingStep('Khởi động bác sĩ AI...');
                else if (step.includes('Analyzing')) setLoadingStep('Đang phân tích metrics & benchmark...');
                else if (step.includes('Formulating')) setLoadingStep('Đang lập phác đồ điều trị...');
                else setLoadingStep(step);
            });
            if (data) {
                setResult(data);
            } else {
                setError('Không thể phân tích dữ liệu. Vui lòng thử lại với metrics rõ ràng hơn.');
            }
        } catch (err) {
            setError('Đã xảy ra lỗi trong quá trình phân tích.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-rose-600 bg-rose-50 border-rose-200';
    };

    const getTrafficLight = (assessment: string) => {
        const lower = assessment.toLowerCase();
        // Good: Tốt, Rẻ, Cao (CTR/CR), Thấp (CPM/CPC - usually context dependent but 'Tốt' covers most)
        if (lower.includes('tốt') || lower.includes('rẻ') || lower.includes('good')) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
        if (lower.includes('cao') && (lower.includes('ctr') || lower.includes('cr') || lower.includes('conversion'))) return <CheckCircle className="w-4 h-4 text-emerald-500" />;

        // Warning
        if (lower.includes('cảnh báo') || lower.includes('warning') || lower.includes('trung bình')) return <AlertTriangle className="w-4 h-4 text-amber-500" />;

        // Bad: Thấp (CTR/CR), Cao (CPM/CPC), Đắt
        return <XCircle className="w-4 h-4 text-rose-500" />;
    };

    const getActionIcon = (action: string) => {
        const lower = action.toLowerCase();
        if (lower.includes('trim') || lower.includes('cắt giảm')) return <Scissors className="w-5 h-5 text-rose-500" />;
        if (lower.includes('refresh') || lower.includes('làm mới') || lower.includes('sáng tạo')) return <RefreshCw className="w-5 h-5 text-blue-500" />;
        if (lower.includes('structure') || lower.includes('cấu trúc')) return <Layout className="w-5 h-5 text-purple-500" />;
        if (lower.includes('scale') || lower.includes('mở rộng') || lower.includes('tăng ngân sách')) return <TrendingUp className="w-5 h-5 text-emerald-500" />;
        return <Activity className="w-5 h-5 text-slate-500" />;
    };

    return (
        <div className="w-full p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm shadow-slate-100/50">
                        <Activity className="w-6 h-6 text-rose-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chẩn đoán Sức khỏe Ads</h1>
                        <p className="text-slate-500 text-sm mt-0.5">AI chẩn đoán "bệnh" chiến dịch dựa trên benchmark ngành & nền tảng</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left Panel: Input */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="w-1 h-6 bg-rose-500 rounded-full"></span>
                            <h2 className="font-bold text-slate-800 text-lg">Thiết lập Phân tích</h2>
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Nền tảng</label>
                                    <div className="relative group">
                                        <select
                                            className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer hover:border-slate-300 outline-none"
                                            value={input.platform}
                                            onChange={(e) => setInput({ ...input, platform: e.target.value })}
                                        >
                                            <option value="Facebook Ads">Facebook Ads</option>
                                            <option value="Google Ads">Google Ads</option>
                                            <option value="TikTok Ads">TikTok Ads</option>
                                            <option value="LinkedIn Ads">LinkedIn Ads</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
                                            <Monitor className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1">Ngành hàng</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                            placeholder="VD: Thời trang, Bất động sản..."
                                            value={input.industry}
                                            onChange={(e) => setInput({ ...input, industry: e.target.value })}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-6 cursor-help" title="Chọn cách nhập dữ liệu">
                                <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                                <h2 className="font-bold text-slate-800 text-lg">Dữ liệu Đầu vào</h2>
                            </div>

                            <div className="bg-slate-100/50 p-1.5 rounded-xl flex gap-1 mb-5">
                                <button
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${input.dataMode === 'paste' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                    onClick={() => setInput({ ...input, dataMode: 'paste' })}
                                >
                                    Ads Manager (Excel)
                                </button>
                                <button
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${input.dataMode === 'manual' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                                    onClick={() => setInput({ ...input, dataMode: 'manual' })}
                                >
                                    Nhập Thủ công
                                </button>
                            </div>

                            {input.dataMode === 'paste' ? (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
                                    <textarea
                                        className="w-full h-44 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-mono text-slate-700 placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all resize-none outline-none leading-relaxed"
                                        placeholder={`Paste dữ liệu từ Excel/Ads Manager vào đây...\nVí dụ:\nCampaign A\t5,000,000\t50,000\t1,200\t50`}
                                        value={input.rawText}
                                        onChange={(e) => setInput({ ...input, rawText: e.target.value })}
                                    />
                                    <p className="text-[11px] text-slate-400 ml-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full"></span>
                                        Hỗ trợ copy trực tiếp cột số liệu từ Ads Manager
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
                                    {[
                                        { label: 'Chi tiêu (Spend)', key: 'spend', placeholder: '0' },
                                        { label: 'Hiển thị (Impressions)', key: 'impressions', placeholder: '0' },
                                        { label: 'Lượt nhấp (Clicks)', key: 'clicks', placeholder: '0' },
                                        { label: 'Chuyển đổi (Conversions)', key: 'conversions', placeholder: '0' }
                                    ].map((field) => (
                                        <div key={field.key} className="space-y-1.5">
                                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">{field.label}</label>
                                            <input
                                                type="number"
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-rose-500 focus:bg-white focus:ring-4 focus:ring-rose-500/10 transition-all outline-none"
                                                placeholder={field.placeholder}
                                                value={input.manualMetrics?.[field.key as keyof typeof input.manualMetrics] || 0}
                                                onChange={(e) => setInput({ ...input, manualMetrics: { ...input.manualMetrics!, [field.key]: Number(e.target.value) } })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="mt-5 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <p className="leading-snug">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleAnalyze}
                            disabled={loading}
                            className="w-full mt-6 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:shadow-xl hover:shadow-rose-300 hover:-translate-y-0.5 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2.5 text-base group"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    {loadingStep || 'Đang phân tích...'}
                                </>
                            ) : (
                                <>
                                    <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Chẩn đoán Chiến dịch
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Panel: Results */}
                <div className="xl:col-span-8 space-y-6">
                    {!result ? (
                        <div className="h-full min-h-[500px] bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors flex flex-col items-center justify-center text-slate-400 group cursor-default">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform duration-500">
                                <Activity className="w-10 h-10 text-slate-300 group-hover:text-rose-400 transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-600 mb-2">Chưa có dữ liệu phân tích</h3>
                            <p className="text-slate-500 max-w-xs text-center leading-relaxed">
                                Nhập thông tin chiến dịch ở cột bên trái để AI tiến hành khám sức khỏe tổng quát.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                            {/* Health Score Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden group hover:border-slate-300 transition-all">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Activity className="w-40 h-40" />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
                                    <div className={`shrink-0 w-32 h-32 rounded-full border-[6px] flex items-center justify-center ${getScoreColor(result.health_score).replace('bg-', 'border-').split(' ')[2]} bg-white shadow-sm`}>
                                        <div className="text-center">
                                            <span className={`text-4xl font-black ${getScoreColor(result.health_score).split(' ')[0]} tracking-tighter`}>{result.health_score}</span>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Điểm Sức khỏe</div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 border shadow-sm ${getScoreColor(result.health_score).replace('text-', 'bg-').replace('bg-', 'text-').split(' ').slice(0, 2).join(' ')} ${getScoreColor(result.health_score).split(' ')[2].replace('border-', 'border-')}`}>
                                            Trạng thái: {result.status}
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-3">{result.diagnosis.primary_issue}</h3>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed text-sm font-medium">
                                            "{result.diagnosis.explanation}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Metrics Analysis */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(result.metrics_analysis).map(([key, metric]: [string, any]) => (
                                    <div key={key} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-rose-200 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{key}</span>
                                            {getTrafficLight(metric.assessment)}
                                        </div>
                                        <div className="text-2xl font-bold text-slate-900 mb-1 group-hover:text-rose-600 transition-colors tracking-tight">
                                            {typeof metric.value === 'number' && (key === 'ctr' || key === 'cr') ? (metric.value * 100).toFixed(2) + '%' : metric.value.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-slate-500 flex flex-col gap-0.5">
                                            <span className="font-semibold text-slate-700">{metric.assessment}</span>
                                            {metric.benchmark && <span className="opacity-70 text-[10px]">vs {metric.benchmark}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Actionable Steps */}
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <div className="bg-slate-50/80 px-6 py-5 border-b border-slate-100 flex items-center justify-between backdrop-blur-sm">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2.5">
                                        <div className="p-1.5 bg-emerald-100 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        Phác đồ Điều trị
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                                        {result.actionable_steps.length} BƯỚC
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {result.actionable_steps.map((step, idx) => (
                                        <div key={idx} className="p-6 flex gap-5 hover:bg-slate-50 transition-colors group">
                                            <div className="shrink-0 mt-1">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                    {getActionIcon(step.action)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-md text-[11px] font-bold uppercase tracking-wide text-slate-700 group-hover:bg-rose-50 group-hover:text-rose-700 transition-colors">{step.action}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed font-medium">{step.detail}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdsHealthChecker;
