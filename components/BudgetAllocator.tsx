import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PieChart, DollarSign, Sparkles, Loader2, Save, History, Trash2, X, Plus, TrendingUp } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BudgetAllocationResult, BudgetAllocatorInput, ChannelAllocation } from '../types';
import { generateBudgetAllocation } from '../services/geminiService';
import toast, { Toaster } from 'react-hot-toast';

const CHANNEL_COLORS = [
    '#6366f1', // Indigo - Google
    '#8b5cf6', // Purple - Meta
    '#ec4899', // Pink - TikTok
    '#f59e0b', // Amber - KOL
    '#10b981', // Green - CRM
    '#3b82f6', // Blue - Others
    '#64748b', // Gray - Others
];

interface SavedAllocation {
    id: string;
    input: BudgetAllocatorInput;
    result: BudgetAllocationResult;
    timestamp: number;
}

const ChannelCard = ({
    channel,
    onPercentageChange
}: {
    channel: ChannelAllocation;
    onPercentageChange: (newPercentage: number) => void;
}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h3 className="text-base font-bold text-slate-800">{channel.channel}</h3>
                    <p className="text-xs text-indigo-600 font-semibold mt-0.5">{channel.role}</p>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{channel.percentage}%</div>
                    <div className="text-xs text-slate-500">{formatCurrency(channel.amount)}</div>
                </div>
            </div>

            {/* Interactive Slider */}
            <div className="mb-3">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={channel.percentage}
                    onChange={(e) => onPercentageChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    style={{
                        backgroundImage: `linear-gradient(to right, #6366f1 0%, #6366f1 ${channel.percentage}%, #e2e8f0 ${channel.percentage}%, #e2e8f0 100%)`
                    }}
                />
            </div>

            {/* Rationale */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                <p className="text-xs text-slate-600 leading-relaxed italic">"{channel.rationale}"</p>
            </div>
        </div>
    );
};

const BudgetAllocator: React.FC = () => {
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<BudgetAllocatorInput & { customKpi?: string }>();
    const [allocationResult, setAllocationResult] = useState<BudgetAllocationResult | null>(null);
    const [currentInput, setCurrentInput] = useState<BudgetAllocatorInput | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingStep, setThinkingStep] = useState<string>('');
    const [showHistory, setShowHistory] = useState(false);
    const [savedAllocations, setSavedAllocations] = useState<SavedAllocation[]>([]);
    const [selectedKpi, setSelectedKpi] = useState<string>('');

    const watchedKpi = watch('kpi');

    React.useEffect(() => {
        const saved = localStorage.getItem('budget_allocator_history');
        if (saved) {
            setSavedAllocations(JSON.parse(saved));
        }
    }, []);

    const onSubmit = async (data: BudgetAllocatorInput & { customKpi?: string }) => {
        setIsGenerating(true);
        setAllocationResult(null);

        // Use custom KPI if 'custom' is selected
        const finalInput: BudgetAllocatorInput = {
            totalBudget: data.totalBudget,
            kpi: data.kpi === 'custom' ? (data.customKpi as any) : data.kpi,
            industry: data.industry
        };

        setCurrentInput(finalInput);

        try {
            const result = await generateBudgetAllocation(finalInput, (step) => {
                setThinkingStep(step);
            });

            if (result) {
                setAllocationResult(result);
                toast.success('Phân bổ ngân sách hoàn tất!', {
                    icon: '💰',
                    style: { borderRadius: '12px', background: '#F0FDF4', color: '#166534', fontWeight: 600, fontSize: '14px' }
                });
            } else {
                toast.error('Không thể phân bổ ngân sách.');
            }
        } catch (error) {
            toast.error('Đã xảy ra lỗi.');
            console.error(error);
        } finally {
            setIsGenerating(false);
            setThinkingStep('');
        }
    };

    const handlePercentageChange = (channelIndex: number, newPercentage: number) => {
        if (!allocationResult) return;

        const updatedAllocation = [...allocationResult.allocation];
        const oldPercentage = updatedAllocation[channelIndex].percentage;
        const diff = newPercentage - oldPercentage;

        // Update the changed channel
        updatedAllocation[channelIndex].percentage = newPercentage;
        updatedAllocation[channelIndex].amount = (allocationResult.total_budget * newPercentage) / 100;

        // Redistribute the difference proportionally among other channels
        const otherChannels = updatedAllocation.filter((_, i) => i !== channelIndex);
        const totalOthers = 100 - newPercentage;
        const currentOthersTotal = otherChannels.reduce((sum, ch) => sum + ch.percentage, 0);

        if (currentOthersTotal > 0) {
            updatedAllocation.forEach((ch, i) => {
                if (i !== channelIndex) {
                    ch.percentage = (ch.percentage / currentOthersTotal) * totalOthers;
                    ch.amount = (allocationResult.total_budget * ch.percentage) / 100;
                }
            });
        }

        setAllocationResult({ ...allocationResult, allocation: updatedAllocation });
    };

    const handleSave = () => {
        if (!allocationResult || !currentInput) return;

        const newAllocation: SavedAllocation = {
            id: Date.now().toString(),
            input: currentInput,
            result: allocationResult,
            timestamp: Date.now()
        };

        const updated = [newAllocation, ...savedAllocations];
        setSavedAllocations(updated);
        localStorage.setItem('budget_allocator_history', JSON.stringify(updated));

        toast.success('Đã lưu!', { icon: '💾' });
    };

    const handleNew = () => {
        setAllocationResult(null);
        setCurrentInput(null);
        setSelectedKpi('');
        reset();
        toast.success('Sẵn sàng phân bổ ngân sách mới!', { icon: '✨' });
    };

    const handleLoad = (item: SavedAllocation) => {
        setAllocationResult(item.result);
        setCurrentInput(item.input);
        reset(item.input);
        setShowHistory(false);
        toast.success('Đã tải!', { icon: '📂' });
    };

    const handleDelete = (id: string) => {
        const updated = savedAllocations.filter(s => s.id !== id);
        setSavedAllocations(updated);
        localStorage.setItem('budget_allocator_history', JSON.stringify(updated));
        toast.success('Đã xóa!', { icon: '🗑️' });
    };

    // Prepare data for Recharts
    const chartData = allocationResult?.allocation.map((ch, idx) => ({
        name: ch.channel,
        value: ch.percentage,
        amount: ch.amount,
        fill: CHANNEL_COLORS[idx % CHANNEL_COLORS.length]
    })) || [];

    return (
        <div className="h-screen bg-slate-50 flex flex-col overflow-hidden font-sans">
            <Toaster position="top-center" />

            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center">
                        <PieChart size={20} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Budget Allocator</h1>
                        <p className="text-xs text-slate-500 font-medium">Phân bổ ngân sách truyền thông thông minh</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                    >
                        <History size={16} /> Lịch sử ({savedAllocations.length})
                    </button>
                    {allocationResult && (
                        <>
                            <button
                                onClick={handleNew}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-all text-sm"
                            >
                                <Plus size={16} /> Tạo mới
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition-all text-sm"
                            >
                                <Save size={16} /> Lưu
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: showHistory ? '400px 300px 1fr' : '400px 1fr' }}>
                {/* LEFT: Form */}
                <div className="bg-white border-r border-slate-200 p-8 overflow-y-auto h-full">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            <h2 className="text-base font-bold text-slate-800">Thông tin ngân sách</h2>
                        </div>
                        <p className="text-sm text-slate-500 pl-9">AI sẽ phân bổ dựa trên KPI và ngành hàng.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pl-2">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ngân sách tổng (VND)</label>
                            <input
                                {...register('totalBudget', {
                                    required: 'Vui lòng nhập ngân sách',
                                    min: { value: 1000000, message: 'Tối thiểu 1 triệu VND' }
                                })}
                                type="number"
                                placeholder="VD: 50000000 (50 triệu)"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                            />
                            {errors.totalBudget && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.totalBudget.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-3">Mục tiêu (KPI)</label>
                            <div className="space-y-2">
                                {/* Radio Option 1 */}
                                <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all group">
                                    <input
                                        {...register('kpi', { required: 'Vui lòng chọn KPI' })}
                                        type="radio"
                                        value="sales"
                                        className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800 group-hover:text-purple-700">Chuyển đổi/Doanh số</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Performance - Ra số nhanh</div>
                                    </div>
                                </label>

                                {/* Radio Option 2 */}
                                <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all group">
                                    <input
                                        {...register('kpi', { required: 'Vui lòng chọn KPI' })}
                                        type="radio"
                                        value="awareness"
                                        className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800 group-hover:text-purple-700">Nhận diện thương hiệu</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Branding - Tăng độ nhận biết</div>
                                    </div>
                                </label>

                                {/* Radio Option 3 */}
                                <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all group">
                                    <input
                                        {...register('kpi', { required: 'Vui lòng chọn KPI' })}
                                        type="radio"
                                        value="retention"
                                        className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800 group-hover:text-purple-700">Giữ chân khách hàng</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Retention - Chăm sóc khách cũ</div>
                                    </div>
                                </label>

                                {/* Radio Option 4 - Custom */}
                                <label className="flex items-start gap-3 p-3 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all group">
                                    <input
                                        {...register('kpi', { required: 'Vui lòng chọn KPI' })}
                                        type="radio"
                                        value="custom"
                                        className="mt-0.5 w-4 h-4 text-purple-600 focus:ring-purple-500"
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-800 group-hover:text-purple-700">Mục tiêu khác (Custom)</div>
                                        <div className="text-xs text-slate-500 mt-0.5">Nhập mục tiêu theo ý bạn</div>
                                    </div>
                                </label>

                                {/* Custom Input - Show when 'custom' is selected */}
                                {watchedKpi === 'custom' && (
                                    <div className="mt-3 pl-7">
                                        <textarea
                                            {...register('customKpi', {
                                                required: watchedKpi === 'custom' ? 'Vui lòng nhập mục tiêu' : false
                                            })}
                                            placeholder="VD: Tăng tương tác trên mạng xã hội, Tăng lượt tải app..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-white border border-purple-300 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                            {errors.kpi && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.kpi.message}</p>}
                            {errors.customKpi && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.customKpi.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Ngành hàng</label>
                            <input
                                {...register('industry', { required: 'Vui lòng nhập ngành hàng' })}
                                placeholder="VD: Thời trang, F&B, Phần mềm B2B..."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                            />
                            {errors.industry && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.industry.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full py-3.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-[14px] shadow-lg shadow-purple-100 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span className="text-sm">{thinkingStep || 'Đang xử lý...'}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Phân bổ ngân sách
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
                                <History size={18} className="text-purple-500" />
                                Lịch sử
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                                <X size={18} className="text-slate-400" />
                            </button>
                        </div>

                        {savedAllocations.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <History size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Chưa có lịch sử</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {savedAllocations.map((item) => (
                                    <div
                                        key={item.id}
                                        className="group bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-purple-500/30 hover:shadow-md transition-all cursor-pointer"
                                        onClick={() => handleLoad(item)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.input.industry}</h4>
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

                {/* RIGHT: Results */}
                <div className="p-8 overflow-auto bg-slate-50 h-full">
                    {!allocationResult && !isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                                <DollarSign size={32} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <p className="text-lg font-bold text-slate-600">Budget Allocator</p>
                            <p className="text-sm text-slate-400 mt-1">Nhập thông tin để phân bổ ngân sách</p>
                        </div>
                    )}

                    {isGenerating && (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="relative w-16 h-16 mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
                            </div>
                            <p className="text-sm font-bold text-purple-600 mb-2 uppercase tracking-wide">{thinkingStep}</p>
                            <p className="text-sm text-slate-400">Đang phân tích và tính toán...</p>
                        </div>
                    )}

                    {allocationResult && !isGenerating && (
                        <div className="max-w-6xl mx-auto">
                            {/* Strategy Badge */}
                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{allocationResult.strategy_name}</h2>
                                    <p className="text-sm text-slate-500">
                                        Tổng ngân sách: <span className="font-bold text-slate-800">
                                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(allocationResult.total_budget)}
                                        </span>
                                    </p>
                                </div>
                                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
                                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wide mb-0.5">Estimated Results</p>
                                    <p className="text-xs text-slate-600">
                                        <TrendingUp size={12} className="inline mr-1" />
                                        {allocationResult.estimated_result.clicks} clicks
                                    </p>
                                    <p className="text-xs text-slate-600">
                                        💰 {allocationResult.estimated_result.conversions}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Pie Chart */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                                    <h3 className="text-sm font-bold text-slate-800 mb-4">Phân bổ theo %</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPie>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => `${entry.name}: ${entry.value}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </div>

                                {/* Channel Cards */}
                                <div className="space-y-3">
                                    {allocationResult.allocation.map((channel, index) => (
                                        <ChannelCard
                                            key={index}
                                            channel={channel}
                                            onPercentageChange={(newPercentage) => handlePercentageChange(index, newPercentage)}
                                        />
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

export default BudgetAllocator;
