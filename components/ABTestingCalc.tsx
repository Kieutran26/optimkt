import React, { useState, useEffect } from 'react';
import { Calculator, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, BarChart3, HelpCircle, DollarSign, TrendingUp, Info, Wallet, Users, Target, Activity, Save, FolderOpen, Trash2, XCircle } from 'lucide-react';
import { ABTestService, SavedABTest, ABTestInput as ABTestInputType, ABTestResult as ABTestResultType } from '../services/abTestService';

// --- Statistical Math Helpers ---

// Normal Distribution Cumulative Distribution Function (CDF) approximation
const normDist = (z: number) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
};

interface TestResult {
    crA: number; // Conversion Rate A (0-1)
    crB: number; // Conversion Rate B (0-1)
    uplift: number; // Percentage improvement (-100 to +inf)
    pValue: number;
    zScore: number;
    isSignificant: boolean;
    confidenceLevel: number;
    winner: 'A' | 'B' | null;

    // Financial Metrics
    rpvA: number;
    rpvB: number;
    rpvUplift: number;
    potentialRevenue: number; // Projected extra revenue
}

// Sub-component for Animated Circular Progress
const AnimatedCircularProgress = ({ percentage, colorClass, icon: Icon, label, isWinner }: { percentage: number, colorClass: string, icon: any, label: string, isWinner?: boolean }) => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

    // Map color class string to actual hex for stroke (simplified mapping)
    const getStrokeColor = () => {
        if (colorClass.includes('green')) return '#10b981'; // emerald-500
        if (colorClass.includes('red')) return '#ef4444'; // red-500
        if (colorClass.includes('teal')) return '#14b8a6'; // teal-500
        return '#64748b'; // slate-500
    };

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative w-28 h-28 group">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90 drop-shadow-sm">
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-slate-100"
                    />
                    {/* Foreground Circle - Animated */}
                    <circle
                        cx="56"
                        cy="56"
                        r={radius}
                        stroke={getStrokeColor()}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>

                {/* Center Icon/Content */}
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <div className={`p-2 rounded-full mb-1 transition-colors ${isWinner ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-50 text-slate-400'}`}>
                        <Icon size={20} strokeWidth={2} />
                    </div>
                    <span className={`text-sm font-bold ${colorClass}`}>
                        {percentage.toFixed(2)}%
                    </span>
                </div>

                {/* Pulse Ring for Winner */}
                {isWinner && (
                    <div className="absolute inset-0 rounded-full border-4 border-green-400 opacity-20 animate-ping"></div>
                )}
            </div>
            <div className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${isWinner ? 'bg-green-100 text-green-700' : 'bg-slate-100/50 text-slate-500'}`}>
                {label}
            </div>
        </div>
    );
};

const ABTestingCalc: React.FC = () => {
    // Inputs
    const [visitorsA, setVisitorsA] = useState<number>(1000);
    const [conversionsA, setConversionsA] = useState<number>(50);

    const [visitorsB, setVisitorsB] = useState<number>(1000);
    const [conversionsB, setConversionsB] = useState<number>(65);

    // Settings
    const [confidence, setConfidence] = useState<number>(0.95);
    const [avgOrderValue, setAvgOrderValue] = useState<number>(0); // Optional AOV

    // Results State
    const [result, setResult] = useState<TestResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Persistence state
    const [savedTests, setSavedTests] = useState<SavedABTest[]>([]);
    const [selectedTestId, setSelectedTestId] = useState<string>('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [testName, setTestName] = useState('');
    const [saveError, setSaveError] = useState('');

    // Load saved tests on mount
    useEffect(() => {
        loadSavedTests();
    }, []);

    // Real-time calculation
    useEffect(() => {
        calculateResults();
    }, [visitorsA, conversionsA, visitorsB, conversionsB, confidence, avgOrderValue]);

    const loadSavedTests = async () => {
        const tests = await ABTestService.getABTests();
        setSavedTests(tests);
    };

    const handleLoadTest = (testId: string) => {
        if (!testId) {
            setSelectedTestId('');
            return;
        }

        const test = savedTests.find(t => t.id === testId);
        if (test) {
            setSelectedTestId(testId);
            setVisitorsA(test.input.visitorsA);
            setConversionsA(test.input.conversionsA);
            setVisitorsB(test.input.visitorsB);
            setConversionsB(test.input.conversionsB);
            setConfidence(test.input.confidence);
            setAvgOrderValue(test.input.avgOrderValue);
        }
    };

    const handleSaveTest = async () => {
        if (!testName.trim()) {
            setSaveError('Vui lòng nhập tên cho test');
            return;
        }

        if (!result) {
            setSaveError('Không có kết quả để lưu');
            return;
        }

        const newTest: SavedABTest = {
            id: Date.now().toString(),
            name: testName.trim(),
            input: {
                visitorsA,
                conversionsA,
                visitorsB,
                conversionsB,
                confidence,
                avgOrderValue
            },
            result: {
                crA: result.crA,
                crB: result.crB,
                uplift: result.uplift,
                pValue: result.pValue,
                zScore: result.zScore,
                isSignificant: result.isSignificant,
                confidenceLevel: result.confidenceLevel,
                winner: result.winner,
                rpvA: result.rpvA,
                rpvB: result.rpvB,
                rpvUplift: result.rpvUplift,
                potentialRevenue: result.potentialRevenue
            },
            createdAt: Date.now()
        };

        const success = await ABTestService.saveABTest(newTest);
        if (success) {
            setShowSaveModal(false);
            setTestName('');
            setSaveError('');
            await loadSavedTests();
        } else {
            setSaveError('Lỗi khi lưu test');
        }
    };

    const handleDeleteTest = async (testId: string) => {
        const success = await ABTestService.deleteABTest(testId);
        if (success) {
            await loadSavedTests();
            if (selectedTestId === testId) {
                setSelectedTestId('');
            }
        }
    };


    const calculateResults = () => {
        // Validation
        if (visitorsA <= 0 || visitorsB <= 0) {
            setResult(null);
            return;
        }
        if (conversionsA > visitorsA) {
            setError("Số chuyển đổi của Mẫu A không thể lớn hơn số lượt truy cập.");
            setResult(null);
            return;
        }
        if (conversionsB > visitorsB) {
            setError("Số chuyển đổi của Mẫu B không thể lớn hơn số lượt truy cập.");
            setResult(null);
            return;
        }
        setError(null);

        // Step 1: Conversion Rates
        const pA = conversionsA / visitorsA;
        const pB = conversionsB / visitorsB;

        // Step 2: Pooled Probability
        const pPool = (conversionsA + conversionsB) / (visitorsA + visitorsB);

        // Step 3: Standard Error
        const se = Math.sqrt(pPool * (1 - pPool) * (1 / visitorsA + 1 / visitorsB));

        // Step 4: Z-Score
        let z = 0;
        if (se > 0) {
            z = (pB - pA) / se;
        }

        // Step 5: P-Value (Two-tailed)
        const pValue = 2 * (1 - normDist(Math.abs(z)));

        // Step 6: Significance
        const alpha = 1 - confidence;
        const isSignificant = pValue < alpha;

        // Step 7: Uplift
        let uplift = 0;
        if (pA > 0) {
            uplift = ((pB - pA) / pA) * 100;
        } else if (pB > 0) {
            uplift = 100;
        }

        let winner: 'A' | 'B' | null = null;
        if (isSignificant) {
            winner = uplift > 0 ? 'B' : 'A';
        }

        // --- Financial Calculations ---
        const aov = avgOrderValue || 0;
        const rpvA = pA * aov;
        const rpvB = pB * aov;

        let rpvUplift = 0;
        if (rpvA > 0) {
            rpvUplift = ((rpvB - rpvA) / rpvA) * 100;
        }

        const totalTraffic = visitorsA + visitorsB;
        const rateDiff = pB - pA;
        const potentialRevenue = rateDiff * totalTraffic * aov;

        setResult({
            crA: pA,
            crB: pB,
            uplift,
            pValue,
            zScore: z,
            isSignificant,
            confidenceLevel: confidence,
            winner,
            rpvA,
            rpvB,
            rpvUplift,
            potentialRevenue
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
    };

    // --- UI Renderers ---

    const renderConclusion = () => {
        if (!result) return null;

        if (result.isSignificant) {
            if (result.winner === 'B') {
                return (
                    <div className="space-y-4 animate-in fade-in zoom-in">
                        {/* Statistical Conclusion */}
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                            <div className="inline-flex bg-green-100 p-3 rounded-full text-green-600 mb-3">
                                <ArrowUpRight size={32} strokeWidth={2} />
                            </div>
                            <h3 className="text-2xl font-bold text-green-800 mb-2">Mẫu B Chiến Thắng!</h3>
                            <p className="text-green-700 font-medium mb-4">
                                Tỷ lệ chuyển đổi tăng <strong>{result.uplift.toFixed(2)}%</strong> với độ tin cậy {result.confidenceLevel * 100}%.
                            </p>
                            <div className="bg-white p-3 rounded-xl border border-green-100 text-sm text-slate-600 shadow-sm">
                                💡 <strong>Hành động:</strong> Bạn nên áp dụng Mẫu B và tắt Mẫu A để tối ưu hiệu quả chuyển đổi ngay lập tức.
                            </div>
                        </div>

                        {/* Financial Impact Card - ONLY if AOV > 0 */}
                        {avgOrderValue > 0 && result.potentialRevenue > 0 && (
                            <div className="bg-emerald-600 text-white rounded-2xl p-6 shadow-lg shadow-emerald-200 border border-emerald-500 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>

                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Wallet size={32} strokeWidth={1.5} className="text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-emerald-50 uppercase tracking-wide mb-1">Tác động tài chính</h4>
                                        <p className="text-sm text-emerald-100 leading-relaxed mb-3">
                                            Nếu áp dụng Mẫu B cho toàn bộ <strong>{(visitorsA + visitorsB).toLocaleString()}</strong> lượt truy cập này, bạn sẽ kiếm thêm được:
                                        </p>
                                        <div className="text-4xl font-bold text-white tracking-tight">
                                            +{formatCurrency(result.potentialRevenue)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            } else {
                return (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center animate-in fade-in zoom-in">
                        <div className="inline-flex bg-red-100 p-3 rounded-full text-red-600 mb-3">
                            <ArrowDownRight size={32} strokeWidth={2} />
                        </div>
                        <h3 className="text-2xl font-bold text-red-800 mb-2">Mẫu B Thua Cuộc</h3>
                        <p className="text-red-700 font-medium mb-4">
                            Mẫu A vẫn hiệu quả hơn Mẫu B với độ tin cậy {result.confidenceLevel * 100}%.
                        </p>
                        <div className="bg-white p-3 rounded-xl border border-red-100 text-sm text-slate-600 shadow-sm">
                            💡 <strong>Hành động:</strong> Giữ nguyên Mẫu A. Hãy thử nghiệm ý tưởng mới khác cho Mẫu B.
                        </div>
                    </div>
                );
            }
        } else {
            return (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center animate-in fade-in">
                    <div className="inline-flex bg-slate-200 p-3 rounded-full text-slate-500 mb-3">
                        <Minus size={32} strokeWidth={2} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa đủ kết luận</h3>
                    <p className="text-slate-500 mb-4">
                        Sự khác biệt chưa có ý nghĩa thống kê. Có thể do dữ liệu chưa đủ lớn hoặc hai mẫu tương đương nhau.
                    </p>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-sm text-slate-600 shadow-sm">
                        💡 <strong>Hành động:</strong> Tiếp tục chạy thử nghiệm để thu thập thêm dữ liệu hoặc thử thay đổi khác biệt lớn hơn.
                    </div>
                </div>
            );
        }
    };

    const renderVisualComparison = () => {
        if (!result) return null;

        // Define colors
        const colorA = 'text-slate-600';
        let colorB = 'text-teal-600';
        if (result.isSignificant) {
            colorB = result.winner === 'B' ? 'text-green-600' : 'text-red-600';
        }

        return (
            <div className="py-8 px-6 bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex items-start justify-center gap-4 sm:gap-12">
                    {/* Circle A */}
                    <AnimatedCircularProgress
                        percentage={result.crA * 100}
                        colorClass={colorA}
                        icon={Users}
                        label="Mẫu A"
                    />

                    {/* VS / Comparison - Centered with Circles */}
                    <div className="flex flex-col items-center justify-center h-28 pt-2">
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center z-10 transition-transform hover:scale-110">
                            <span className="text-[10px] font-black text-slate-300">VS</span>
                        </div>
                    </div>

                    {/* Circle B */}
                    <AnimatedCircularProgress
                        percentage={result.crB * 100}
                        colorClass={colorB}
                        icon={Target}
                        label="Mẫu B"
                        isWinner={result.isSignificant && result.winner === 'B'}
                    />
                </div>

                {/* Uplift Badge - Belongs to visual comparison but placed below */}
                {result.isSignificant && (
                    <div className="flex justify-center mt-6">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl shadow-sm border bg-white ${result.uplift > 0
                            ? 'border-green-100 text-green-700'
                            : 'border-red-100 text-red-700'
                            }`}>
                            {result.uplift > 0 ? <TrendingUp size={18} className="text-green-500" /> : <ArrowDownRight size={18} className="text-red-500" />}
                            <span className="text-sm font-bold">
                                {result.uplift > 0 ? 'Hiệu quả hơn' : 'Kém hiệu quả hơn'}
                                <span className="ml-1 text-base">{Math.abs(result.uplift).toFixed(2)}%</span>
                            </span>
                        </div>
                    </div>
                )}

                {avgOrderValue > 0 && (
                    <div className="grid grid-cols-2 divide-x divide-slate-100 mt-8 border-t border-slate-100 pt-6">
                        <div className="text-center px-4 group cursor-help transition-colors hover:bg-slate-50/50 py-2 rounded-xl">
                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Doanh thu / Visitor (A)</div>
                            <div className="text-base font-bold text-slate-700 font-mono tracking-tight">{formatCurrency(result.rpvA)}</div>
                        </div>
                        <div className="text-center px-4 group cursor-help transition-colors hover:bg-slate-50/50 py-2 rounded-xl">
                            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1 tracking-wider">Doanh thu / Visitor (B)</div>
                            <div className={`text-base font-bold font-mono tracking-tight ${result.rpvUplift > 0 ? 'text-green-600' : 'text-slate-600'}`}>
                                {formatCurrency(result.rpvB)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    };

    return (
        <div className="max-w-6xl mx-auto pt-10 px-6 pb-20">
            <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Calculator className="text-teal-600" strokeWidth={1.5} />
                        Kiểm định A/B Testing
                    </h2>
                    <p className="text-slate-500 mt-2">Công cụ thống kê giúp bạn quyết định phiên bản quảng cáo/landing page hiệu quả nhất.</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={() => {
                            setVisitorsA(1000);
                            setConversionsA(50);
                            setVisitorsB(1000);
                            setConversionsB(65);
                            setConfidence(0.95);
                            setAvgOrderValue(0);
                            setSelectedTestId('');
                            setError(null);
                        }}
                        className="px-4 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <Calculator className="w-4 h-4" />
                        Tạo mới
                    </button>
                    {result && (
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <Save className="w-4 h-4" />
                            Lưu Test
                        </button>
                    )}
                    <button
                        onClick={() => setShowHistoryModal(true)}
                        className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-teal-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 whitespace-nowrap"
                    >
                        <FolderOpen className="w-4 h-4" />
                        Lịch sử ({savedTests.length})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- INPUT SECTION --- */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <BarChart3 size={20} className="text-slate-400" /> Dữ liệu đầu vào
                        </h3>

                        {/* Control Group A */}
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 mb-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                Control (A)
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Khách truy cập</label>
                                    <input
                                        type="number" min="0"
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all font-medium text-slate-800"
                                        value={visitorsA}
                                        onChange={(e) => setVisitorsA(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Chuyển đổi</label>
                                    <input
                                        type="number" min="0"
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all font-medium text-slate-800"
                                        value={conversionsA}
                                        onChange={(e) => setConversionsA(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Variation Group B */}
                        <div className="bg-teal-50/30 rounded-2xl p-5 border border-teal-100 mb-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-teal-100 text-teal-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                                Variation (B)
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Khách truy cập</label>
                                    <input
                                        type="number" min="0"
                                        className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all font-medium text-teal-900"
                                        value={visitorsB}
                                        onChange={(e) => setVisitorsB(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Chuyển đổi</label>
                                    <input
                                        type="number" min="0"
                                        className="w-full p-3 bg-white border border-teal-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all font-medium text-teal-900"
                                        value={conversionsB}
                                        onChange={(e) => setConversionsB(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Financial Input */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase">Giá trị đơn hàng TB (AOV)</label>
                                <span className="text-[10px] text-slate-400 italic font-medium">Tùy chọn</span>
                            </div>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3 text-slate-400" size={16} />
                                <input
                                    type="number" min="0"
                                    className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all text-sm font-medium"
                                    placeholder="Nhập số tiền (VD: 500000)"
                                    value={avgOrderValue || ''}
                                    onChange={(e) => setAvgOrderValue(Number(e.target.value))}
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">Nhập AOV để mở khóa tính năng dự báo doanh thu.</p>
                        </div>

                        {/* Confidence Settings */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold text-slate-700">Độ tin cậy (Confidence Level)</label>
                                <div className="group relative">
                                    <HelpCircle size={16} className="text-slate-400 cursor-help" />
                                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800 text-white text-xs p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        Chuẩn ngành là 95%. Chọn 99% cho các quyết định rủi ro cao.
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                                {[0.90, 0.95, 0.99].map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setConfidence(level)}
                                        className={`py-2 rounded-lg text-sm font-bold transition-all ${confidence === level ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {level * 100}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-start gap-2 animate-in slide-in-from-top-2">
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- RESULTS SECTION --- */}
                <div className="lg:col-span-7 space-y-6">

                    {/* Visual Chart Card */}
                    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                        <div className="p-6 pb-2">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Activity size={20} className="text-teal-500" />
                                So sánh Tỷ lệ Chuyển đổi
                            </h3>
                        </div>

                        {renderVisualComparison()}
                    </div>

                    {/* Stats & Conclusion Card */}
                    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Kết luận kiểm định</h3>
                            {result && (
                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${result.uplift > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    Uplift: {result.uplift > 0 ? '+' : ''}{result.uplift.toFixed(2)}%
                                </div>
                            )}
                        </div>

                        {renderConclusion()}

                        {/* Detailed Stats (Collapsible or Small) */}
                        {result && (
                            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs text-slate-400">
                                <div>
                                    <span className="font-bold">Z-Score:</span> {result.zScore.toFixed(4)}
                                </div>
                                <div className="text-right">
                                    <span className="font-bold">P-Value:</span> {result.pValue.toFixed(4)} (Alpha: {(1 - result.confidenceLevel).toFixed(2)})
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-50 rounded-xl">
                                <Save className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Lưu A/B Test</h3>
                                <p className="text-sm text-slate-500">Đặt tên để dễ quản lý sau này</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 ml-1 mb-2 block">
                                    Tên test
                                </label>
                                <input
                                    type="text"
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                    placeholder="VD: Landing Page A vs B - Tháng 12"
                                    value={testName}
                                    onChange={(e) => setTestName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSaveTest()}
                                    autoFocus
                                />
                            </div>

                            {saveError && (
                                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium rounded-xl flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <p>{saveError}</p>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowSaveModal(false);
                                        setTestName('');
                                        setSaveError('');
                                    }}
                                    className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                                >
                                    Bỏ qua
                                </button>
                                <button
                                    onClick={handleSaveTest}
                                    className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    Lưu lại
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-teal-50 rounded-xl">
                                        <FolderOpen className="w-6 h-6 text-teal-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Lịch sử A/B Test</h3>
                                        <p className="text-sm text-slate-500">{savedTests.length} test đã lưu</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <XCircle className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {savedTests.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <FolderOpen className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-600 mb-2">Chưa có test nào</h4>
                                    <p className="text-slate-500 max-w-sm">
                                        Các test bạn lưu sẽ hiển thị ở đây để bạn có thể xem lại bất cứ lúc nào.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {savedTests.map((test) => (
                                        <div
                                            key={test.id}
                                            className="bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 p-4 transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-slate-900 mb-1 truncate">
                                                        {test.name}
                                                    </h4>
                                                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            A: {test.input.visitorsA.toLocaleString()} | B: {test.input.visitorsB.toLocaleString()}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="w-3 h-3" />
                                                            Uplift: {test.result.uplift > 0 ? '+' : ''}{test.result.uplift.toFixed(2)}%
                                                        </span>
                                                        <span className={`font-semibold ${test.result.isSignificant ? 'text-green-600' : 'text-amber-600'}`}>
                                                            {test.result.isSignificant ? '✓ Có ý nghĩa' : '⚠ Chưa rõ'}
                                                        </span>
                                                        <span>
                                                            {new Date(test.createdAt).toLocaleDateString('vi-VN')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            handleLoadTest(test.id);
                                                            setShowHistoryModal(false);
                                                        }}
                                                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
                                                        title="Tải test này"
                                                    >
                                                        <FolderOpen className="w-3.5 h-3.5" />
                                                        Tải
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`Xóa "${test.name}"?`)) {
                                                                await handleDeleteTest(test.id);
                                                            }
                                                        }}
                                                        className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-sm font-medium transition-all"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100">
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ABTestingCalc;