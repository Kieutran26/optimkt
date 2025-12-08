import React, { useState, useRef, useEffect } from 'react';
import { Mail, Upload, Image as ImageIcon, Bold, Italic, List, Code, Download, Layout, Type, Palette, MousePointerClick, X, Link as LinkIcon, ListOrdered, Droplet, LayoutTemplate, Save, Trash2, CheckCircle2, Plus, History, Eye } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { EmailTemplate, EmailHistoryRecord } from '../types';
import { Toast, ToastType } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

// Predefined Layouts
type EmailLayout = 'modern' | 'minimal' | 'corporate';

const LAYOUTS: { id: EmailLayout; name: string; desc: string; colorClass: string; defaultPrimary: string; defaultBg: string }[] = [
    { id: 'modern', name: 'Modern Card', desc: 'Centered, white card on gray', colorClass: 'bg-indigo-50', defaultPrimary: '#4f46e5', defaultBg: '#f3f4f6' },
    { id: 'minimal', name: 'Clean Minimal', desc: 'Left aligned, stark white', colorClass: 'bg-white', defaultPrimary: '#000000', defaultBg: '#ffffff' },
    { id: 'corporate', name: 'Corporate Blue', desc: 'Structured with header bar', colorClass: 'bg-blue-50', defaultPrimary: '#2563eb', defaultBg: '#eff6ff' },
];

const DEFAULT_CONTENT = '<p>Xin chào,</p><p>Đây là nội dung email mẫu. Bạn có thể chỉnh sửa thoải mái tại đây.</p>';

