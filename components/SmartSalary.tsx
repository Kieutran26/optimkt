
import React, { useState, useEffect } from 'react';
import { Banknote, Settings, ChevronRight, TrendingUp, DollarSign, Calendar as CalendarIcon, Clock, AlertCircle, X, Check, Save, Trash2 } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import toast, { Toaster } from 'react-hot-toast';

// Types
interface SalaryConfig {
    gross: number;
    standardDays: number;
    workOnSaturday: boolean;
    otMultiplier: number;
    rewardItemPrice: number;
    rewardItemName: string; // New: Custom reward name
}

interface DayStatus {
    type: 'FULL' | 'HALF' | 'OFF' | 'LEAVE' | 'OT';
    otHours: number;
}

const DEFAULT_CONFIG: SalaryConfig = {
    gross: 20000000,
    standardDays: 22,
    workOnSaturday: false,
    otMultiplier: 1.5,
    rewardItemPrice: 50000,
    rewardItemName: "Ly trà sữa",
};

const SmartSalary: React.FC = () => {
    // --- State ---
    const [config, setConfig] = useState<SalaryConfig>(() => {
        const saved = localStorage.getItem('salary_config');
        return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    });

    const [attendance, setAttendance] = useState<Record<string, DayStatus>>(() => {
        const saved = localStorage.getItem('salary_attendance');
        return saved ? JSON.parse(saved) : {};
    });

    const [showConfig, setShowConfig] = useState(false);
    const [tempConfig, setTempConfig] = useState<SalaryConfig>(config);
    const [viewDate, setViewDate] = useState<Date>(new Date());

    // --- Modal State ---
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [otHoursInput, setOtHoursInput] = useState<string>("2");

    // --- Persistence ---
    useEffect(() => {
        localStorage.setItem('salary_config', JSON.stringify(config));
    }, [config]);

    useEffect(() => {
        localStorage.setItem('salary_attendance', JSON.stringify(attendance));
    }, [attendance]);

    // --- Calculations ---
    const dailyWage = config.gross / config.standardDays;
    const hourlyWage = dailyWage / 8;

    const getDayEarnings = (dateKey: string, specificStatus?: DayStatus) => {
        const status = specificStatus || attendance[dateKey];
        if (!status) return 0;

        let multiplier = 0;
        let otPay = 0;

        if (status.type === 'FULL') multiplier = 1;
        if (status.type === 'HALF') multiplier = 0.5;
        if (status.type === 'OFF') multiplier = 0;
        if (status.type === 'LEAVE') multiplier = 1;
        if (status.type === 'OT') {
            multiplier = 1;
            otPay = status.otHours * hourlyWage * config.otMultiplier;
        }

        return (dailyWage * multiplier) + otPay;
    };

    const getCurrentMonthData = () => {
        const viewYear = viewDate.getFullYear();
        const viewMonth = viewDate.getMonth();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

        // Get today's date for comparison
        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth();
        const todayDay = today.getDate();

        const data = [];
        let total = 0;
        let workedDays = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const status = attendance[dateStr];

            let earnings = 0;
            let type = 'DEFAULT';

            // Check if this date is in the past (or today)
            const isPastOrToday =
                (viewYear < todayYear) ||
                (viewYear === todayYear && viewMonth < todayMonth) ||
                (viewYear === todayYear && viewMonth === todayMonth && d <= todayDay);

            if (status) {
                // If explicitly marked, use the marked status
                earnings = getDayEarnings(dateStr);
                type = status.type;
            } else if (isPastOrToday) {
                // Only auto-fill for past days (not future days)
                const dayOfWeek = new Date(dateStr).getDay();
                const isWeekend = dayOfWeek === 0 || (dayOfWeek === 6 && !config.workOnSaturday);
                if (!isWeekend) {
                    earnings = dailyWage;
                    type = 'FULL_AUTO';
                }
            }
            // For future days without explicit status, earnings remain 0

            if (earnings > 0) workedDays += (status?.type === 'HALF' ? 0.5 : 1);
            total += earnings;

            data.push({
                day: d,
                earnings: Math.round(earnings),
                type: type,
                fullDate: dateStr
            });
        }
        return { data, total, workedDays };
    };

    const { data: chartData, total: currentTotal, workedDays } = getCurrentMonthData();

    // Progress Calculation
    const progressPercent = Math.min((currentTotal / config.gross) * 100, 100);

    // --- Formatting ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
    };

    // --- Toast Logic ---
    const triggerGamifiedToast = (newStatus: DayStatus, dateStr: string) => {
        const earning = getDayEarnings(dateStr, newStatus);
        const rewardCount = (earning / config.rewardItemPrice).toFixed(1);
        const rewardName = config.rewardItemName || "Quà";
        const moneyStr = formatCurrency(earning);

        toast.dismiss();

        if (newStatus.type === 'FULL') {
            toast(`Ting ting! +${moneyStr}\nHôm nay bạn đã cày được ${rewardCount} ${rewardName}! 🤩`, {
                icon: '🤑',
                style: { borderRadius: '16px', background: '#ecfdf5', color: '#065f46', fontWeight: 'bold' },
                duration: 4000
            });
        } else if (newStatus.type === 'OT') {
            toast(`Quá dữ! Bạn vừa kiếm được ${moneyStr}.\nĐủ mua 5 ${rewardName} xịn! 🔥`, {
                icon: '🔥',
                style: { borderRadius: '16px', background: '#fffbeb', color: '#92400e', fontWeight: 'bold' },
                duration: 5000
            });
        } else if (newStatus.type === 'LEAVE') {
            toast(`Xả hơi thôi! Vẫn nhận đủ ${moneyStr} lương nhé.\nEnjoy!`, {
                icon: '🏖️',
                style: { borderRadius: '16px', background: '#eff6ff', color: '#1e40af', fontWeight: 'bold' },
                duration: 4000
            });
        } else if (newStatus.type === 'OFF') {
            const missed = formatCurrency(dailyWage);
            toast(`Hôm nay ví hơi mỏng! -${missed}.\nMai cày bù nhé!`, {
                icon: '💸',
                style: { borderRadius: '16px', background: '#f1f5f9', color: '#475569', fontWeight: 'bold' },
                duration: 4000
            });
        }
    };

    // --- Handlers ---
    const handleDateClick = (arg: any) => {
        setSelectedDate(arg.dateStr);
        setIsModalOpen(true);
        const current = attendance[arg.dateStr];
        setOtHoursInput(current?.type === 'OT' ? String(current.otHours) : "2");
    };

    const saveAttendance = (type: DayStatus['type'] | 'CLEAR') => {
        if (!selectedDate) return;

        if (type === 'CLEAR') {
            setAttendance(prev => {
                const newState = { ...prev };
                delete newState[selectedDate];
                return newState;
            });

            // Check if it's a weekday to give correct feedback
            const dateObj = new Date(selectedDate);
            const day = dateObj.getDay();
            const isWeekend = day === 0 || (day === 6 && !config.workOnSaturday);

            if (!isWeekend) {
                toast('Đã đặt lại! Ngày thường tự động tính 1 công.', {
                    icon: '🔄',
                    style: { borderRadius: '16px', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold' },
                });
            } else {
                toast('Đã xóa! Cuối tuần không tính công.', {
                    icon: '🗑️',
                    style: { borderRadius: '16px', background: '#f1f5f9', color: '#ef4444', fontWeight: 'bold' },
                });
            }
            setIsModalOpen(false);
            return;
        }

        let ot = 0;
        if (type === 'OT') {
            ot = parseFloat(otHoursInput) || 0;
        }

        const newStatus: DayStatus = { type, otHours: ot };
        setAttendance(prev => ({ ...prev, [selectedDate]: newStatus }));

        triggerGamifiedToast(newStatus, selectedDate);
        setIsModalOpen(false);
    };

    const getEvents = () => {
        return Object.entries(attendance).map(([date, status]: [string, DayStatus]) => {
            let color = '#dcfce7';
            let textColor = '#166534';
            let title = '1 Công';

            if (status.type === 'HALF') { color = '#fef3c7'; textColor = '#92400e'; title = '0.5C'; }
            if (status.type === 'OFF') { color = '#f1f5f9'; textColor = '#64748b'; title = 'Nghỉ'; }
            if (status.type === 'LEAVE') { color = '#dbeafe'; textColor = '#1e40af'; title = 'Phép'; }
            if (status.type === 'OT') { color = '#fff7ed'; textColor = '#9a3412'; title = `+${status.otHours}h OT`; }

            return { title, start: date, backgroundColor: color, borderColor: 'transparent', textColor: textColor, allDay: true };
        });
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden font-sans text-slate-900" >
            <Toaster position="bottom-right" reverseOrder={false} />

            {/* HEADER */}
            <div className="bg-white border-b border-gray-100 px-8 py-5 flex justify-between items-center shrink-0 shadow-sm z-10" >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl shadow-emerald-200 shadow-lg">
                        <Banknote size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Smart Salary Tracker</h1>
                        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mt-0.5">Quản lý thu nhập thông minh</p>
                    </div>
                </div>
                <button
                    onClick={() => { setTempConfig(config); setShowConfig(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 rounded-xl font-bold transition-all text-sm shadow-sm"
                >
                    <Settings size={18} /> Cấu hình
                </button>
            </div >

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-8 h-full">

                    {/* LEFT: CALENDAR (8 Cols) */}
                    <div className="xl:col-span-8 bg-white rounded-[24px] p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                        <div className="flex-1 salary-calendar-wrapper">
                            <style>{`
    .fc - theme - standard td, .fc - theme - standard th { border: none!important; }
                                .fc - theme - standard.fc - scrollgrid { border: none!important; }
                                .fc - col - header - cell - cushion { color: #94a3b8; font - size: 13px; font - weight: 700; text - transform: uppercase; padding: 12px 0!important; }
                                .fc - daygrid - day - number { color: #64748b; font - weight: 600; font - size: 14px; padding: 8px 12px!important; }
                                .fc - daygrid - day:hover { background - color: #f8fafc; cursor: pointer; border - radius: 12px; }
                                .fc - daygrid - event { border - radius: 8px; padding: 2px 4px; font - weight: 600; font - size: 11px; margin - top: 4px; border: none; box - shadow: none; }
                                .fc - day - today { background - color: transparent!important; }
                                .fc - day - today.fc - daygrid - day - number { color: #10b981; background: #ecfdf5; border - radius: 50 %; width: 28px; height: 28px; display: flex; align - items: center; justify - content: center; margin: 4px; }
`}</style>
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                headerToolbar={{ left: 'prev', center: 'title', right: 'next' }}
                                height="100%"
                                events={getEvents()}
                                datesSet={(arg) => setViewDate(arg.view.currentStart)}
                                dateClick={handleDateClick}
                                eventClick={(info) => handleDateClick({ dateStr: info.event.startStr })}
                            />
                        </div>
                        {/* Legend */}
                        <div className="mt-6 flex items-center justify-center gap-6 text-xs font-bold text-slate-500">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Đủ công
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-700">
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div> OT
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Phép
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
                                <div className="w-2 h-2 rounded-full bg-slate-400"></div> Nghỉ
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: DASHBOARD (4 Cols) */}
                    <div className="xl:col-span-4 space-y-8 flex flex-col">

                        {/* 1. TOTAL SALARY CARD */}
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <DollarSign size={140} className="text-emerald-600 translate-x-10 -translate-y-10" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1 h-4 bg-emerald-400 rounded-full"></div>
                                        Thu nhập tháng {viewDate.getMonth() + 1}
                                    </div>
                                </div>

                                <div className="text-4xl lg:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-teal-500 tracking-tight">
                                    {formatCurrency(currentTotal)}
                                </div>

                                {/* Progress Bar - NEW */}
                                <div className="mb-6">
                                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                                        <span>Đã đạt {Math.floor(progressPercent)}% mục tiêu</span>
                                        <span>{formatCurrency(config.gross)}</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPercent}% ` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">Công thực tế</div>
                                        <div className="text-xl font-bold text-slate-700 flex items-baseline gap-1">
                                            {workedDays}
                                            <span className="text-xs text-slate-400 font-medium">/ {config.standardDays}</span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-2xl">
                                        <div className="text-xs text-slate-400 font-bold uppercase mb-1">TB / Ngày</div>
                                        <div className="text-xl font-bold text-slate-700">{formatCurrency(dailyWage)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. DAILY EARNINGS CHART */}
                        <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-100 flex-1 flex flex-col min-h-[350px]">
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-slate-800 font-bold flex items-center gap-2 text-lg">
                                    <TrendingUp size={20} className="text-emerald-500" /> Biểu đồ Thu nhập
                                </h3>
                                <div className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Real-time</div>
                            </div>

                            <div className="flex-1 w-full -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <ReferenceLine y={dailyWage} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'top', value: 'TB', fill: '#94a3b8', fontSize: 10 }} />
                                        <Tooltip
                                            cursor={{ fill: '#f1f5f9', radius: 4 }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl">
                                                            <p className="mb-1 text-slate-400">Ngày {label}</p>
                                                            <p className="text-emerald-400 text-sm">{formatCurrency(payload[0].value as number)}</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="earnings" radius={[4, 4, 0, 0]} animationDuration={500}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell - ${index} `} fill={
                                                    entry.type === 'OT' || (attendance[entry.fullDate]?.otHours > 0) ? '#f59e0b' :
                                                        entry.earnings > 0 ? '#10b981' :
                                                            '#e2e8f0'
                                                } />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* CONFIG MODAL */}
            {
                showConfig && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl animate-in zoom-in-95 scale-100 border border-white/20">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-[32px]">
                                <h3 className="text-xl font-bold text-slate-800">Cấu hình Lương</h3>
                                <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><Settings size={22} /></button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tổng thu nhập (VNĐ)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            className="w-full pl-5 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-lg text-slate-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300"
                                            value={tempConfig.gross}
                                            onChange={e => setTempConfig({ ...tempConfig, gross: parseInt(e.target.value) || 0 })}
                                            placeholder="20000000"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">VND</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ngày công chuẩn</label>
                                        <input
                                            type="number"
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                                            value={tempConfig.standardDays}
                                            onChange={e => setTempConfig({ ...tempConfig, standardDays: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hệ số OT</label>
                                        <input
                                            type="number" step="0.1"
                                            className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-slate-800 focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all"
                                            value={tempConfig.otMultiplier}
                                            onChange={e => setTempConfig({ ...tempConfig, otMultiplier: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                {/* Gamification Config */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Quy đổi Quà tặng</label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                                        <div className="flex gap-3">
                                            <input
                                                className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200"
                                                placeholder="Tên món (VD: Ly trà sữa)"
                                                value={tempConfig.rewardItemName}
                                                onChange={e => setTempConfig({ ...tempConfig, rewardItemName: e.target.value })}
                                            />
                                            <input
                                                type="number"
                                                className="w-24 px-3 py-3 bg-white border border-gray-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200 text-right"
                                                placeholder="Giá"
                                                value={tempConfig.rewardItemPrice}
                                                onChange={e => setTempConfig({ ...tempConfig, rewardItemPrice: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400">Nhập tên và giá để hệ thống tính toán phần thưởng mỗi ngày!</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setTempConfig({ ...tempConfig, workOnSaturday: !tempConfig.workOnSaturday })}>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${tempConfig.workOnSaturday ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300'}`}>
                                        {tempConfig.workOnSaturday && <ChevronRight className="rotate-90" size={16} strokeWidth={3} />}
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">Công ty làm việc Thứ 7</span>
                                </div>
                            </div>
                            <div className="p-8 pt-0">
                                <button
                                    onClick={() => { setConfig(tempConfig); setShowConfig(false); }}
                                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 transition-all active:scale-[0.98]"
                                >
                                    Lưu & Áp dụng
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* ATTENDANCE MODAL */}
            {
                isModalOpen && selectedDate && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-white/20 overflow-hidden">

                            {/* Header */}
                            <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Chấm công</h3>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{selectedDate}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-gray-50 transition-colors">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6 space-y-3">
                                <button onClick={() => saveAttendance('FULL')} className="w-full flex items-center gap-4 p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/80 hover:border-emerald-300 transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Check size={20} strokeWidth={3} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-slate-700">Đủ công (1.0)</div>
                                        <div className="text-xs text-slate-500">Làm việc cả ngày</div>
                                    </div>
                                </button>

                                <button onClick={() => saveAttendance('HALF')} className="w-full flex items-center gap-4 p-3 rounded-xl border border-amber-100 bg-amber-50/50 hover:bg-amber-100/80 hover:border-amber-300 transition-all group">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Clock size={20} strokeWidth={3} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-slate-700">Nửa công (0.5)</div>
                                        <div className="text-xs text-slate-500">Làm việc buổi sáng/chiều</div>
                                    </div>
                                </button>

                                <div className="relative group">
                                    <button onClick={() => saveAttendance('OT')} className="w-full flex items-center gap-4 p-3 rounded-xl border border-orange-100 bg-orange-50/50 hover:bg-orange-100/80 hover:border-orange-300 transition-all z-10 relative">
                                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <TrendingUp size={20} strokeWidth={3} />
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="font-bold text-slate-700">OT (Làm thêm)</div>
                                            <div className="text-xs text-slate-500">Tăng ca ngoài giờ</div>
                                        </div>
                                        <div className="bg-white border border-orange-200 rounded-lg flex items-center px-2 py-1 gap-2" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="number"
                                                value={otHoursInput}
                                                onChange={(e) => setOtHoursInput(e.target.value)}
                                                className="w-12 text-sm font-bold text-orange-600 text-right outline-none"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <span className="text-xs font-bold text-orange-400">h</span>
                                        </div>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button onClick={() => saveAttendance('LEAVE')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/80 transition-all">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <Banknote size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600">Nghỉ phép</span>
                                    </button>
                                    <button onClick={() => saveAttendance('OFF')} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition-all">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                                            <X size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-600">Nghỉ (0 công)</span>
                                    </button>
                                </div>
                                <button onClick={() => saveAttendance('CLEAR')} className="w-full flex items-center justify-center gap-2 p-3 mt-3 rounded-xl border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-500 hover:text-red-600 transition-all">
                                    <Trash2 size={16} />
                                    <span className="text-xs font-bold">Đặt lại mặc định (Reset)</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default SmartSalary;
