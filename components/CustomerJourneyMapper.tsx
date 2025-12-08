import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Map, Sparkles, Loader2, Save, History, Trash2, X, Plus, ArrowRight, Copy, CheckCircle2, Lightbulb, MessageSquare, Heart, Target, Users } from 'lucide-react';
import { JourneyStage } from '../types';
import { generateCustomerJourney, JourneyMapperInput } from '../services/geminiService';
import toast, { Toaster } from 'react-hot-toast';

const STAGE_EMOJIS = ['🤯', '🤔', '🤩', '🥰'];
const STAGE_COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },
    { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500' },
    { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', accent: 'bg-green-500' },
    { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', accent: 'bg-pink-500' },
];

interface SavedJourney {
    id: string;
    input: JourneyMapperInput;
    data: JourneyStage[];
    timestamp: number;
}

const ContentIdeaCard = ({ idea, onAddToCalendar }: { idea: string; onAddToCalendar: () => void }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(idea);
        setCopied(true);
        toast.success('Đã copy!', { icon: '📋', duration: 1500 });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 hover:shadow-sm transition-all">
            <Lightbulb size={12} className="text-amber-500 shrink-0" />
            <span className="text-xs text-slate-600 flex-1 line-clamp-1">{idea}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={handleCopy}
                    className={`p-1 rounded ${copied ? 'text-green-500' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Copy"
                >
                    {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                </button>
            </div>
        </div>
    );
};

const JourneyStageCard = ({ stage, index, isLast }: { stage: JourneyStage; index: number; isLast: boolean }) => {
    const colors = STAGE_COLORS[index] || STAGE_COLORS[0];
    const emoji = STAGE_EMOJIS[index] || '📍';

    return (
        <div className="flex items-stretch">
            <div className={`flex-1 ${colors.bg} ${colors.border} border rounded-2xl p-5 min-w-[280px] max-w-[320px]`}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{emoji}</span>
                    <div>
                        <h3 className={`text-sm font-bold ${colors.text}`}>{stage.stage}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">{stage.emotional_state}</p>
                    </div>
                </div>

                {/* Customer Mindset */}
                <div className="bg-white/70 rounded-xl p-3 mb-3 border border-white">
                    <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare size={10} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Khách hàng nghĩ</span>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{stage.customer_mindset}"</p>
                </div>

                {/* Key Message */}
                <div className={`${colors.accent} text-white rounded-xl p-3 mb-3`}>
                    <div className="flex items-center gap-1.5 mb-1">
                        <Target size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">Key Message</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed">{stage.key_message}</p>
                </div>

                {/* Touchpoints */}
                <div className="mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Users size={10} className="text-slate-400" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Touchpoints</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {stage.touchpoints.map((tp, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-600">
                                {tp}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Content Ideas */}
                <div>
                    <div className="flex items-center gap-1.5 mb-2">
                        <Lightbulb size={10} className="text-amber-500" />
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Content Ideas</span>
                    </div>
                    <div className="space-y-1.5">
                        {stage.content_ideas.map((idea, idx) => (
                            <ContentIdeaCard key={idx} idea={idea} onAddToCalendar={() => toast.success('Thêm vào Calendar!')} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Arrow Connector */}
            {!isLast && (
                <div className="flex items-center px-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <ArrowRight size={16} className="text-slate-400" />
                    </div>
                </div>
            )}
        </div>
    );
};

const CustomerJourneyMapper: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset } = useForm<JourneyMapperInput>();
    const [journeyData, setJourneyData] = useState<JourneyStage[] | null>(null);
    const [currentInput, setCurrentInput] = useState<JourneyMapperInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [showHistory, setShowHistory] = useState(false);
    const [savedJourneys, setSavedJourneys] = useState<SavedJourney[]>([]);

    React.useEffect(() => {
        const saved = localStorage.getItem('customer_journey_history');
        if (saved) {
            setSavedJourneys(JSON.parse(saved));
        }
    }, []);

    const onSubmit = async (data: JourneyMapperInput) => {
        setIsGenerating(true);
        setJourneyData(null);
        setCurrentInput(data);

        try {
            const result = await generateCustomerJourney(data, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setJourneyData(result);
                toast.success('Journey Map đã sẵn sàng!', {
                    icon: '🗺️',
                    style: { borderRadius: '12px', background: '#F0FDF4', color: '#166534', fontWeight: 600, fontSize: '14px' }
                });
            } else {
                toast.error('Không thể tạo Journey Map.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi.');
            console.error(error);
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handleSave = () => {
        if (!journeyData || !currentInput) return;

        const newJourney: SavedJourney = {
            id: Date.now().toString(),
            input: currentInput,
            data: journeyData,
            timestamp: Date.now()
        };

        const updated = [newJourney, ...savedJourneys];
        setSavedJourneys(updated);
        localStorage.setItem('customer_journey_history', JSON.stringify(updated));

        toast.success('Đã lưu!', { icon: '💾' });
    };

    const handleNew = () => {
        setJourneyData(null);
        setCurrentInput(null);
        reset();
        toast.success('Sẵn sàng tạo Journey Map mới!', { icon: '✨' });
    };

    const handleLoad = (item: SavedJourney) => {
        setJourneyData(item.data);
        setCurrentInput(item.input);
        reset(item.input);
        setShowHistory(false);
        toast.success('Đã tải!', { icon: '📂' });
    };

    const handleDelete = (id: string) => {
        const updated = savedJourneys.filter(s => s.id !== id);
        setSavedJourneys(updated);
        localStorage.setItem('customer_journey_history', JSON.stringify(updated));
        toast.success('Đã xóa!', { icon: '🗑️' });
    };

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Map size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Customer Journey Mapper</h1>
                        <p className="text-xs text-slate-500 font-medium">Bản đồ hành trình khách hàng 4 giai đoạn</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                    >
                        <History size={16} /> Lịch sử ({savedJourneys.length})
                    </button>
                    {journeyData && (
                        <>
                            <button
                                onClick={handleNew}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all text-sm"
                            >
                                <Save size={16} /> Lưu
                            </button>
                        </>
                    )}
                </div>
            </div>


            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: showHistory ? '350px 300px 1fr' : '350px 1fr' }}>
                {/* LEFT: Form - Fixed Column */}
                <div className="bg-white border-r border-slate-200 p-8 overflow-y-auto h-full">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            <h2 className="text-base font-bold text-slate-800">Thông tin sản phẩm</h2>
                        </div>
                        <p className="text-sm text-slate-500 pl-9">AI sẽ tự động xác định ngành hàng và tạo hành trình phù hợp.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pl-2">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Sản phẩm / Thương hiệu</label>
                            <input
                                {...register('productBrand', { required: 'Vui lòng nhập tên sản phẩm' })}
                                placeholder="VD: Phần mềm quản lý bán hàng KiotViet"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                            {errors.productBrand && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.productBrand.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Target Audience</label>
                            <textarea
                                {...register('targetAudience', { required: 'Vui lòng nhập target audience' })}
                                placeholder="VD: Chủ cửa hàng bán lẻ 25-45 tuổi, có 1-5 nhân viên, đang quản lý bằng Excel..."
                                rows={4}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                            />
                            {errors.targetAudience && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.targetAudience.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Mục tiêu chuyển đổi</label>
                            <input
                                {...register('conversionGoal', { required: 'Vui lòng nhập mục tiêu chuyển đổi' })}
                                placeholder="VD: Đăng ký dùng thử 14 ngày, Mua gói Premium, Đặt lịch tư vấn..."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                            {errors.conversionGoal && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.conversionGoal.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Kênh tiếp cận chính</label>
                            <input
                                {...register('channels', { required: 'Vui lòng nhập kênh tiếp cận' })}
                                placeholder="VD: Facebook, TikTok, Google Ads, Email Marketing..."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                            {errors.channels && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.channels.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-[14px] shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang xử lý...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Tạo Journey Map
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* HISTORY SIDEBAR */}
                {showHistory && (
                    <div className="bg-white border-r border-slate-200 p-6 overflow-y-auto h-full">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <History size={18} className="text-indigo-500" />
                                Lịch sử
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        {savedJourneys.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <History size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Chưa có lịch sử</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedJourneys.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-indigo-500/30 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => handleLoad(item)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.input.productBrand}</h4>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} className="text-red-500" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString('vi-VN')}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* RIGHT: Journey Map - Scrollable Column */}
                <div className="p-8 overflow-auto bg-slate-50 h-full">
                    {!journeyData && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                                <Map size={32} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600">Customer Journey Map</p>
                            <p className="text-sm text-slate-400 mt-1">Nhập thông tin để vẽ bản đồ hành trình</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-16 h-16 mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-indigo-600 mb-2 uppercase tracking-wide">{thinkingStep}</p>
                            <p className="text-sm text-slate-400">Đang phân tích và xây dựng hành trình...</p>
                        </div>
                    )}

                    {journeyData && !isGenerating && (
                        <div className="min-w-max">
                            {/* Desktop: Horizontal Flow */}
                            <div className="hidden md:flex items-stretch gap-0">
                                {journeyData.map((stage, idx) => (
                                    <JourneyStageCard
                                        key={idx}
                                        stage={stage}
                                        index={idx}
                                        isLast={idx === journeyData.length - 1}
                                    />
                                ))}
                            </div>

                            {/* Mobile: Vertical Flow */}
                            <div className="md:hidden space-y-4">
                                {journeyData.map((stage, idx) => (
                                    <div key={idx}>
                                        <JourneyStageCard
                                            stage={stage}
                                            index={idx}
                                            isLast={true}
                                        />
                                        {idx < journeyData.length - 1 && (
                                            <div className="flex justify-center py-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center rotate-90">
                                                    <ArrowRight size={16} className="text-slate-400" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerJourneyMapper;