const VisualEmailBuilder: React.FC = () => {
    // --- Data States ---
    const [logo, setLogo] = useState<string | null>(null);
    const [title, setTitle] = useState('Tiêu đề Email Mới');

    // Content Tracking
    // We use a key to force re-render the contentEditable div when loading templates
    const [editorId, setEditorId] = useState(Date.now());
    const [contentHtml, setContentHtml] = useState(DEFAULT_CONTENT);

    // Footer & CTA
    const [showFooter, setShowFooter] = useState(true);
    const [btnText, setBtnText] = useState('Bắt đầu ngay');
    const [btnUrl, setBtnUrl] = useState('#');
    const [footerText, setFooterText] = useState('© 2025 My Company Inc. All rights reserved.\nHủy đăng ký');

    // Appearance
    const [activeLayout, setActiveLayout] = useState<EmailLayout>('modern');
    const [primaryColor, setPrimaryColor] = useState('#4f46e5');
    const [backgroundColor, setBackgroundColor] = useState('#f3f4f6');

    // UI Modals
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Storage Data
    const [newTemplateName, setNewTemplateName] = useState('');
    const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([]);
    const [emailHistory, setEmailHistory] = useState<EmailHistoryRecord[]>([]);

    const [previewHistoryItem, setPreviewHistoryItem] = useState<EmailHistoryRecord | null>(null);

    // Notification States
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDestructive?: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    // Refs
    const editorRef = useRef<HTMLDivElement>(null);
    const selectionRange = useRef<Range | null>(null);

    // Load initial data
    useEffect(() => {
        setSavedTemplates(StorageService.getEmailTemplates());
        setEmailHistory(StorageService.getEmailHistory());
    }, []);

    // --- Core Actions ---

    // This function forces the editor to completely re-mount with new content
    const reloadEditor = (newContent: string) => {
        setContentHtml(newContent);
        setEditorId(Date.now()); // Change key to force re-render
    };

    const handleCreateNew = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Tạo email mới?',
            message: 'Các thay đổi chưa lưu sẽ bị mất. Bạn có chắc chắn muốn tạo mới không?',
            onConfirm: () => {
                // Reset UI
                setLogo(null);
                setTitle('Tiêu đề Email Mới');
                setShowFooter(true);
                setBtnText('Bắt đầu ngay');
                setBtnUrl('#');
                setFooterText('© 2025 My Company Inc. All rights reserved.\nHủy đăng ký');

                const defaultLayout = 'modern';
                setActiveLayout(defaultLayout);
                const l = LAYOUTS.find(x => x.id === defaultLayout);
                if (l) {
                    setPrimaryColor(l.defaultPrimary);
                    setBackgroundColor(l.defaultBg);
                }

                // Reset Editor
                // Force a complete reset by clearing content first then setting default
                setContentHtml('');
                setTimeout(() => {
                    reloadEditor(DEFAULT_CONTENT);
                }, 10);
                closeConfirmDialog();
                showToast('Đã tạo email mới', 'success');
            }
        });
    };

    const handleLoadTemplate = (template: EmailTemplate) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Áp dụng giao diện?',
            message: `Bạn có muốn áp dụng giao diện "${template.name}" không? Nội dung hiện tại sẽ bị thay thế.`,
            onConfirm: () => {
                const { config } = template;

                setLogo(config.logo);
                setTitle(config.title);
                setShowFooter(config.showFooter);
                setBtnText(config.btnText);
                setBtnUrl(config.btnUrl);
                setFooterText(config.footerText);
                setActiveLayout(config.activeLayout);
                setPrimaryColor(config.primaryColor);
                setBackgroundColor(config.backgroundColor);

                // Load content
                reloadEditor(config.contentHtml);

                setShowListModal(false);
                closeConfirmDialog();
                showToast(`Đã áp dụng giao diện "${template.name}"`, 'success');
            }
        });
    };

    // --- Editor Internal Handling ---

    const handleContentInput = () => {
        if (editorRef.current) {
            setContentHtml(editorRef.current.innerHTML);
            // Save cursor position
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                selectionRange.current = sel.getRangeAt(0);
            }
        }
    };

    const execCmd = (command: string, value: string | undefined = undefined) => {
        if (editorRef.current) editorRef.current.focus();
        document.execCommand(command, false, value);
        handleContentInput();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'content') => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (event) => {
            const res = event.target?.result as string;
            if (target === 'logo') {
                setLogo(res);
            } else {
                if (editorRef.current) editorRef.current.focus();
                const imgHtml = `<img src="${res}" style="max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 8px;" />`;
                document.execCommand('insertHTML', false, imgHtml);
                handleContentInput();
            }
        };
        reader.readAsDataURL(file);
    };

    const handleInsertLink = () => {
        const url = prompt("Nhập đường dẫn URL:", "https://");
        if (url) {
            if (editorRef.current) editorRef.current.focus();
            execCmd('createLink', url);
        }
    };

    // --- Save & Export ---

    const handleSaveTemplate = () => {
        if (!newTemplateName.trim()) {
            showToast('Vui lòng nhập tên giao diện', 'error');
            return;
        }
        // Get directly from DOM to ensure latest edits are saved
        const currentContent = editorRef.current ? editorRef.current.innerHTML : contentHtml;

        const t: EmailTemplate = {
            id: Date.now().toString(),
            name: newTemplateName,
            createdAt: Date.now(),
            config: {
                logo, title, contentHtml: currentContent, showFooter, btnText, btnUrl, footerText, activeLayout, primaryColor, backgroundColor
            }
        };
        const success = StorageService.saveEmailTemplate(t);
        if (success) {
            setSavedTemplates(StorageService.getEmailTemplates());
            setShowSaveModal(false);
            setNewTemplateName('');
            showToast('Đã lưu giao diện thành công!', 'success');
        } else {
            showToast('Không thể lưu. Bộ nhớ đầy, vui lòng xóa bớt dữ liệu cũ.', 'error');
        }
    };

    const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: 'Xóa giao diện?',
            message: 'Hành động này không thể hoàn tác.',
            isDestructive: true,
            onConfirm: () => {
                StorageService.deleteEmailTemplate(id);
                setSavedTemplates(prev => prev.filter(t => t.id !== id));
                closeConfirmDialog();
                showToast('Đã xóa giao diện', 'success');
            }
        });
    };

    const generateHTML = (overrideContent?: string) => {
        const font = "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;";
        let containerStyle = "", wrapperStyle = "", headerStyle = "", buttonStyle = "";

        switch (activeLayout) {
            case 'modern':
                containerStyle = `background-color: ${backgroundColor}; padding: 40px 20px;`;
                wrapperStyle = "background-color: #ffffff; max-width: 600px; margin: 0 auto; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);";
                headerStyle = "text-align: center; margin-bottom: 30px;";
                buttonStyle = `display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;`;
                break;
            case 'minimal':
                containerStyle = `background-color: ${backgroundColor}; padding: 40px 20px;`;
                wrapperStyle = "max-width: 600px; margin: 0 auto; padding: 0;";
                headerStyle = "text-align: left; margin-bottom: 40px; border-bottom: 1px solid #eaeaea; padding-bottom: 20px;";
                buttonStyle = `display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;`;
                break;
            case 'corporate':
                containerStyle = `background-color: ${backgroundColor}; padding: 40px 20px;`;
                wrapperStyle = `background-color: #ffffff; max-width: 600px; margin: 0 auto; border-top: 6px solid ${primaryColor}; padding: 40px;`;
                headerStyle = "text-align: center; margin-bottom: 30px;";
                buttonStyle = `display: inline-block; background-color: ${primaryColor}; color: #ffffff; padding: 12px 32px; border-radius: 4px; text-decoration: none; font-weight: bold;`;
                break;
        }

        const logoHtml = logo ? `<img src="${logo}" alt="Logo" style="max-width: 150px; height: auto; display: block; margin: 0 auto ${activeLayout === 'minimal' ? '0' : '20px'};" />` : '';
        const buttonHtml = showFooter ? `<div style="text-align: center; margin: 40px 0;"><a href="${btnUrl}" style="${buttonStyle}" target="_blank">${btnText}</a></div>` : '';
        const footerHtml = showFooter ? `<div style="border-top: 1px solid #e5e7eb; margin-top: 40px; padding-top: 20px; text-align: center; font-size: 12px; color: #9ca3af;">${footerText.replace(/\n/g, '<br/>')}</div>` : '';

        // Use provided content or current DOM content
        const bodyContent = overrideContent !== undefined ? overrideContent : (editorRef.current ? editorRef.current.innerHTML : contentHtml);
        const contentStyles = `img { max-width: 100%; height: auto; display: block; } a { color: ${primaryColor}; text-decoration: underline; } ul, ol { padding-left: 20px; margin-bottom: 16px; } li { margin-bottom: 8px; } p { margin-bottom: 16px; margin-top: 0; }`;

        return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><style>${contentStyles}</style></head><body style="margin: 0; padding: 0; ${font} line-height: 1.6; color: #333333;"><div style="${containerStyle}"><div style="${wrapperStyle}"><div style="${headerStyle}">${logoHtml}<h1 style="margin: 0; font-size: 24px; color: #111827;">${title}</h1></div><div style="font-size: 16px; color: #4b5563; margin-bottom: 30px;">${bodyContent}</div>${buttonHtml}${footerHtml}</div></div></body></html>`;
    };

    const handleExport = () => {
        // Force sync state from DOM before generating
        if (editorRef.current) {
            setContentHtml(editorRef.current.innerHTML);
        }

        setTimeout(() => {
            const html = generateHTML();

            // Save History
            const success = StorageService.addEmailHistory({
                id: Date.now().toString(),
                timestamp: Date.now(),
                title: title || 'Untitled',
                html: html
            });

            if (success) {
                setEmailHistory(StorageService.getEmailHistory());
            } else {
                showToast('Đã xuất file nhưng không thể lưu lịch sử (bộ nhớ đầy)', 'error');
            }

            // Download
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `email-${Date.now()}.html`;
            a.click();
        }, 50);
    };

    const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: 'Xóa lịch sử?',
            message: 'Bạn có chắc chắn muốn xóa bản ghi này không?',
            isDestructive: true,
            onConfirm: () => {
                StorageService.deleteEmailHistory(id);
                setEmailHistory(prev => prev.filter(h => h.id !== id));
                if (previewHistoryItem?.id === id) setPreviewHistoryItem(null);
                closeConfirmDialog();
                showToast('Đã xóa lịch sử', 'success');
            }
        });
    };

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-pink-100 p-2 rounded-xl text-pink-600">
                        <Mail size={20} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Visual Email</h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCreateNew} className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm" title="Reset">
                        <Plus size={18} strokeWidth={1.5} /> <span className="hidden lg:inline">Tạo mới</span>
                    </button>
                    <button onClick={() => setShowHistoryModal(true)} className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm">
                        <History size={18} strokeWidth={1.5} /> <span className="hidden lg:inline">Lịch sử</span>
                    </button>
                    <button onClick={() => setShowListModal(true)} className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm">
                        <LayoutTemplate size={18} strokeWidth={1.5} /> <span className="hidden lg:inline">Giao diện ({savedTemplates.length})</span>
                    </button>
                    <button onClick={handleExport} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                        <Download size={18} strokeWidth={1.5} /> Xuất HTML
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* EDITOR SIDEBAR */}
                <div className="w-[450px] bg-white border-r border-slate-200 flex flex-col shadow-lg z-10 overflow-y-auto custom-scrollbar relative pb-20">
                    <div className="p-6 space-y-8">
                        {/* 1. Assets */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><ImageIcon size={14} /> Assets</h3>
                            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors relative">
                                {logo ? (
                                    <div className="relative h-16 flex items-center justify-center">
                                        <img src={logo} className="max-h-full max-w-full object-contain" alt="Logo" />
                                        <button onClick={() => setLogo(null)} className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 rounded-full p-1 shadow-md border border-slate-100"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <>
                                        <input type="file" id="logoUpload" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                                        <label htmlFor="logoUpload" className="cursor-pointer flex flex-col items-center gap-2"><Upload size={20} className="text-slate-400" /><span className="text-xs font-medium text-slate-500">Upload Logo</span></label>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* 2. Content */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Type size={14} /> Nội dung</h3>
                            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500" value={title} onChange={(e) => setTitle(e.target.value)} />

                            {/* Rich Editor Container */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                                {/* Toolbar */}
                                <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10 select-none">
                                    <button onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }} className="p-1.5 hover:bg-white rounded text-slate-600"><Bold size={16} /></button>
                                    <button onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }} className="p-1.5 hover:bg-white rounded text-slate-600"><Italic size={16} /></button>
                                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                    <div className="relative p-1.5 hover:bg-white rounded text-slate-600 cursor-pointer"><Palette size={16} /><input type="color" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => execCmd('foreColor', e.target.value)} /></div>
                                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                    <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }} className="p-1.5 hover:bg-white rounded text-slate-600"><List size={16} /></button>
                                    <button onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }} className="p-1.5 hover:bg-white rounded text-slate-600"><ListOrdered size={16} /></button>
                                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                                    <button onMouseDown={(e) => { e.preventDefault(); handleInsertLink(); }} className="p-1.5 hover:bg-white rounded text-slate-600"><LinkIcon size={16} /></button>
                                    <label className="p-1.5 hover:bg-white rounded text-slate-600 cursor-pointer"><ImageIcon size={16} /><input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'content')} /></label>
                                </div>

                                {/* THE EDITOR - Re-mounts when editorId changes */}
                                <div
                                    key={editorId}
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={handleContentInput}
                                    className="p-4 min-h-[200px] text-sm text-slate-700 outline-none leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: contentHtml }}
                                />
                            </div>
                        </div>

                        {/* 3. Footer */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><MousePointerClick size={14} /> CTA & Footer</h3>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={showFooter} onChange={(e) => setShowFooter(e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div></label>
                            </div>
                            {showFooter && (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500" placeholder="Text" value={btnText} onChange={(e) => setBtnText(e.target.value)} />
                                        <input className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500" placeholder="Link" value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} />
                                    </div>
                                    <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-indigo-500 h-20 resize-none" value={footerText} onChange={(e) => setFooterText(e.target.value)} />
                                </div>
                            )}
                        </div>

                        {/* 4. Layout */}
                        <div className="space-y-4 pb-10">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Layout size={14} /> Layout & Colors</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {LAYOUTS.map(layout => (
                                    <button key={layout.id} onClick={() => { setActiveLayout(layout.id); setPrimaryColor(layout.defaultPrimary); setBackgroundColor(layout.defaultBg); }} className={`flex items-center gap-4 p-3 rounded-xl border text-left transition-all ${activeLayout === layout.id ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                                        <div className={`w-10 h-10 rounded-lg flex-shrink-0 border border-slate-200 ${layout.colorClass}`}></div>
                                        <div><div className="font-bold text-sm text-slate-800">{layout.name}</div><div className="text-xs text-slate-500">{layout.desc}</div></div>
                                    </button>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-medium text-slate-400 mb-1">Màu chính</label><div className="flex items-center gap-2 p-2 border border-slate-200 rounded-xl bg-white"><div className="w-8 h-8 rounded-lg overflow-hidden relative border border-slate-200"><input type="color" className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} /></div><span className="text-xs font-mono text-slate-600">{primaryColor}</span></div></div>
                                <div><label className="block text-xs font-medium text-slate-400 mb-1">Màu nền</label><div className="flex items-center gap-2 p-2 border border-slate-200 rounded-xl bg-white"><div className="w-8 h-8 rounded-lg overflow-hidden relative border border-slate-200"><input type="color" className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} /></div><span className="text-xs font-mono text-slate-600">{backgroundColor}</span></div></div>
                            </div>
                        </div>
                    </div>
                    {/* Sticky Save */}
                    <div className="p-4 bg-white border-t border-slate-200 absolute bottom-0 left-0 right-0 z-20">
                        <button onClick={() => setShowSaveModal(true)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-soft"><Save size={18} /> Lưu cấu hình</button>
                    </div>
                </div>

                {/* PREVIEW */}
                <div className="flex-1 bg-slate-100 overflow-y-auto p-8 flex justify-center">
                    <div className="w-full max-w-[700px]">
                        <div className="text-center mb-4"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-white px-3 py-1 rounded-full shadow-sm">Live Preview</span></div>
                        <div className="shadow-2xl rounded-xl overflow-hidden animate-fade-in transition-all duration-300 bg-white h-[800px] border border-slate-200">
                            <iframe srcDoc={generateHTML()} className="w-full h-full border-none" title="Email Preview" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Lưu Giao Diện</h3>
                        <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:border-indigo-500" placeholder="Tên giao diện..." value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} autoFocus />
                        <div className="flex gap-3">
                            <button onClick={() => setShowSaveModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50">Hủy</button>
                            <button onClick={handleSaveTemplate} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {showListModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800">Giao diện đã lưu</h3>
                            <button onClick={() => setShowListModal(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3">
                            {savedTemplates.length === 0 ? <div className="text-center py-10 text-slate-400">Chưa có giao diện nào.</div> : savedTemplates.map(t => (
                                <div key={t.id} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all bg-white flex justify-between items-center cursor-pointer" onClick={() => handleLoadTemplate(t)}>
                                    <div><div className="font-bold text-slate-800">{t.name}</div><div className="text-xs text-slate-400 mt-1">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</div></div>
                                    <button onClick={(e) => handleDeleteTemplate(e, t.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showHistoryModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`bg-white rounded-3xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in flex flex-col max-h-[90vh] ${previewHistoryItem ? 'max-w-4xl' : 'max-w-xl'}`}>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={20} /> {previewHistoryItem ? 'Xem trước Email' : 'Lịch sử Email'}</h3>
                            <button onClick={() => previewHistoryItem ? setPreviewHistoryItem(null) : setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="flex flex-1 overflow-hidden">
                            {!previewHistoryItem ? (
                                <div className="p-6 overflow-y-auto w-full space-y-3">
                                    {emailHistory.length === 0 ? <div className="text-center py-12 text-slate-400">Chưa có lịch sử.</div> : emailHistory.map(h => (
                                        <div key={h.id} onClick={() => setPreviewHistoryItem(h)} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-md transition-all bg-white cursor-pointer flex justify-between items-center">
                                            <div><div className="font-bold text-slate-800">{h.title}</div><div className="text-xs text-slate-400 mt-1">{new Date(h.timestamp).toLocaleString('vi-VN')}</div></div>
                                            <div className="flex items-center gap-2"><button onClick={(e) => handleDeleteHistory(e, h.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button><div className="text-indigo-400 bg-indigo-50 p-2 rounded-lg"><Eye size={18} /></div></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 bg-slate-200 p-8 flex justify-center w-full overflow-hidden"><div className="w-full max-w-[700px] h-full bg-white shadow-2xl rounded-xl overflow-hidden"><iframe srcDoc={previewHistoryItem.html} className="w-full h-full border-none" /></div></div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Global UI Components */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                isDestructive={confirmDialog.isDestructive}
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirmDialog}
            />
        </div>
    );
};

export default VisualEmailBuilder;