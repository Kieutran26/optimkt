import React, { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, DollarSign, Calendar, Sparkles, Check, Trash2, Target, Users, Megaphone, Globe, Plus, History, ArrowLeft } from 'lucide-react';
import { IMCService, IMCInput } from '../services/imcService';
import { IMCPlan } from '../types';

type ViewMode = 'create' | 'history' | 'detail';

const IMCPlanner: React.FC = () => {
    const [savedPlans, setSavedPlans] = useState<IMCPlan[]>([]);
    const [currentPlan, setCurrentPlan] = useState<IMCPlan | null>(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('create');

    // Form inputs
    const [brand, setBrand] = useState('');
    const [product, setProduct] = useState('');
    const [budget, setBudget] = useState('');
    const [timeline, setTimeline] = useState(8); // weeks
    const [industry, setIndustry] = useState('');

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        const plans = await IMCService.getPlans();
        setSavedPlans(plans);
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (!brand || !product || !budget) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        const budgetNum = parseFloat(budget);
        if (isNaN(budgetNum)) {
            alert('Ngân sách không hợp lệ!');
            return;
        }

        setGenerating(true);
        const input: IMCInput = {
            brand,
            product,
            budget: budgetNum,
            timeline_weeks: timeline,
            industry: industry || undefined
        };

        const plan = await IMCService.generateIMCPlan(input);
        if (plan) {
            setCurrentPlan(plan);
            await IMCService.savePlan(plan);
            await loadPlans();
            setViewMode('detail');
        }
        setGenerating(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Xóa kế hoạch này?')) {
            const success = await IMCService.deletePlan(id);
            if (success) {
                await loadPlans();
                if (currentPlan?.id === id) {
                    setCurrentPlan(null);
                    setViewMode('create');
                }
            }
        }
    };

    const handleResetForm = () => {
        setBrand('');
        setProduct('');
        setBudget('');
        setTimeline(8);
        setIndustry('');
        setCurrentPlan(null);
        setViewMode('create');
    };

    const handleViewPlan = (plan: IMCPlan) => {
        setCurrentPlan(plan);
        setViewMode('detail');
    };

    const getChannelIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case 'paid': return <DollarSign size={16} />;
            case 'owned': return <Globe size={16} />;
            case 'earned': return <Megaphone size={16} />;
            case 'shared': return <Users size={16} />;
            default: return <Target size={16} />;
        }
    };

    const getChannelColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'paid': return 'bg-red-50 text-red-600 border-red-200';
            case 'owned': return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'earned': return 'bg-green-50 text-green-600 border-green-200';
            case 'shared': return 'bg-purple-50 text-purple-600 border-purple-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
                            <Lightbulb className="text-indigo-600" />
                            IMC Planner
                        </h1>
                        <p className="text-slate-500 mt-2">
                            Integrated Marketing Communications Strategy Generator
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleResetForm}
                            className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${viewMode === 'create'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                                }`}
                        >
                            <Plus size={18} />
                            Tạo mới
                        </button>
                        <button
                            onClick={() => setViewMode('history')}
                            className={`px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${viewMode === 'history'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-700 border border-slate-200 hover:border-indigo-300'
                                }`}
                        >
                            <History size={18} />
                            Lịch sử ({savedPlans.length})
                        </button>
                    </div>
                </div>

                {/* History View */}
                {viewMode === 'history' ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <History size={24} className="text-indigo-600" />
                            Lịch sử chiến lược ({savedPlans.length})
                        </h2>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                <p className="text-slate-500 mt-4">Đang tải...</p>
                            </div>
                        ) : savedPlans.length === 0 ? (
                            <div className="text-center py-12">
                                <Sparkles size={48} className="mx-auto text-slate-300 mb-4" />
                                <p className="text-lg font-medium text-slate-600">Chưa có chiến lược nào</p>
                                <p className="text-sm text-slate-400 mt-2">Tạo chiến lược IMC đầu tiên của bạn</p>
                                <button
                                    onClick={handleResetForm}
                                    className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                                >
                                    <Plus size={18} className="inline mr-2" />
                                    Tạo mới
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {savedPlans.map(plan => (
                                    <div
                                        key={plan.id}
                                        className="p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all bg-white"
                                        onClick={() => handleViewPlan(plan)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-800 line-clamp-1">{plan.campaign_name}</h3>
                                                <p className="text-sm text-slate-500 mt-1">{plan.brand}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(plan.id);
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{plan.big_idea}</p>
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <DollarSign size={12} />
                                                {(plan.total_budget / 1_000_000).toFixed(0)}M VNĐ
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {plan.timeline_weeks} tuần
                                            </span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                                            {new Date(plan.created_at).toLocaleDateString('vi-VN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Input Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-8">
                                <h2 className="text-xl font-bold text-slate-800 mb-6">Campaign Info</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Thương hiệu *
                                        </label>
                                        <input
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            placeholder="VD: Coca-Cola"
                                            value={brand}
                                            onChange={e => setBrand(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Sản phẩm/Dịch vụ *
                                        </label>
                                        <input
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            placeholder="VD: Nước ngọt có gas"
                                            value={product}
                                            onChange={e => setProduct(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Ngân sách (VNĐ) *
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            placeholder="Tối thiểu 50,000,000"
                                            value={budget}
                                            onChange={e => setBudget(e.target.value)}
                                        />
                                        <p className="text-xs text-slate-400 mt-1">
                                            Tối thiểu 50 triệu VNĐ cho IMC tổng thể
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Thời gian: {timeline} tuần
                                        </label>
                                        <input
                                            type="range"
                                            min="4"
                                            max="24"
                                            value={timeline}
                                            onChange={e => setTimeline(parseInt(e.target.value))}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-slate-400">
                                            <span>4 tuần</span>
                                            <span>24 tuần</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Ngành (Tùy chọn)
                                        </label>
                                        <input
                                            className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                            placeholder="VD: FMCG, Tech, Fashion"
                                            value={industry}
                                            onChange={e => setIndustry(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={handleGenerate}
                                        disabled={generating}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {generating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Đang tạo chiến lược...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={20} />
                                                Generate Strategy
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Saved Plans List */}
                                {savedPlans.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-slate-100">
                                        <h3 className="text-sm font-bold text-slate-700 mb-3">Saved Plans</h3>
                                        <div className="space-y-2">
                                            {savedPlans.map(plan => (
                                                <div
                                                    key={plan.id}
                                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${currentPlan?.id === plan.id
                                                        ? 'bg-indigo-50 border-indigo-200'
                                                        : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                                                        }`}
                                                    onClick={() => setCurrentPlan(plan)}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm text-slate-800 truncate">
                                                                {plan.campaign_name}
                                                            </div>
                                                            <div className="text-xs text-slate-500 mt-1">
                                                                {plan.brand} • {(plan.total_budget / 1_000_000).toFixed(0)}M VNĐ
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(plan.id);
                                                            }}
                                                            className="p-1 text-slate-400 hover:text-red-500 rounded"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Strategy Display */}
                        <div className="lg:col-span-2">
                            {currentPlan ? (
                                <div className="space-y-6">
                                    {/* Big Idea */}
                                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl p-8 shadow-xl">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Lightbulb size={32} />
                                            <h2 className="text-2xl font-bold">Big Idea</h2>
                                        </div>
                                        <p className="text-4xl font-bold mb-4">{currentPlan.big_idea}</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mt-4">
                                            <p className="text-sm font-medium opacity-90">Key Message:</p>
                                            <p className="text-lg mt-1">{currentPlan.key_message}</p>
                                        </div>
                                    </div>

                                    {/* Phases */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                            <TrendingUp size={24} className="text-indigo-600" />
                                            Campaign Phases
                                        </h2>

                                        <div className="space-y-6">
                                            {currentPlan.phases.map((phase, index) => (
                                                <div key={index} className="border border-slate-100 rounded-xl p-5">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-slate-800">{phase.phase_name}</h3>
                                                            <p className="text-sm text-slate-500 mt-1">{phase.objective}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-2xl font-bold text-indigo-600">{phase.budget_allocation}</div>
                                                            <div className="text-xs text-slate-500">of budget</div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {phase.activities.map((activity, actIndex) => (
                                                            <div key={actIndex} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                                                <div className={`p-2 rounded-lg border ${getChannelColor(activity.channel_type)}`}>
                                                                    {getChannelIcon(activity.channel_type)}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-slate-800">{activity.channel_name}</div>
                                                                    <p className="text-sm text-slate-600 mt-1">{activity.tactic}</p>
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <Target size={12} className="text-slate-400" />
                                                                        <span className="text-xs text-slate-500">KPI: {activity.kpi}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Channel Matrix */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                        <h2 className="text-xl font-bold text-slate-800 mb-6">POES Channel Matrix</h2>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Paid */}
                                            <div className={`p-4 rounded-xl border ${getChannelColor('paid')}`}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    {getChannelIcon('paid')}
                                                    <h3 className="font-bold">Paid Media</h3>
                                                </div>
                                                <div className="space-y-1">
                                                    {currentPlan.channel_matrix.paid.map((channel, i) => (
                                                        <div key={i} className="text-sm flex items-center gap-1">
                                                            <Check size={12} />
                                                            {channel}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Owned */}
                                            <div className={`p-4 rounded-xl border ${getChannelColor('owned')}`}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    {getChannelIcon('owned')}
                                                    <h3 className="font-bold">Owned Media</h3>
                                                </div>
                                                <div className="space-y-1">
                                                    {currentPlan.channel_matrix.owned.map((channel, i) => (
                                                        <div key={i} className="text-sm flex items-center gap-1">
                                                            <Check size={12} />
                                                            {channel}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Earned */}
                                            <div className={`p-4 rounded-xl border ${getChannelColor('earned')}`}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    {getChannelIcon('earned')}
                                                    <h3 className="font-bold">Earned Media</h3>
                                                </div>
                                                <div className="space-y-1">
                                                    {currentPlan.channel_matrix.earned.map((channel, i) => (
                                                        <div key={i} className="text-sm flex items-center gap-1">
                                                            <Check size={12} />
                                                            {channel}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Shared */}
                                            <div className={`p-4 rounded-xl border ${getChannelColor('shared')}`}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    {getChannelIcon('shared')}
                                                    <h3 className="font-bold">Shared Media</h3>
                                                </div>
                                                <div className="space-y-1">
                                                    {currentPlan.channel_matrix.shared.map((channel, i) => (
                                                        <div key={i} className="text-sm flex items-center gap-1">
                                                            <Check size={12} />
                                                            {channel}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                        <Sparkles size={48} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-lg font-medium text-slate-600">
                                            Điền thông tin bên trái và nhấn Generate
                                        </p>
                                        <p className="text-sm text-slate-400 mt-2">
                                            AI sẽ tạo chiến lược IMC tổng thể cho bạn
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IMCPlanner;
