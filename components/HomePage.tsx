import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import TranslationView from './TranslationView';
import {
    Brain, Lightbulb, Image as ImageIcon, TrendingUp,
    Target, Users, Map, Heart, Zap, PenTool, CalendarDays,
    Mail, MonitorPlay, PieChart, Calculator, Activity,
    ArrowRight, Clock, FileText, CheckCircle2, Circle
} from 'lucide-react';

interface HomePageProps {
    setView: (view: ViewState) => void;
}

interface ProgressItem {
    id: string;
    name: string;
    icon: any;
    storageKey: string;
    viewId: ViewState;
    color: string;
    bgColor: string;
}

const HomePage: React.FC<HomePageProps> = ({ setView }) => {
    const [progressData, setProgressData] = useState<Record<string, number>>({});

    // List of tools that store data in localStorage
    const trackedTools: ProgressItem[] = [
        { id: 'emotion_map', name: 'Emotion Map', icon: Heart, storageKey: 'emotion_map_history', viewId: 'AUDIENCE_EMOTION_MAP', color: 'text-pink-600', bgColor: 'bg-pink-50' },
        { id: 'customer_journey', name: 'Customer Journey', icon: Map, storageKey: 'customer_journey_history', viewId: 'CUSTOMER_JOURNEY_MAPPER', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { id: 'pricing', name: 'Pricing Analyzer', icon: TrendingUp, storageKey: 'pricing_analyzer_history', viewId: 'PRICING_ANALYZER', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
        { id: 'auto_brief', name: 'Auto Brief', icon: FileText, storageKey: 'auto_brief_history', viewId: 'AUTO_BRIEF', color: 'text-violet-600', bgColor: 'bg-violet-50' },
        { id: 'sop', name: 'SOP Builder', icon: CheckCircle2, storageKey: 'sop_history', viewId: 'SOP_BUILDER', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
        { id: 'hook', name: 'Hook Generator', icon: Zap, storageKey: 'hook_generator_history', viewId: 'HOOK_GENERATOR', color: 'text-amber-600', bgColor: 'bg-amber-50' },
        { id: 'insight', name: 'Insight Finder', icon: Brain, storageKey: 'insight_finder_history', viewId: 'INSIGHT_FINDER', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
        { id: 'brand_vault', name: 'Brand Vault', icon: Target, storageKey: 'brand_vault_brands', viewId: 'BRAND_VAULT', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    ];

    useEffect(() => {
        const data: Record<string, number> = {};
        trackedTools.forEach(tool => {
            try {
                const stored = localStorage.getItem(tool.storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    data[tool.id] = Array.isArray(parsed) ? parsed.length : 1;
                } else {
                    data[tool.id] = 0;
                }
            } catch {
                data[tool.id] = 0;
            }
        });
        setProgressData(data);
    }, []);

    const activeTools = trackedTools.filter(t => progressData[t.id] > 0);
    const totalItems = Object.values(progressData).reduce((a, b) => a + b, 0);

    const categories = [
        {
            title: 'Strategy & Research',
            icon: Brain,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            description: 'Phân tích thị trường, xây dựng chiến lược và thấu hiểu khách hàng.',
            tools: [
                { id: 'MASTERMIND_STRATEGY', name: 'Mastermind Strategy', icon: Brain },
                { id: 'CUSTOMER_JOURNEY_MAPPER', name: 'Customer Journey', icon: Map },
                { id: 'PERSONA_BUILDER', name: 'Persona Builder', icon: Users },
                { id: 'AUDIENCE_EMOTION_MAP', name: 'Emotion Map', icon: Heart },
            ]
        },
        {
            title: 'Ideation & Content',
            icon: Lightbulb,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            description: 'Tìm kiếm ý tưởng, viết nội dung và lên lịch đăng bài.',
            tools: [
                { id: 'HOOK_GENERATOR', name: 'Hook Generator', icon: Zap },
                { id: 'CONTENT_WRITER', name: 'Viết Content', icon: PenTool },
                { id: 'SMART_CALENDAR', name: 'Content Calendar', icon: CalendarDays },
                { id: 'SCAMPER_TOOL', name: 'SCAMPER', icon: Lightbulb },
            ]
        },
        {
            title: 'Design & Visuals',
            icon: ImageIcon,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50',
            description: 'Tạo mockup, thiết kế email và quản lý dự án hình ảnh.',
            tools: [
                { id: 'VISUAL_EMAIL', name: 'Visual Email', icon: Mail },
                { id: 'MOCKUP_GENERATOR', name: 'Mockup Generator', icon: MonitorPlay },
                { id: 'KEY_VISUALS_CREATE', name: 'Key Visuals', icon: ImageIcon },
            ]
        },
        {
            title: 'Ads & Performance',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            description: 'Tính toán ngân sách, dự báo ROAS và đo lường hiệu suất.',
            tools: [
                { id: 'BUDGET_ALLOCATOR', name: 'Budget Allocator', icon: PieChart },
                { id: 'AB_TESTING', name: 'A/B Testing', icon: Calculator },
                { id: 'ADS_HEALTH_CHECKER', name: 'Ads Health', icon: Activity },
                { id: 'ROAS_FORECASTER', name: 'ROAS Forecaster', icon: TrendingUp },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-soft-bg">
            {/* Translation Section - Primary */}
            <div className="border-b border-soft-border bg-white">
                <TranslationView />
            </div>

            {/* Progress Dashboard */}
            <div className="p-8 border-b border-soft-border">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tiến trình làm việc</h2>
                        <p className="text-slate-500">Tổng quan các công cụ đang có dữ liệu được lưu.</p>
                    </div>

                    {totalItems > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {activeTools.map(tool => (
                                <button
                                    key={tool.id}
                                    onClick={() => setView(tool.viewId)}
                                    className="bg-white rounded-xl border border-soft-border p-4 hover:shadow-soft transition-all duration-200 text-left group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${tool.bgColor}`}>
                                            <tool.icon size={20} className={tool.color} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-slate-400">
                                            <Clock size={12} />
                                            <span>{progressData[tool.id]} mục</span>
                                        </div>
                                    </div>
                                    <h4 className="font-medium text-slate-700 group-hover:text-slate-900 text-sm">{tool.name}</h4>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${tool.bgColor.replace('50', '400')} rounded-full`}
                                                style={{ width: `${Math.min(progressData[tool.id] * 20, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-soft-border p-8 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Circle size={32} className="text-slate-300" strokeWidth={1.5} />
                            </div>
                            <h3 className="font-medium text-slate-600 mb-2">Chưa có tiến trình nào</h3>
                            <p className="text-sm text-slate-400">Bắt đầu sử dụng các công cụ bên dưới để thấy tiến trình ở đây.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Tools Overview Section */}
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Khám phá công cụ</h2>
                        <p className="text-slate-500">Truy cập nhanh các công cụ Marketing AI được tổ chức theo luồng công việc.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categories.map((category) => (
                            <div
                                key={category.title}
                                className="bg-white rounded-2xl border border-soft-border p-6 hover:shadow-soft transition-all duration-300"
                            >
                                {/* Category Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-3 rounded-xl ${category.bgColor}`}>
                                        <category.icon size={24} className={category.color} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{category.title}</h3>
                                        <p className="text-sm text-slate-500">{category.description}</p>
                                    </div>
                                </div>

                                {/* Quick Access Tools */}
                                <div className="space-y-2">
                                    {category.tools.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setView(tool.id as ViewState)}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-soft-bg hover:bg-slate-100 transition-all duration-200 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <tool.icon size={18} className="text-slate-400 group-hover:text-slate-600" strokeWidth={1.5} />
                                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">{tool.name}</span>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
