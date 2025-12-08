import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Copy, Check, Save, Clock, Trash2, ArrowRight, History, X } from 'lucide-react';
import { generateScamperIdeas } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { ScamperSession } from '../types';
import { Toast, ToastType } from './Toast';

const SCAMPER_METHODS = [
    { id: 'substitute', letter: 'S', name: 'Substitute', desc: 'Thay thế', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'combine', letter: 'C', name: 'Combine', desc: 'Kết hợp', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'adapt', letter: 'A', name: 'Adapt', desc: 'Thích nghi', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 'modify', letter: 'M', name: 'Modify', desc: 'Điều chỉnh', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'putToAnotherUse', letter: 'P', name: 'Put to use', desc: 'Dùng khác', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'eliminate', letter: 'E', name: 'Eliminate', desc: 'Loại bỏ', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'reverse', letter: 'R', name: 'Reverse', desc: 'Đảo ngược', color: 'bg-pink-100 text-pink-700 border-pink-200' },
];

const ScamperTool: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [context, setContext] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<Record<string, string[]>>({});
    const [savedIdeas, setSavedIdeas] = useState<string[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    
    // Animation Stagger
    const [visibleCards, setVisibleCards] = useState<string[]>([]);
    
    // History Modal
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<ScamperSession[]>([]);

    useEffect(() => {
        // Initialize with all visible if loading from history, or empty
        if (Object.keys(results).length > 0) {
             setVisibleCards(SCAMPER_METHODS.map(m => m.id));
        }
    }, [results]);

    useEffect(() => {
        if (showHistory) {
            setHistory(StorageService.getScamperSessions());
        }
    }, [showHistory]);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            showToast("Vui lòng nhập chủ đề cần tư duy", "error");
            return;
        }

        setIsGenerating(true);
        setResults({});
        setVisibleCards([]);
        
        try {
            const data = await generateScamperIdeas(topic, context);
            setResults(data);
            
            // Staggered animation effect
            SCAMPER_METHODS.forEach((method, index) => {
                setTimeout(() => {
                    setVisibleCards(prev => [...prev, method.id]);
                }, index * 300); // 300ms delay per card
            });

        } catch (error) {
            showToast("Lỗi khi tạo ý tưởng.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateSingle = async (methodId: string) => {
        const oldVal = results[methodId];
        setResults(prev => ({ ...prev, [methodId]: [] }));

        try {
             const data = await generateScamperIdeas(topic, context, methodId);
             setResults(prev => ({ ...prev, [methodId]: data[methodId] || [] }));
        } catch (e) {
             setResults(prev => ({ ...prev, [methodId]: oldVal }));
        }
    };

    const handleSaveIdea = (idea: string) => {
        if (!savedIdeas.includes(idea)) {
            setSavedIdeas([...savedIdeas, idea]);
            showToast("Đã lưu ý tưởng", "success");
        }
    };

    const handleSaveSession = () => {
        if (Object.keys(results).length === 0) return;
        
        const session: ScamperSession = {
            id: Date.now().toString(),
            topic,
            context,
            results: results as any,
            savedIdeas,
            createdAt: Date.now()
        };
        
        StorageService.saveScamperSession(session);
        showToast("Đã lưu phiên làm việc", "success");
    };

    const handleLoadSession = (session: ScamperSession) => {
        setTopic(session.topic);
        setContext(session.context);
        setResults(session.results);
        setSavedIdeas(session.savedIdeas || []);
        setShowHistory(false);
        showToast("Đã tải lại phiên làm việc", "success");
    };

    const handleDeleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(confirm("Xóa phiên này?")) {
            StorageService.deleteScamperSession(id);
            setHistory(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Đã copy", "success");
    };

    return (
        <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Lightbulb className="text-yellow-500" strokeWidth={1.5} />
                        SCAMPER Ideation
                    </h2>
                    <p className="text-slate-500 mt-1">Kỹ thuật tư duy đa chiều để đột phá ý tưởng sản phẩm.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowHistory(true)}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                    >
                        <History size={18} /> Lịch sử
                    </button>
                    <button 
                        onClick={handleSaveSession}
                        disabled={Object.keys(results).length === 0}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                    >
                        <Save size={18} /> Lưu phiên
                    </button>
                </div>
            </div>

            {/* INPUT AREA */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Chủ đề / Sản phẩm</label>
                        <input 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                            placeholder="VD: Quán cà phê sách..."
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Bối cảnh / Vấn đề (Tùy chọn)</label>
                        <div className="flex gap-3">
                            <input 
                                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-600"
                                placeholder="VD: Doanh thu đang giảm, khách hàng phàn nàn về..."
                                value={context}
                                onChange={e => setContext(e.target.value)}
                            />
                            <button 
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="bg-indigo-600 text-white px-6 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-70 transition-all whitespace-nowrap"
                            >
                                {isGenerating ? <RefreshCw className="animate-spin"/> : <Lightbulb />}
                                Tư duy ngay
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* RESULTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SCAMPER_METHODS.map(method => (
                    <div 
                        key={method.id}
                        className={`bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col transition-all duration-500 transform ${visibleCards.includes(method.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                    >
                        {/* Header */}
                        <div className={`p-4 border-b border-slate-100 flex justify-between items-center rounded-t-3xl ${method.color.replace('text-', 'bg-').replace('border-', 'border-b-').split(' ')[0]} bg-opacity-20`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl ${method.color} bg-white border shadow-sm`}>
                                    {method.letter}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{method.name}</div>
                                    <div className="text-xs text-slate-500">{method.desc}</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRegenerateSingle(method.id)}
                                className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm hover:shadow transition-all"
                                title="Tạo lại phần này"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 flex-1 min-h-[200px]">
                            {results[method.id] ? (
                                <ul className="space-y-3">
                                    {results[method.id].map((idea, idx) => (
                                        <li key={idx} className="text-sm text-slate-600 leading-relaxed group flex gap-2 items-start">
                                            <ArrowRight size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                                            <span className="flex-1">{idea}</span>
                                            <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                <button onClick={() => handleCopy(idea)} className="text-slate-400 hover:text-indigo-600"><Copy size={12}/></button>
                                                <button onClick={() => handleSaveIdea(idea)} className="text-slate-400 hover:text-green-600"><Check size={12}/></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">
                                    {isGenerating ? 'Đang suy nghĩ...' : 'Chưa có ý tưởng'}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Saved Ideas Panel (Last Card Slot or Separate) */}
                <div className="bg-slate-800 text-white rounded-3xl shadow-lg flex flex-col md:col-span-2 lg:col-span-1">
                    <div className="p-5 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2"><Check className="text-green-400"/> Ý tưởng đã chọn</h3>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded-lg">{savedIdeas.length}</span>
                    </div>
                    <div className="p-5 flex-1 overflow-y-auto custom-scrollbar max-h-[400px]">
                        {savedIdeas.length === 0 ? (
                            <div className="text-slate-500 text-center text-sm italic mt-10">
                                Bấm vào dấu tích ở các thẻ để lưu ý tưởng hay vào đây.
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {savedIdeas.map((idea, i) => (
                                    <li key={i} className="text-sm text-slate-300 flex justify-between gap-3 border-b border-slate-700/50 pb-2 last:border-0">
                                        <span>{idea}</span>
                                        <button onClick={() => setSavedIdeas(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400"><Trash2 size={14}/></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-700 text-center">
                         <button onClick={() => navigator.clipboard.writeText(savedIdeas.join('\n'))} className="text-xs font-bold text-indigo-300 hover:text-white uppercase tracking-wider">Copy All</button>
                    </div>
                </div>
            </div>

            {/* HISTORY MODAL */}
            {showHistory && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={20} /> Lịch sử Tư duy</h3>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">Chưa có lịch sử nào.</div>
                            ) : (
                                history.map(session => (
                                    <div key={session.id} onClick={() => handleLoadSession(session)} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 cursor-pointer transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800 text-lg">{session.topic}</div>
                                            <button onClick={(e) => handleDeleteSession(e, session.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        {session.context && <p className="text-sm text-slate-500 mb-3 line-clamp-1 italic">"{session.context}"</p>}
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <div className="flex items-center gap-1"><Clock size={12}/> {new Date(session.createdAt).toLocaleDateString('vi-VN')}</div>
                                            <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold border border-green-100">
                                                {session.savedIdeas?.length || 0} ý tưởng đã lưu
                                            </div>
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

export default ScamperTool;