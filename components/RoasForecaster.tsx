import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, MousePointer2, ShoppingCart, Percent, Box, Copy, AlertCircle, TrendingDown, Save, History, X, Trash2, Clock, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Toast, ToastType } from './Toast';
import { StorageService } from '../services/storageService';
import { RoasScenario } from '../types';

const RoasForecaster: React.FC = () => {
    // Input States
    const [budget, setBudget] = useState(10000000); // 10tr
    const [cpc, setCpc] = useState(5000); // 5k
    const [conversionRate, setConversionRate] = useState(2.0); // 2%
    const [aov, setAov] = useState(500000); // 500k
    const [cogs, setCogs] = useState(200000); // 200k

    // UI States
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [scenarioName, setScenarioName] = useState('');
    const [history, setHistory] = useState<RoasScenario[]>([]);

    // Calculated States
    const [metrics, setMetrics] = useState({
        clicks: 0,
        orders: 0,
        revenue: 0,
        productCost: 0,
        totalCost: 0,
        netProfit: 0,
        roas: 0,
        breakEvenCR: 0
    });

    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Initial Load
    useEffect(() => {
        setHistory(StorageService.getRoasHistory());
    }, []);

    // Calculation Logic
    useEffect(() => {
        const clicks = Math.floor(budget / (cpc > 0 ? cpc : 1));
        const orders = Math.floor(clicks * (conversionRate / 100));
        const revenue = orders * aov;
        const productCost = orders * cogs;
        const totalCost = budget + productCost;
        const netProfit = revenue - totalCost;
        const roas = budget > 0 ? revenue / budget : 0;
        
        // Break-even CR = (CPC / (AOV - COGS)) * 100
        const profitPerOrder = aov - cogs;
        const breakEvenCR = profitPerOrder > 0 ? (cpc / profitPerOrder) * 100 : 0;

        setMetrics({
            clicks,
            orders,
            revenue,
            productCost,
            totalCost,
            netProfit,
            roas,
            breakEvenCR
        });
    }, [budget, cpc, conversionRate, aov, cogs]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
    };

    const formatNumber = (val: number) => {
        return new Intl.NumberFormat('vi-VN').format(val);
    };

    const handleCopyScenario = () => {
        const text = `
📊 DỰ BÁO NGÂN SÁCH & HIỆU QUẢ QUẢNG CÁO
----------------------------------------
ĐẦU VÀO:
- Ngân sách: ${formatCurrency(budget)}
- CPC: ${formatCurrency(cpc)}
- Tỷ lệ chuyển đổi: ${conversionRate}%
- AOV: ${formatCurrency(aov)}
- Giá vốn/SP: ${formatCurrency(cogs)}

KẾT QUẢ DỰ KIẾN:
- Traffic (Clicks): ${formatNumber(metrics.clicks)}
- Đơn hàng: ${formatNumber(metrics.orders)}
- Doanh thu: ${formatCurrency(metrics.revenue)}
- Lợi nhuận ròng: ${formatCurrency(metrics.netProfit)}
- ROAS: ${metrics.roas.toFixed(2)}x
- Điểm hòa vốn CR: ${metrics.breakEvenCR.toFixed(2)}%
----------------------------------------
`;
        navigator.clipboard.writeText(text);
        setToast({ message: "Đã sao chép kịch bản vào clipboard!", type: "success" });
    };

    const handleSaveScenario = () => {
        if (!scenarioName.trim()) {
            setToast({ message: "Vui lòng nhập tên kịch bản", type: "error" });
            return;
        }

        const newScenario: RoasScenario = {
            id: Date.now().toString(),
            name: scenarioName,
            createdAt: Date.now(),
            inputs: { budget, cpc, conversionRate, aov, cogs },
            results: { 
                revenue: metrics.revenue, 
                netProfit: metrics.netProfit, 
                roas: metrics.roas 
            }
        };

        StorageService.saveRoasScenario(newScenario);
        setHistory([newScenario, ...history]);
        setShowSaveModal(false);
        setScenarioName('');
        setToast({ message: "Đã lưu kịch bản thành công!", type: "success" });
    };

    const handleLoadScenario = (scenario: RoasScenario) => {
        setBudget(scenario.inputs.budget);
        setCpc(scenario.inputs.cpc);
        setConversionRate(scenario.inputs.conversionRate);
        setAov(scenario.inputs.aov);
        setCogs(scenario.inputs.cogs);
        setShowHistoryModal(false);
        setToast({ message: `Đã tải kịch bản: ${scenario.name}`, type: "success" });
    };

    const handleDeleteScenario = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("Xóa kịch bản này?")) {
            StorageService.deleteRoasScenario(id);
            setHistory(prev => prev.filter(h => h.id !== id));
        }
    };

    // Chart Data
    const chartData = [
        { name: 'Tổng Chi phí', value: metrics.totalCost, color: '#94a3b8' }, // slate-400
        { name: 'Doanh thu', value: metrics.revenue, color: '#6366f1' }, // indigo-500
        { name: 'Lợi nhuận', value: metrics.netProfit, color: metrics.netProfit >= 0 ? '#22c55e' : '#ef4444' } // green-500 or red-500
    ];

    return (
        <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <TrendingUp className="text-green-600" strokeWidth={1.5} />
                        Dự tính Ngân sách & ROAS
                    </h2>
                    <p className="text-slate-500 mt-1">Mô phỏng hiệu quả quảng cáo và lợi nhuận theo thời gian thực.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowHistoryModal(true)}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                    >
                        <History size={18} strokeWidth={1.5} /> Lịch sử
                    </button>
                    <button 
                        onClick={() => setShowSaveModal(true)}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                    >
                        <Save size={18} strokeWidth={1.5} /> Lưu
                    </button>
                    <button 
                        onClick={handleCopyScenario}
                        className="bg-indigo-600 text-white border border-indigo-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                    >
                        <Copy size={18} strokeWidth={1.5} /> Copy
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* --- INPUT PARAMETERS (Left) --- */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-6 space-y-8">
                        
                        {/* Group 1: Ad Costs */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <DollarSign size={14}/> Chi phí Quảng cáo
                            </h3>
                            
                            {/* Budget Input - Custom Styled */}
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tổng Ngân sách (VNĐ)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-transparent text-2xl font-bold text-slate-800 outline-none placeholder:text-slate-300"
                                    placeholder="0"
                                    value={budget === 0 ? '' : budget} // Show placeholder if 0
                                    onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                                />
                                <input 
                                    type="range" min="1000000" max="100000000" step="500000" 
                                    value={budget} 
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"
                                />
                            </div>

                            {/* CPC Input */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><MousePointer2 size={14}/> CPC trung bình</label>
                                    <span className="text-sm font-medium text-slate-600">{formatCurrency(cpc)}</span>
                                </div>
                                <input 
                                    type="range" min="500" max="50000" step="100" 
                                    value={cpc} 
                                    onChange={(e) => setCpc(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="mt-2">
                                    <input 
                                        type="number" 
                                        className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors font-medium text-slate-700"
                                        value={cpc}
                                        onChange={(e) => setCpc(Math.max(1, Number(e.target.value)))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        {/* Group 2: Sales Performance */}
                        <div className="space-y-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <ShoppingCart size={14}/> Hiệu suất Bán hàng
                            </h3>

                            {/* CR Input */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Percent size={14}/> Tỷ lệ chuyển đổi (CR)</label>
                                    <span className="text-sm font-medium text-slate-600">{conversionRate}%</span>
                                </div>
                                <input 
                                    type="range" min="0.1" max="10" step="0.1" 
                                    value={conversionRate} 
                                    onChange={(e) => setConversionRate(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                                <div className="flex justify-between items-center mt-2">
                                    <input 
                                        type="number" step="0.1"
                                        className="w-24 p-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors font-medium text-slate-700"
                                        value={conversionRate}
                                        onChange={(e) => setConversionRate(Math.max(0, Number(e.target.value)))}
                                    />
                                    {metrics.breakEvenCR > 0 && (
                                        <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                            Hòa vốn: <strong>{metrics.breakEvenCR.toFixed(2)}%</strong>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AOV Input */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700">Giá trị đơn hàng (AOV)</label>
                                    <span className="text-sm font-medium text-slate-600">{formatCurrency(aov)}</span>
                                </div>
                                <input 
                                    type="range" min="100000" max="5000000" step="50000" 
                                    value={aov} 
                                    onChange={(e) => setAov(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                                <div className="mt-2">
                                    <input 
                                        type="number" 
                                        className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-green-500 transition-colors font-medium text-slate-700"
                                        value={aov}
                                        onChange={(e) => setAov(Math.max(0, Number(e.target.value)))}
                                    />
                                </div>
                            </div>

                            {/* COGS Input */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1"><Box size={14}/> Giá vốn hàng bán (COGS)</label>
                                    <span className="text-sm font-medium text-slate-600">{formatCurrency(cogs)}</span>
                                </div>
                                <input 
                                    type="range" min="0" max={aov} step="10000" 
                                    value={cogs} 
                                    onChange={(e) => setCogs(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-500"
                                />
                                <div className="mt-2">
                                    <input 
                                        type="number" 
                                        className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 transition-colors font-medium text-slate-700"
                                        value={cogs}
                                        onChange={(e) => setCogs(Math.max(0, Number(e.target.value)))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FORECAST DASHBOARD (Right) --- */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Metric Cards Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Traffic (Clicks)</div>
                            <div className="text-2xl font-bold text-slate-800">{formatNumber(metrics.clicks)}</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Đơn hàng (Orders)</div>
                            <div className="text-2xl font-bold text-indigo-600">{formatNumber(metrics.orders)}</div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">ROAS</div>
                            <div className={`text-2xl font-bold ${metrics.roas >= 4 ? 'text-green-600' : metrics.roas >= 2 ? 'text-yellow-600' : 'text-red-500'}`}>
                                {metrics.roas.toFixed(2)}x
                            </div>
                        </div>
                        <div className="col-span-2 md:col-span-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex-1 w-full">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Tổng Doanh thu</div>
                                <div className="text-3xl font-bold text-slate-800">{formatCurrency(metrics.revenue)}</div>
                            </div>
                            <div className="w-px h-12 bg-slate-100 hidden md:block"></div>
                            <div className="flex-1 w-full">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Lợi nhuận ròng (Net Profit)</div>
                                <div className={`text-3xl font-bold ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {metrics.netProfit > 0 ? '+' : ''}{formatCurrency(metrics.netProfit)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Section */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft h-[350px] flex flex-col">
                        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Biểu đồ Lợi nhuận</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#64748b', fontSize: 12}} 
                                        tickFormatter={(value) => new Intl.NumberFormat('en', { notation: "compact" }).format(value)}
                                    />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}}
                                        formatter={(value: number) => [formatCurrency(value), '']}
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    />
                                    <ReferenceLine y={0} stroke="#cbd5e1" />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Warning / Insight */}
                    {metrics.netProfit < 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <TrendingDown className="text-red-600 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-red-800 text-sm">Cảnh báo lỗ vốn!</h4>
                                <p className="text-sm text-red-700 mt-1">
                                    Bạn đang lỗ <strong>{formatCurrency(Math.abs(metrics.netProfit))}</strong>. 
                                    Cần tăng tỷ lệ chuyển đổi lên ít nhất <strong>{metrics.breakEvenCR.toFixed(2)}%</strong> hoặc giảm CPC để hòa vốn.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {metrics.netProfit > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <TrendingUp className="text-green-600 shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="font-bold text-green-800 text-sm">Lợi nhuận khả quan</h4>
                                <p className="text-sm text-green-700 mt-1">
                                    Biên lợi nhuận ròng đạt <strong>{((metrics.netProfit / metrics.revenue) * 100).toFixed(1)}%</strong>. 
                                    Bạn có thể cân nhắc tăng ngân sách nếu ROAS duy trì ổn định.
                                </p>
                            </div>
                        </div>
                    )}

                </div>
            </div>
            
            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Lưu Kịch Bản</h3>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:border-indigo-500" placeholder="Tên kịch bản (VD: Tháng 10 - Tăng Budget)..." value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} autoFocus />
                        <div className="flex gap-3">
                            <button onClick={() => setShowSaveModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors">Hủy</button>
                            <button onClick={handleSaveScenario} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={20} /> Lịch sử Kịch bản</h3>
                            <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3">
                            {history.length === 0 ? <div className="text-center py-10 text-slate-400">Chưa có kịch bản nào được lưu.</div> : history.map(h => (
                                <div key={h.id} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-md transition-all bg-white cursor-pointer group" onClick={() => handleLoadScenario(h)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-slate-800 text-lg">{h.name}</div>
                                        <button onClick={(e) => handleDeleteScenario(e, h.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                        <Clock size={12}/> {new Date(h.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-slate-100 p-2 rounded-lg">Budget: <b>{formatCurrency(h.inputs.budget)}</b></div>
                                        <div className={`p-2 rounded-lg ${h.results.netProfit >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>Lãi: <b>{formatCurrency(h.results.netProfit)}</b></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default RoasForecaster;