import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragStartEvent, DragEndEvent, useDraggable, useDroppable,
    defaultDropAnimationSideEffects, DropAnimation,
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Send, Monitor, Smartphone, LayoutGrid, Type, Image as ImageIcon, CheckSquare, Maximize2, X, Plus, Trash2, Eye, Download, Upload, Save, History, Code, FileJson, Copy, Briefcase, Gift, ShoppingBag, MapPin, Heart, Sparkles, User, Users,
    Mail, MousePointerClick, Link2, Minus, Rows, Columns, PlayCircle, PanelTop, CreditCard, PanelBottom, UserMinus, Grid, Ticket, ShoppingCart, Receipt, Home, List, FileText, ExternalLink, Palette, Circle, Tablet, Check, GripVertical, ChevronUp, ChevronDown, Settings, AlignLeft, AlignCenter, AlignRight, Layers, Square
} from 'lucide-react';
import { EmailService } from '../services/emailService';
import { StorageService } from '../services/storageService';
import {
    EmailTemplate, EmailHistoryRecord, EmailBlock, EmailDocument,
    HeadingBlock, TextBlock, ImageBlock, ButtonBlock, SpacerBlock,
    DividerBlock, SocialBlock, EmailBlockType,
} from '../types';
import { Toast, ToastType } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

// =============================================
// CONSTANTS
// =============================================
const MERGE_TAGS = [
    { label: 'Tên', value: '{{name}}' },
    { label: 'Email', value: '{{email}}' },
    { label: 'Công ty', value: '{{company}}' },
    { label: 'Điện thoại', value: '{{phone}}' },
];

const ELEMENT_TYPES: { type: EmailBlockType; label: string; icon?: React.ReactNode; iconText?: string; level?: 'h1' | 'h2' | 'h3' }[] = [
    { type: 'heading', label: 'Heading 1', iconText: 'H1', level: 'h1' },
    { type: 'heading', label: 'Heading 2', iconText: 'H2', level: 'h2' },
    { type: 'heading', label: 'Heading 3', iconText: 'H3', level: 'h3' },
    { type: 'text', label: 'Text', icon: <AlignLeft size={20} /> },
    { type: 'button', label: 'Button', icon: <MousePointerClick size={20} /> },
    { type: 'link', label: 'Link', icon: <Link2 size={20} /> },
    { type: 'image', label: 'Image', icon: <ImageIcon size={20} /> },
    { type: 'divider', label: 'Divider', icon: <Minus size={20} /> },
];

const LAYOUT_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'row2', label: '2 Rows', icon: <Rows size={20} /> },
    { type: 'row3', label: '3 Rows', icon: <Rows size={20} /> },
    { type: 'column2', label: '2 Columns', icon: <Columns size={20} /> },
    { type: 'column3', label: '3 Columns', icon: <Columns size={20} /> },
    { type: 'html', label: 'HTML', icon: <Code size={20} /> },
];

const MEDIA_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'image', label: 'Image', icon: <ImageIcon size={20} /> },
    { type: 'video', label: 'Video', icon: <PlayCircle size={20} /> },
];

const CUSTOM_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'header', label: 'Header', icon: <PanelTop size={20} /> },
    { type: 'product', label: 'Product Card', icon: <CreditCard size={20} /> },
    { type: 'footer', label: 'Footer', icon: <PanelBottom size={20} /> },
    { type: 'unsubscribe', label: 'Unsubscribe', icon: <UserMinus size={20} /> },
];

const ECOMMERCE_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'product-grid', label: 'Product Grid', icon: <Grid size={20} /> },
    { type: 'coupon', label: 'Coupon Code', icon: <Ticket size={20} /> },
    { type: 'cart-reminder', label: 'Cart Reminder', icon: <ShoppingCart size={20} /> },
    { type: 'order-summary', label: 'Order Summary', icon: <Receipt size={20} /> },
];

const REAL_ESTATE_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'property-card', label: 'Property Card', icon: <Home size={20} /> },
    { type: 'features', label: 'Features', icon: <List size={20} /> },
    { type: 'location', label: 'Location Map', icon: <MapPin size={20} /> },
];

const RECRUITMENT_ELEMENTS: { type: EmailBlockType; label: string; icon: React.ReactNode }[] = [
    { type: 'job-listing', label: 'Job Listing', icon: <Briefcase size={20} /> },
    { type: 'benefits', label: 'Benefits List', icon: <Gift size={20} /> },
];

const TEMPLATE_LIBRARY = [
    { id: 't1', name: 'Welcome Modern', category: 'Welcome', icon: <Sparkles size={18} />, color: 'bg-purple-100 text-purple-600' },
    { id: 't2', name: 'Product Launch', category: 'Product', icon: <ShoppingBag size={18} />, color: 'bg-blue-100 text-blue-600' },
    { id: 't3', name: 'Newsletter Clean', category: 'Newsletter', icon: <FileText size={18} />, color: 'bg-green-100 text-green-600' },
    { id: 't4', name: 'Thank You Card', category: 'Thanks', icon: <Heart size={18} />, color: 'bg-pink-100 text-pink-600' },
];


const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Recursive helper to find block by ID
const findBlockById = (blocks: EmailBlock[], id: string): EmailBlock | null => {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (['row2', 'row3', 'column2', 'column3'].includes(block.type) && (block as any).children) {
            for (const cell of (block as any).children) {
                const found = findBlockById(cell, id);
                if (found) return found;
            }
        }
    }
    return null;
};

// Recursive helper to update block in list
const updateBlockInList = (blocks: EmailBlock[], updatedBlock: EmailBlock): EmailBlock[] => {
    return blocks.map(b => {
        if (b.id === updatedBlock.id) return updatedBlock;
        if (['row2', 'row3', 'column2', 'column3'].includes(b.type) && (b as any).children) {
            const newChildren = (b as any).children.map((cell: EmailBlock[]) => updateBlockInList(cell, updatedBlock));
            return { ...b, children: newChildren };
        }
        return b;
    });
};

// Recursive help to insert a block into a specific parent cell
const insertBlockIntoParent = (blocks: EmailBlock[], parentId: string, cellIndex: number, newBlock: EmailBlock): EmailBlock[] => {
    return blocks.map(b => {
        if (b.id === parentId) {
            const newChildren = [...(b as any).children];
            if (newChildren[cellIndex]) {
                newChildren[cellIndex] = [...newChildren[cellIndex], newBlock];
            }
            return { ...b, children: newChildren };
        }
        if (['row2', 'row3', 'column2', 'column3'].includes(b.type) && (b as any).children) {
            const newChildren = (b as any).children.map((cell: EmailBlock[]) => insertBlockIntoParent(cell, parentId, cellIndex, newBlock));
            return { ...b, children: newChildren };
        }
        return b;
    });
};

const createDefaultBlock = (type: EmailBlockType, level?: 'h1' | 'h2' | 'h3'): EmailBlock => {

    const id = generateId();
    switch (type) {
        case 'heading': return { id, type: 'heading', content: level === 'h1' ? 'Heading 1' : level === 'h2' ? 'Heading 2' : 'Heading 3', level: level || 'h1', alignment: 'center', color: '#1f2937' };
        case 'text': return { id, type: 'text', content: 'Nhập nội dung...', alignment: 'left' };
        case 'image': return { id, type: 'image', src: '', alt: 'Hình ảnh', width: 'full', alignment: 'center' };
        case 'button': return { id, type: 'button', label: 'Click', url: '#', backgroundColor: '#3b82f6', textColor: '#ffffff', borderRadius: 8, alignment: 'center' };
        case 'spacer': return { id, type: 'spacer', height: 32 };
        case 'divider': return { id, type: 'divider', style: 'solid', color: '#e5e7eb' };
        case 'social': return { id, type: 'social', platforms: [{ name: 'Facebook', url: '#' }], alignment: 'center' };
        case 'link': return { id, type: 'link', text: 'Click here', url: '#', alignment: 'left', color: '#3b82f6' };
        case 'row2': return { id, type: 'row2', children: [[], []] };
        case 'row3': return { id, type: 'row3', children: [[], [], []] };
        case 'column2': return { id, type: 'column2', children: [[], []] };
        case 'column3': return { id, type: 'column3', children: [[], [], []] };
        case 'html': return { id, type: 'html', content: '<p style="color:#3b82f6;font-weight:bold;">Custom HTML Content</p>' };
        case 'video': return { id, type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', alt: 'Video thumbnail', alignment: 'center' };
        case 'header': return { id, type: 'header', logoSrc: '', navLinks: [{ text: 'Home', url: '#' }, { text: 'Shop', url: '#' }, { text: 'Contact', url: '#' }], backgroundColor: '#ffffff', alignment: 'center' };
        case 'footer': return { id, type: 'footer', content: '<p>&copy; 2024 Your Company. All rights reserved.</p>', address: '123 Street, City, Country', socialLinks: [{ name: 'Facebook', url: '#' }, { name: 'Instagram', url: '#' }], backgroundColor: '#f3f4f6', alignment: 'center' };
        case 'product': return { id, type: 'product', productImage: '', title: 'Product Name', price: '$99.00', description: 'Amazing product description goes here.', url: '#', buttonText: 'Buy Now', buttonColor: '#3b82f6', backgroundColor: '#ffffff' };
        case 'unsubscribe': return { id, type: 'unsubscribe', text: 'No longer want to receive these emails? <a href="{{unsubscribe}}">Unsubscribe</a>.', alignment: 'center' };

        // E-commerce
        case 'product-grid': return { id, type: 'product-grid', products: [{ id: '1', image: '', title: 'Product 1', price: '$50', url: '#' }, { id: '2', image: '', title: 'Product 2', price: '$75', url: '#' }], backgroundColor: '#ffffff' };
        case 'coupon': return { id, type: 'coupon', code: 'SAVE20', discount: '20% OFF', description: 'Use this code at checkout for 20% off your entire order.', backgroundColor: '#fef3c7', borderColor: '#d97706', alignment: 'center' };
        case 'cart-reminder': return { id, type: 'cart-reminder', itemsCount: 2, totalPrice: '$125.00', itemImages: ['', ''], checkoutUrl: '#' };
        case 'order-summary': return { id, type: 'order-summary', orderId: '#ORD-12345', items: [{ name: 'Product A', qty: 1, price: '$50' }, { name: 'Product B', qty: 1, price: '$75' }], total: '$125.00', shippingAddress: '123 Main St, City, Country' };

        // Real Estate
        case 'property-card': return { id, type: 'property-card', image: '', title: 'Modern Apartment', price: '$250,000', address: '123 Downtown Ave, City', specs: { beds: 2, baths: 2, area: '85m²' }, url: '#' };
        case 'features': return { id, type: 'features', features: [{ icon: 'check', text: 'Swimming Pool' }, { icon: 'check', text: 'Gym' }, { icon: 'check', text: 'Parking' }, { icon: 'check', text: 'Security' }], columns: 2 };
        case 'location': return { id, type: 'location', mapImage: '', address: '123 Downtown Ave, City, Country', url: '#' };

        // Recruitment
        case 'job-listing': return { id, type: 'job-listing', title: 'Senior Marketing Manager', department: 'Marketing', location: 'Remote / Ho Chi Minh', salary: '$2000 - $3000', url: '#', tags: ['Full-time', 'Senior Level'] };
        case 'benefits': return { id, type: 'benefits', benefits: [{ title: 'Health Insurance', description: 'Full coverage for you and family' }, { title: 'Remote Work', description: 'Work from anywhere' }] };

        default: return { id, type: 'text', content: '', alignment: 'left' };
    }
};

const DEFAULT_DOC: EmailDocument = {
    blocks: [
        { id: 'd1', type: 'heading', content: 'Chào mừng!', level: 'h1', alignment: 'center', color: '#1f2937' } as HeadingBlock,
        { id: 'd2', type: 'text', content: 'Kéo thả để xây dựng email.', alignment: 'center' } as TextBlock,
        { id: 'd3', type: 'button', label: 'Bắt đầu', url: '#', backgroundColor: '#3b82f6', textColor: '#fff', borderRadius: 8, alignment: 'center' } as ButtonBlock,
    ],
    settings: { backgroundColor: '#f3f4f6', contentWidth: 600, fontFamily: 'Arial, sans-serif', primaryColor: '#3b82f6' },
};

// =============================================
// LEFT SIDEBAR
// =============================================
type LeftTabType = 'elements' | 'templates' | 'fields';

const DraggableElement: React.FC<{ type: EmailBlockType; label: string; icon?: React.ReactNode; iconText?: string; level?: 'h1' | 'h2' | 'h3' }> = ({ type, label, icon, iconText, level }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `element-${type}-${label}`, data: { type, isNew: true, level } });
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }} {...listeners} {...attributes}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-100 rounded-2xl cursor-grab hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                {iconText ? <span className="text-sm font-bold">{iconText}</span> : icon}
            </div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
        </div>
    );
};

const DraggableMergeTag: React.FC<{ tag: { label: string; value: string } }> = ({ tag }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `tag-${tag.value}`, data: { tag: tag.value, isTag: true } });
    return (
        <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }} {...listeners} {...attributes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium cursor-grab hover:bg-blue-100 border border-blue-100">
            <span className="font-mono text-blue-500">{tag.value}</span>
        </div>
    );
};

const LeftSidebar: React.FC<{ activeTab: LeftTabType; onTabChange: (t: LeftTabType) => void; onTemplateSelect: (id: string) => void; hasCustomerList: boolean }> = ({ activeTab, onTabChange, onTemplateSelect, hasCustomerList }) => {
    const tabs = [
        { id: 'elements' as const, label: 'Blocks', icon: <LayoutGrid size={15} /> },
        { id: 'templates' as const, label: 'Templates', icon: <FileText size={15} /> },
        { id: 'fields' as const, label: 'Fields', icon: <Users size={15} /> },
    ];
    return (
        <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
            <div className="flex p-2 gap-1 border-b border-gray-100">
                {tabs.map((tab) => (
                    <button key={tab.id} onClick={() => onTabChange(tab.id)} className={`flex-1 py-2 px-1 text-[11px] font-medium rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${activeTab === tab.id ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                        {React.cloneElement(tab.icon as React.ReactElement, { size: 18 })}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
                {activeTab === 'elements' && (
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Cơ Bản</h3>
                            <div className="grid grid-cols-2 gap-2">{ELEMENT_TYPES.filter(e => e.type !== 'image').map((el, i) => <DraggableElement key={`${el.type}-${i}`} {...el} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Bố Cục</h3>
                            <div className="grid grid-cols-2 gap-2">{LAYOUT_ELEMENTS.map((el, i) => <DraggableElement key={`layout-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Đa Phương Tiện</h3>
                            <div className="grid grid-cols-2 gap-2">{MEDIA_ELEMENTS.map((el, i) => <DraggableElement key={`media-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Tuỳ Biến</h3>
                            <div className="grid grid-cols-2 gap-2">{CUSTOM_ELEMENTS.map((el, i) => <DraggableElement key={`custom-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">E-commerce</h3>
                            <div className="grid grid-cols-2 gap-2">{ECOMMERCE_ELEMENTS.map((el, i) => <DraggableElement key={`ecom-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Bất Động Sản</h3>
                            <div className="grid grid-cols-2 gap-2">{REAL_ESTATE_ELEMENTS.map((el, i) => <DraggableElement key={`real-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-800">Tuyển Dụng</h3>
                            <div className="grid grid-cols-2 gap-2">{RECRUITMENT_ELEMENTS.map((el, i) => <DraggableElement key={`rec-${el.type}-${i}`} type={el.type} label={el.label} icon={el.icon} />)}</div>
                        </div>
                    </div>
                )}
                {activeTab === 'templates' && (
                    <div className="space-y-3">
                        <button className="w-full py-2.5 px-4 bg-blue-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-blue-700"><ExternalLink size={16} /> Open Library</button>
                        <div className="space-y-2">{TEMPLATE_LIBRARY.map((tpl) => (
                            <button key={tpl.id} onClick={() => onTemplateSelect(tpl.id)} className="w-full p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3 hover:border-blue-300 hover:shadow-sm text-left">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tpl.color}`}>{tpl.icon}</div>
                                <div className="flex-1 min-w-0"><div className="font-medium text-gray-800 text-sm truncate">{tpl.name}</div><span className={`text-[10px] px-1.5 py-0.5 rounded ${tpl.color}`}>{tpl.category}</span></div>
                            </button>
                        ))}</div>
                    </div>
                )}
                {activeTab === 'fields' && (
                    <div className="space-y-4">
                        {!hasCustomerList ? <div className="text-center py-8"><Users size={32} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500 mb-4">Chọn danh sách</p><button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Select List</button></div>
                            : <div className="space-y-3"><p className="text-xs text-gray-500 font-medium">Merge Tags:</p><div className="flex flex-wrap gap-2">{MERGE_TAGS.map((tag) => <DraggableMergeTag key={tag.value} tag={tag} />)}</div></div>}
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================
// BORDER & SHADOW SETTINGS
// =============================================
interface StyleState { borderWidth: number; borderStyle: 'solid' | 'dashed' | 'dotted' | 'double'; borderColor: string; borderRadius: number; boxShadow: string; hideDesktop: boolean; hideMobile: boolean; hideTablet: boolean; }

const BorderShadowSettings: React.FC<{ style: StyleState; onChange: (s: StyleState) => void }> = ({ style, onChange }) => {
    const borderWidths = [{ label: 'None', value: 0 }, { label: '1px', value: 1 }, { label: '2px', value: 2 }, { label: '3px', value: 3 }, { label: '4px', value: 4 }];
    const borderStyles = [
        { id: 'solid', label: 'Liền', icon: <div className="w-full h-0.5 bg-gray-800" /> },
        { id: 'dashed', label: 'Đứt', icon: <div className="w-full h-0.5 border-t-2 border-dashed border-gray-800" /> },
        { id: 'dotted', label: 'Chấm', icon: <div className="w-full h-0.5 border-t-2 border-dotted border-gray-800" /> },
        { id: 'double', label: 'Đôi', icon: <div className="flex flex-col gap-0.5"><div className="w-full h-0.5 bg-gray-800" /><div className="w-full h-0.5 bg-gray-800" /></div> },
    ];
    const radiusPresets = [0, 4, 8, 12, 16, 24];
    const shadows = [
        { id: 'none', label: 'None', class: '' },
        { id: 'sm', label: 'Soft', class: 'shadow-sm' },
        { id: 'md', label: 'Medium', class: 'shadow-md' },
        { id: 'lg', label: 'Large', class: 'shadow-lg' },
        { id: 'xl', label: 'X-Large', class: 'shadow-xl' },
        { id: '2xl', label: '2XL', class: 'shadow-2xl' },
    ];

    return (
        <div className="space-y-5">
            {/* Section Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Palette size={16} className="text-gray-400" />
                <span className="font-semibold text-gray-800 text-sm">Viền & Đổ bóng</span>
            </div>

            {/* Border Width */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Border Width</label>
                <div className="flex gap-1">
                    {borderWidths.map((bw) => (
                        <button key={bw.value} onClick={() => onChange({ ...style, borderWidth: bw.value })} className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-all ${style.borderWidth === bw.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{bw.label}</button>
                    ))}
                </div>
            </div>

            {/* Border Style */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Border Style</label>
                <div className="grid grid-cols-4 gap-2">
                    {borderStyles.map((bs) => (
                        <button key={bs.id} onClick={() => onChange({ ...style, borderStyle: bs.id as any })} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${style.borderStyle === bs.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className="w-8">{bs.icon}</div>
                            <span className="text-[10px] text-gray-600">{bs.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Border Color */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Border Color</label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-300 relative shrink-0">
                        <input type="color" value={style.borderColor} onChange={(e) => onChange({ ...style, borderColor: e.target.value })} className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" />
                    </div>
                    <input type="text" value={style.borderColor} onChange={(e) => onChange({ ...style, borderColor: e.target.value })} className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700" />
                </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Border Radius</label>
                <div className="flex gap-1 mb-2">
                    {radiusPresets.map((r) => (
                        <button key={r} onClick={() => onChange({ ...style, borderRadius: r })} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${style.borderRadius === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{r}</button>
                    ))}
                    <button onClick={() => onChange({ ...style, borderRadius: 9999 })} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${style.borderRadius === 9999 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}><Circle size={12} /></button>
                </div>
                <div className="flex items-center gap-3">
                    <input type="range" min="0" max="100" value={style.borderRadius > 100 ? 100 : style.borderRadius} onChange={(e) => onChange({ ...style, borderRadius: +e.target.value })} className="flex-1 accent-blue-600" />
                    <input type="number" value={style.borderRadius} onChange={(e) => onChange({ ...style, borderRadius: +e.target.value })} className="w-16 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center" />
                </div>
            </div>

            {/* Box Shadow */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Box Shadow</label>
                <div className="grid grid-cols-3 gap-2">
                    {shadows.map((sh) => (
                        <button key={sh.id} onClick={() => onChange({ ...style, boxShadow: sh.id })} className={`p-3 rounded-xl border-2 flex items-center justify-center transition-all ${style.boxShadow === sh.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className={`w-10 h-10 bg-white rounded-lg ${sh.class} border border-gray-100 flex items-center justify-center`}>
                                <span className="text-[9px] text-gray-500 font-medium">{sh.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// =============================================
// VISIBILITY SETTINGS
// =============================================
const VisibilitySettings: React.FC<{ style: StyleState; onChange: (s: StyleState) => void }> = ({ style, onChange }) => {
    const devices = [
        { key: 'hideDesktop' as const, label: 'Hide on Desktop', desc: '>768px', icon: <Monitor size={18} /> },
        { key: 'hideMobile' as const, label: 'Hide on Mobile', desc: '≤768px', icon: <Smartphone size={18} /> },
        { key: 'hideTablet' as const, label: 'Hide on Tablet', desc: '769-1024px', icon: <Tablet size={18} /> },
    ];
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Eye size={16} className="text-gray-400" />
                <span className="font-semibold text-gray-800 text-sm">Hiển thị</span>
            </div>
            <div className="space-y-2">
                {devices.map((d) => (
                    <label key={d.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${style[d.key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                {style[d.key] && <Check size={12} className="text-white" />}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-800">{d.label}</div>
                                <div className="text-[10px] text-gray-400">{d.desc}</div>
                            </div>
                        </div>
                        <div className="text-gray-400">{d.icon}</div>
                        <input type="checkbox" checked={style[d.key]} onChange={(e) => onChange({ ...style, [d.key]: e.target.checked })} className="sr-only" />
                    </label>
                ))}
            </div>
        </div>
    );
};

// =============================================
// CANVAS COMPONENTS
// =============================================
const DropIndicator: React.FC<{ show: boolean }> = ({ show }) => show ? <div className="h-14 mx-2 my-1 border-2 border-dashed border-blue-400 bg-blue-50/50 rounded-xl flex items-center justify-center animate-pulse"><span className="text-sm font-medium text-blue-500">Thả vào đây</span></div> : null;

// Droppable Cell for Row/Column blocks
const DroppableCell: React.FC<{ id: string; children: React.ReactNode; className?: string }> = ({ id, children, className }) => {
    const { isOver, setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className={`${className || ''} ${isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''} transition-all`}>
            {children}
        </div>
    );
};

const FloatingToolbar: React.FC<{ onMoveUp: () => void; onMoveDown: () => void; onDuplicate: () => void; onDelete: () => void; dragListeners?: any; dragAttributes?: any; canMoveUp: boolean; canMoveDown: boolean }> = ({ onMoveUp, onMoveDown, onDuplicate, onDelete, dragListeners, dragAttributes, canMoveUp, canMoveDown }) => (
    <div className="absolute -top-10 left-0 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-20">
        <button {...dragListeners} {...dragAttributes} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded cursor-grab"><GripVertical size={14} /></button>
        <div className="w-px h-4 bg-gray-200" />
        <button onClick={onMoveUp} disabled={!canMoveUp} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronUp size={14} /></button>
        <button onClick={onMoveDown} disabled={!canMoveDown} className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-30"><ChevronDown size={14} /></button>
        <div className="w-px h-4 bg-gray-200" />
        <button onClick={onDuplicate} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Copy size={14} /></button>
        <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
    </div>
);

// Reusable Block Renderer
const BlockRenderer: React.FC<{ block: EmailBlock; isSelected?: boolean; onSelect?: (id?: string) => void; onUpdate: (b: EmailBlock) => void }> = ({ block, isSelected, onSelect, onUpdate }) => {
    switch (block.type) {
        case 'heading': const Tag = block.level as keyof JSX.IntrinsicElements; const sizes = { h1: 'text-2xl', h2: 'text-xl', h3: 'text-lg' }; return <Tag className={`${sizes[block.level]} font-bold py-3 px-4 rounded-lg outline-none`} style={{ textAlign: block.alignment, color: block.color }} contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate({ ...block, content: e.currentTarget.textContent || '' })}>{block.content}</Tag>;
        case 'text': return <div className="py-3 px-4 rounded-lg text-gray-700 outline-none" style={{ textAlign: block.alignment }} contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate({ ...block, content: e.currentTarget.innerHTML })} dangerouslySetInnerHTML={{ __html: block.content }} />;
        case 'image': return <div className="py-3 px-4" style={{ textAlign: block.alignment }}>{block.src ? <img src={block.src} alt={block.alt} className={`inline-block rounded-lg ${block.width === 'full' ? 'w-full' : 'max-w-xs'}`} /> : <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center"><ImageIcon size={28} className="mx-auto text-gray-400 mb-2" /><span className="text-sm text-gray-500">Add image</span></div>}</div>;
        case 'button': return <div className="py-4 px-4" style={{ textAlign: block.alignment }}><a href="#" className="inline-block font-bold py-2.5 px-6" style={{ backgroundColor: block.backgroundColor, color: block.textColor, borderRadius: `${block.borderRadius}px` }} onClick={(e) => e.preventDefault()}>{block.label}</a></div>;
        case 'spacer': return <div className={isSelected ? 'bg-blue-50/50 border border-dashed border-blue-200 rounded-lg' : ''} style={{ height: `${block.height}px` }} />;
        case 'divider': return <div className="py-4 px-4"><hr style={{ borderStyle: block.style, borderColor: block.color }} /></div>;
        case 'social': return <div className="py-4 px-4" style={{ textAlign: block.alignment }}><div className="inline-flex gap-3">{block.platforms.map((p, i) => <div key={i} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">{p.name.charAt(0)}</div>)}</div></div>;
        case 'link': return <div className="py-3 px-4" style={{ textAlign: block.alignment }}><a href="#" onClick={(e) => e.preventDefault()} className="inline-flex items-center gap-1.5 underline font-medium" style={{ color: block.color }}><Link2 size={14} />{block.text}</a></div>;
        case 'row2': return <div className="py-3 px-4 space-y-2">{block.children.map((childBlocks, i) => <DroppableCell key={i} id={`${block.id}-cell-${i}`} className="p-3 bg-gray-50 border border-gray-200 border-dashed rounded-lg min-h-[40px]">{childBlocks.length === 0 ? <span className="text-xs text-gray-400">Thả element vào đây</span> : childBlocks.map(cb => <div key={cb.id} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(cb.id); }} className={`mb-1 transition-all rounded-lg border-2 ${isSelected ? '' : 'hover:border-blue-300 border-transparent'} cursor-pointer bg-white relative`}>{cb.id === isSelected ? <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none z-10" /> : null}<BlockRenderer block={cb} onUpdate={onUpdate} /></div>)}</DroppableCell>)}</div>;
        case 'row3': return <div className="py-3 px-4 space-y-2">{block.children.map((childBlocks, i) => <DroppableCell key={i} id={`${block.id}-cell-${i}`} className="p-3 bg-gray-50 border border-gray-200 border-dashed rounded-lg min-h-[40px]">{childBlocks.length === 0 ? <span className="text-xs text-gray-400">Thả element vào đây</span> : childBlocks.map(cb => <div key={cb.id} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(cb.id); }} className={`mb-1 transition-all rounded-lg border-2 ${isSelected ? '' : 'hover:border-blue-300 border-transparent'} cursor-pointer bg-white relative`}>{cb.id === isSelected ? <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none z-10" /> : null}<BlockRenderer block={cb} onUpdate={onUpdate} /></div>)}</DroppableCell>)}</div>;
        case 'column2': return <div className="py-3 px-4 grid grid-cols-2 gap-2">{block.children.map((childBlocks, i) => <DroppableCell key={i} id={`${block.id}-cell-${i}`} className="p-3 bg-gray-50 border border-gray-200 border-dashed rounded-lg min-h-[60px]">{childBlocks.length === 0 ? <span className="text-xs text-gray-400">Thả element vào đây</span> : childBlocks.map(cb => <div key={cb.id} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(cb.id); }} className={`mb-1 transition-all rounded-lg border-2 ${isSelected ? '' : 'hover:border-blue-300 border-transparent'} cursor-pointer bg-white relative`}>{cb.id === isSelected ? <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none z-10" /> : null}<BlockRenderer block={cb} onUpdate={onUpdate} /></div>)}</DroppableCell>)}</div>;
        case 'column3': return <div className="py-3 px-4 grid grid-cols-3 gap-2">{block.children.map((childBlocks, i) => <DroppableCell key={i} id={`${block.id}-cell-${i}`} className="p-3 bg-gray-50 border border-gray-200 border-dashed rounded-lg min-h-[60px]">{childBlocks.length === 0 ? <span className="text-xs text-gray-400">Thả element vào đây</span> : childBlocks.map(cb => <div key={cb.id} onClick={(e) => { e.stopPropagation(); onSelect && onSelect(cb.id); }} className={`mb-1 transition-all rounded-lg border-2 ${isSelected ? '' : 'hover:border-blue-300 border-transparent'} cursor-pointer bg-white relative`}>{cb.id === isSelected ? <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none z-10" /> : null}<BlockRenderer block={cb} onUpdate={onUpdate} /></div>)}</DroppableCell>)}</div>;
        case 'html': return <div className="py-3 px-4"><div className="p-3 bg-white border border-gray-200 rounded-lg" dangerouslySetInnerHTML={{ __html: block.content }} /></div>;
        case 'video': return <div className="py-3 px-4" style={{ textAlign: block.alignment }}><div className="relative inline-block rounded-xl overflow-hidden bg-gray-900 group cursor-pointer">{block.thumbnail ? <img src={block.thumbnail} alt={block.alt} className="max-w-full h-auto opacity-80" /> : <div className="w-full h-48 bg-gray-800 flex items-center justify-center text-gray-500 mb-2 min-w-[300px]"><PlayCircle size={48} className="text-white opacity-80" /></div>}<div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"><PlayCircle size={24} className="text-white fill-white" /></div></div></div></div>;
        case 'header': return <div className="py-4 px-6 flex items-center justify-between" style={{ backgroundColor: block.backgroundColor, flexDirection: block.alignment === 'center' ? 'column' : block.alignment === 'right' ? 'row-reverse' : 'row', gap: '1rem' }}>{block.logoSrc ? <img src={block.logoSrc} alt="Logo" className="h-8 object-contain" /> : <div className="h-8 px-3 bg-gray-200 rounded flex items-center text-xs font-bold text-gray-500">LOGO</div>}<div className="flex gap-4 text-sm font-medium text-gray-600">{block.navLinks.map((l, i) => <span key={i} className="cursor-pointer hover:text-blue-600">{l.text}</span>)}</div></div>;
        case 'footer': return <div className="py-8 px-6 text-center space-y-4" style={{ backgroundColor: block.backgroundColor }}><div className="flex justify-center gap-4">{block.socialLinks.map((s, i) => <div key={i} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-blue-100 hover:text-blue-600 cursor-pointer">{s.name[0]}</div>)}</div><div className="text-sm text-gray-500" dangerouslySetInnerHTML={{ __html: block.content }} /><div className="text-xs text-gray-400">{block.address}</div><div className="text-xs text-gray-400 mt-4"><a href="#" className="underline hover:text-gray-600">Unsubscribe</a></div></div>;
        case 'product': return <div className="py-4 px-4"><div className="bg-white border boundary-gray-200 rounded-xl overflow-hidden flex flex-col items-center text-center p-4 hover:shadow-lg transition-shadow" style={{ backgroundColor: block.backgroundColor }}>{block.productImage ? <img src={block.productImage} alt={block.title} className="w-full h-48 object-cover rounded-lg mb-4" /> : <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400"><ShoppingBag size={32} /></div>}<h3 className="font-bold text-lg text-gray-800 mb-1">{block.title}</h3><div className="text-blue-600 font-bold mb-2">{block.price}</div><p className="text-sm text-gray-500 mb-4 line-clamp-2">{block.description}</p><a href={block.url} className="px-6 py-2 rounded-lg font-medium text-white transition-colors hover:opacity-90" style={{ backgroundColor: block.buttonColor }} onClick={(e) => e.preventDefault()}>{block.buttonText}</a></div></div>;
        case 'unsubscribe': return <div className="py-3 px-4"><p className="text-xs text-gray-500" style={{ textAlign: block.alignment }} dangerouslySetInnerHTML={{ __html: block.text }} /></div>;

        // E-commerce
        case 'product-grid': return (
            <div className="py-4 px-4"><div style={{ backgroundColor: block.backgroundColor }} className="p-4 rounded-lg pointer-events-none border border-gray-100"><div className="grid grid-cols-2 gap-4">{block.products.map((p, i) => (<div key={i} className="border border-gray-200 rounded-lg overflow-hidden bg-white"><div className="aspect-[4/3] bg-gray-100 relative">{p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">No Image</div>}</div><div className="p-3"><div className="font-semibold text-sm text-gray-800 mb-1 line-clamp-1">{p.title}</div><div className="text-blue-600 font-bold text-sm">{p.price}</div></div></div>))}</div></div></div>
        );
        case 'coupon': return (
            <div className="py-4 px-8"><div style={{ backgroundColor: block.backgroundColor, borderColor: block.borderColor }} className="p-8 rounded-xl border-2 border-dashed text-center relative overflow-hidden"><div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-r border-gray-200" /><div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-l border-gray-200" /><div className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wider">{block.discount}</div><div className="text-3xl font-bold text-gray-800 mb-2 font-mono tracking-widest">{block.code}</div><div className="text-xs text-gray-600 max-w-[200px] mx-auto">{block.description}</div></div></div>
        );
        case 'cart-reminder': return (
            <div className="py-4 px-4"><div className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm"><div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100"><div className="text-sm font-semibold text-gray-800 flex items-center gap-2"><ShoppingCart size={16} /> Your Cart ({block.itemsCount})</div><div className="text-sm font-bold text-blue-600">Total: {block.totalPrice}</div></div><div className="flex gap-3 mb-5">{block.itemImages.map((img, i) => (<div key={i} className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden shrink-0">{img ? <img src={img} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-300"><ShoppingBag size={16} /></div>}</div>))}{block.itemsCount > 2 && <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium shrink-0">+{block.itemsCount - 2}</div>}</div><div className="w-full py-2.5 bg-blue-600 text-white text-center text-sm font-bold rounded-lg shadow-sm hover:bg-blue-700">Checkout Now</div></div></div>
        );
        case 'order-summary': return (
            <div className="py-4 px-4"><div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"><div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center"><span className="text-xs font-semibold text-gray-600">Order {block.orderId}</span><span className="text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-bold border border-green-200">CONFIRMED</span></div><div className="p-5 space-y-3">{block.items.map((item, i) => (<div key={i} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0"><span className="text-gray-600"><span className="text-gray-400 mr-2">{item.qty}x</span>{item.name}</span><span className="font-medium text-gray-800">{item.price}</span></div>))}<div className="pt-3 border-t border-gray-100 flex justify-between font-bold text-gray-800 text-base"><span>Total</span><span>{block.total}</span></div></div><div className="p-4 bg-blue-50/50 text-xs text-gray-500 border-t border-gray-200 flex items-start gap-2"><MapPin size={14} className="mt-0.5 text-blue-400" /> Ship to: {block.shippingAddress}</div></div></div>
        );

        // Real Estate
        case 'property-card': return (
            <div className="py-4 px-4"><div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group"><div className="aspect-video bg-gray-200 relative overflow-hidden">{block.image ? <img src={block.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-100"><Home size={32} /></div>}<div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-900 text-xs font-bold px-2 py-1 rounded shadow-sm">FOR SALE</div></div><div className="p-5"><div className="flex justify-between items-start mb-2"><div><div className="font-bold text-gray-800 text-xl mb-1">{block.price}</div><div className="text-sm text-gray-600 font-medium">{block.title}</div></div></div><div className="flex gap-4 text-xs text-gray-500 mb-4 pb-4 border-b border-gray-100"><span className="flex items-center gap-1.5"><LayoutGrid size={14} /> {block.specs.beds} Beds</span><span className="flex items-center gap-1.5"><LayoutGrid size={14} /> {block.specs.baths} Baths</span><span className="flex items-center gap-1.5"><Square size={14} /> {block.specs.area}</span></div><div className="flex items-center gap-2 text-xs text-gray-500"><MapPin size={14} className="text-gray-400" /> {block.address}</div></div></div></div>
        );
        case 'features': return (
            <div className="py-4 px-4"><div className={`grid ${block.columns === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>{block.features.map((f, i) => (<div key={i} className="flex flex-col items-center text-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors"><div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2"><Check size={18} /></div><span className="text-xs font-semibold text-gray-700">{f.text}</span></div>))}</div></div>
        );
        case 'location': return (
            <div className="py-4 px-4"><div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"><div className="aspect-[21/9] bg-blue-50 relative">{block.mapImage ? <img src={block.mapImage} className="w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-blue-300 bg-blue-50"><MapPin size={32} /></div>}</div><div className="p-4 flex items-start gap-3 bg-white"><div className="p-2 bg-red-50 text-red-500 rounded-lg shrink-0"><MapPin size={20} /></div><div><div className="text-sm font-bold text-gray-800 mb-1">Our Location</div><div className="text-xs text-gray-500 leading-relaxed">{block.address}</div></div></div></div></div>
        );

        // Recruitment
        case 'job-listing': return (
            <div className="py-3 px-4"><div className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 transition-all shadow-sm hover:shadow-md cursor-pointer group"><div className="flex justify-between items-start mb-2"><div><h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{block.title}</h4><div className="text-xs text-blue-600 font-bold uppercase tracking-wide mb-3">{block.department}</div></div><div className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200">{block.salary}</div></div><div className="flex flex-wrap gap-2 mb-4">{block.tags.map(t => <span key={t} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-semibold">{t}</span>)}</div><div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-3"><MapPin size={14} /> {block.location}</div></div></div>
        );
        case 'benefits': return (
            <div className="py-4 px-4"><div className="grid gap-3">{block.benefits.map((b, i) => (<div key={i} className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"><div className="p-2 bg-green-100 text-green-600 rounded-lg shrink-0"><Gift size={20} /></div><div><div className="text-sm font-bold text-gray-800 mb-0.5">{b.title}</div><div className="text-xs text-gray-500 leading-snug">{b.description}</div></div></div>))}</div></div>
        );

        default: return <div className="p-4 bg-red-50 text-red-500">Unknown</div>;
    }
};

const SortableBlock: React.FC<{ block: EmailBlock; index: number; total: number; isSelected: boolean; onSelect: () => void; onSelectId?: (id: string) => void; onDelete: () => void; onUpdate: (b: EmailBlock) => void; onMoveUp: () => void; onMoveDown: () => void; onDuplicate: () => void; isDragOver: boolean }> = ({ block, index, total, isSelected, onSelect, onSelectId, onDelete, onUpdate, onMoveUp, onMoveDown, onDuplicate, isDragOver }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });



    const handleSelect = (id?: string) => {
        if (id && onSelectId) {
            onSelectId(id);
        } else {
            onSelect();
        }
    };

    return (
        <>
            <DropIndicator show={isDragOver && index === 0} />
            <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.2 : 1 }} className={`relative group ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 rounded-lg' : ''}`} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
                {isSelected && <FloatingToolbar onMoveUp={onMoveUp} onMoveDown={onMoveDown} onDuplicate={onDuplicate} onDelete={onDelete} dragListeners={listeners} dragAttributes={attributes} canMoveUp={index > 0} canMoveDown={index < total - 1} />}
                <div className={`rounded-lg transition-colors ${isSelected ? 'bg-gray-50' : 'bg-white'}`}>
                    <BlockRenderer block={block} isSelected={isSelected} onSelect={handleSelect} onUpdate={onUpdate} />
                </div>
            </div>
            <DropIndicator show={isDragOver && index > 0} />
        </>
    );
};

// =============================================
// GENERAL SETTINGS PANEL
// =============================================
const GeneralSettingsPanel: React.FC<{ settings: EmailDocument['settings']; onUpdate: (s: EmailDocument['settings']) => void }> = ({ settings, onUpdate }) => {
    const [padding, setPadding] = useState({ top: 40, right: 20, bottom: 40, left: 20 });
    const [margin, setMargin] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
    const [spacing, setSpacing] = useState(16);
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Settings size={16} className="text-gray-400" />
                <span className="font-semibold text-gray-800 text-sm">Cài đặt chung</span>
            </div>
            {/* Email Width */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Email Width</label>
                <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                        <input type="number" value={settings.contentWidth} onChange={(e) => onUpdate({ ...settings, contentWidth: +e.target.value })} className="w-full p-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">px</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {[600, 700].map((w) => <button key={w} onClick={() => onUpdate({ ...settings, contentWidth: w })} className={`flex-1 py-2 rounded-lg text-xs font-medium border ${settings.contentWidth === w ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{w}</button>)}
                </div>
            </div>
            {/* Alignment */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Alignment</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['left', 'center', 'right'] as const).map((a) => <button key={a} onClick={() => setAlignment(a)} className={`flex-1 py-2 rounded-lg flex items-center justify-center ${alignment === a ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>{a === 'left' && <AlignLeft size={16} />}{a === 'center' && <AlignCenter size={16} />}{a === 'right' && <AlignRight size={16} />}</button>)}
                </div>
            </div>
            {/* Spacing */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Spacing</label>
                <div className="flex gap-2">
                    {[0, 8, 16, 24].map((s) => <button key={s} onClick={() => setSpacing(s)} className={`flex-1 py-2 rounded-lg text-xs font-medium border ${spacing === s ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>)}
                </div>
            </div>
            {/* Background Color */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Background</label>
                <div className="flex items-center gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-300 relative shrink-0"><input type="color" value={settings.backgroundColor} onChange={(e) => onUpdate({ ...settings, backgroundColor: e.target.value })} className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" /></div>
                    <input type="text" value={settings.backgroundColor} onChange={(e) => onUpdate({ ...settings, backgroundColor: e.target.value })} className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700" />
                </div>
            </div>
            {/* Padding */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Padding</label>
                <div className="relative bg-green-50 rounded-xl p-4">
                    <div className="flex justify-center mb-1"><input type="number" value={padding.top} onChange={(e) => setPadding({ ...padding, top: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                    <div className="flex items-center justify-between"><input type="number" value={padding.left} onChange={(e) => setPadding({ ...padding, left: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /><div className="w-16 h-10 bg-white/80 rounded-lg border border-dashed border-gray-300 flex items-center justify-center"><span className="text-[10px] text-gray-400">Content</span></div><input type="number" value={padding.right} onChange={(e) => setPadding({ ...padding, right: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                    <div className="flex justify-center mt-1"><input type="number" value={padding.bottom} onChange={(e) => setPadding({ ...padding, bottom: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                </div>
            </div>
            {/* Margin */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700">Margin</label>
                <div className="relative bg-orange-50 rounded-xl p-4">
                    <div className="flex justify-center mb-1"><input type="number" value={margin.top} onChange={(e) => setMargin({ ...margin, top: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                    <div className="flex items-center justify-between"><input type="number" value={margin.left} onChange={(e) => setMargin({ ...margin, left: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /><div className="w-16 h-10 bg-white/80 rounded-lg border border-dashed border-gray-300 flex items-center justify-center"><span className="text-[10px] text-gray-400">Content</span></div><input type="number" value={margin.right} onChange={(e) => setMargin({ ...margin, right: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                    <div className="flex justify-center mt-1"><input type="number" value={margin.bottom} onChange={(e) => setMargin({ ...margin, bottom: +e.target.value })} className="w-12 h-7 text-center text-xs border border-gray-300 rounded-md bg-white" /></div>
                </div>
            </div>
        </div>
    );
};

// =============================================
// RIGHT SIDEBAR
// =============================================
type RightTabType = 'settings' | 'element';

const PropertiesPanel: React.FC<{ block: EmailBlock | null; onUpdate: (b: EmailBlock) => void; onInsertTag: (t: string) => void; docSettings: EmailDocument['settings']; onUpdateSettings: (s: EmailDocument['settings']) => void }> = ({ block, onUpdate, onInsertTag, docSettings, onUpdateSettings }) => {
    const [tab, setTab] = useState<RightTabType>('element');
    const [blockStyle, setBlockStyle] = useState<StyleState>({ borderWidth: 0, borderStyle: 'solid', borderColor: '#e5e7eb', borderRadius: 8, boxShadow: 'none', hideDesktop: false, hideMobile: false, hideTablet: false });

    const AlignBtns = ({ val, onChange }: { val: string; onChange: (v: 'left' | 'center' | 'right') => void }) => (
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">{(['left', 'center', 'right'] as const).map((a) => <button key={a} onClick={() => onChange(a)} className={`p-2 rounded-md ${val === a ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{a === 'left' ? <AlignLeft size={16} /> : a === 'center' ? <AlignCenter size={16} /> : <AlignRight size={16} />}</button>)}</div>
    );

    const renderElementContent = () => {
        if (!block) return <div className="flex-1 flex items-center justify-center text-gray-400"><div className="text-center"><MousePointerClick size={32} className="mx-auto mb-3 opacity-50" /><p className="text-sm">Chọn một block</p></div></div>;
        switch (block.type) {
            case 'heading': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Nội dung</label><input type="text" value={block.content} onChange={(e) => onUpdate({ ...block, content: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Cấp độ</label><div className="flex gap-2">{(['h1', 'h2', 'h3'] as const).map((l) => <button key={l} onClick={() => onUpdate({ ...block, level: l })} className={`flex-1 p-2 rounded-lg border text-sm ${block.level === l ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>{l.toUpperCase()}</button>)}</div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Căn chỉnh</label><AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Màu</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-8 h-8 rounded-lg overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.color} onChange={(e) => onUpdate({ ...block, color: e.target.value })} /></div><span className="text-xs font-mono">{block.color}</span></div></div></div>);
            case 'text': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Nội dung</label><textarea value={block.content} onChange={(e) => onUpdate({ ...block, content: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-28 resize-none" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Merge Tags</label><div className="flex flex-wrap gap-1.5">{MERGE_TAGS.map((t) => <button key={t.value} onClick={() => onInsertTag(t.value)} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">{t.label}</button>)}</div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Căn chỉnh</label><AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} /></div></div>);
            case 'button': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Label</label><input type="text" value={block.label} onChange={(e) => onUpdate({ ...block, label: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">URL</label><input type="text" value={block.url} onChange={(e) => onUpdate({ ...block, url: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div className="grid grid-cols-2 gap-2"><div><label className="text-xs font-medium text-gray-500 mb-1 block">Nền</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-6 h-6 rounded-md overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.backgroundColor} onChange={(e) => onUpdate({ ...block, backgroundColor: e.target.value })} /></div></div></div><div><label className="text-xs font-medium text-gray-500 mb-1 block">Chữ</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-6 h-6 rounded-md overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.textColor} onChange={(e) => onUpdate({ ...block, textColor: e.target.value })} /></div></div></div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Bo góc: {block.borderRadius}px</label><input type="range" min="0" max="24" value={block.borderRadius} onChange={(e) => onUpdate({ ...block, borderRadius: +e.target.value })} className="w-full accent-blue-600" /></div></div>);
            case 'spacer': return <div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Chiều cao: {block.height}px</label><input type="range" min="8" max="120" value={block.height} onChange={(e) => onUpdate({ ...block, height: +e.target.value })} className="w-full accent-blue-600" /></div>;
            case 'divider': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Kiểu</label><div className="flex gap-2">{(['solid', 'dashed', 'dotted'] as const).map((s) => <button key={s} onClick={() => onUpdate({ ...block, style: s })} className={`flex-1 p-2 rounded-lg border text-xs ${block.style === s ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>{s}</button>)}</div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Màu</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-8 h-8 rounded-lg overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.color} onChange={(e) => onUpdate({ ...block, color: e.target.value })} /></div></div></div></div>);
            case 'image': const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => onUpdate({ ...block, src: ev.target?.result as string }); r.readAsDataURL(f); }; return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Hình ảnh</label><div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 relative"><input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" /><Upload size={20} className="mx-auto text-gray-400 mb-2" /><span className="text-xs text-gray-500">Upload</span></div></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Alt</label><input type="text" value={block.alt} onChange={(e) => onUpdate({ ...block, alt: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Kích thước</label><div className="flex gap-2">{(['small', 'medium', 'full'] as const).map((w) => <button key={w} onClick={() => onUpdate({ ...block, width: w })} className={`flex-1 p-2 rounded-lg border text-xs ${block.width === w ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>{w}</button>)}</div></div></div>);
            case 'link': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Text</label><input type="text" value={block.text} onChange={(e) => onUpdate({ ...block, text: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">URL</label><input type="text" value={block.url} onChange={(e) => onUpdate({ ...block, url: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Căn chỉnh</label><AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Màu</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><div className="w-8 h-8 rounded-lg overflow-hidden relative border"><input type="color" className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer" value={block.color} onChange={(e) => onUpdate({ ...block, color: e.target.value })} /></div><span className="text-xs font-mono">{block.color}</span></div></div></div>);
            case 'row2': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Rows size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">2 Rows</span></div><p className="text-xs text-gray-500">Kéo thả elements vào các ô trên canvas để thêm nội dung.</p><div className="text-xs text-gray-400 mt-2">Row 1: {block.children[0].length} elements</div><div className="text-xs text-gray-400">Row 2: {block.children[1].length} elements</div></div>);
            case 'row3': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Rows size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">3 Rows</span></div><p className="text-xs text-gray-500">Kéo thả elements vào các ô trên canvas để thêm nội dung.</p><div className="text-xs text-gray-400 mt-2">Row 1: {block.children[0].length} elements</div><div className="text-xs text-gray-400">Row 2: {block.children[1].length} elements</div><div className="text-xs text-gray-400">Row 3: {block.children[2].length} elements</div></div>);
            case 'column2': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Columns size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">2 Columns</span></div><p className="text-xs text-gray-500">Kéo thả elements vào các ô trên canvas để thêm nội dung.</p><div className="text-xs text-gray-400 mt-2">Column 1: {block.children[0].length} elements</div><div className="text-xs text-gray-400">Column 2: {block.children[1].length} elements</div></div>);
            case 'column3': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Columns size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">3 Columns</span></div><p className="text-xs text-gray-500">Kéo thả elements vào các ô trên canvas để thêm nội dung.</p><div className="text-xs text-gray-400 mt-2">Column 1: {block.children[0].length} elements</div><div className="text-xs text-gray-400">Column 2: {block.children[1].length} elements</div><div className="text-xs text-gray-400">Column 3: {block.children[2].length} elements</div></div>);
            case 'html': return (<div className="space-y-4"><div className="flex items-center gap-2 pb-2 border-b border-gray-100"><Code size={16} className="text-gray-400" /><span className="font-semibold text-gray-800 text-sm">Custom HTML</span></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">HTML Code</label><textarea value={block.content} onChange={(e) => onUpdate({ ...block, content: e.target.value })} className="w-full p-2.5 bg-gray-900 text-green-400 border border-gray-700 rounded-xl text-sm font-mono h-40 resize-none" placeholder="<div>Your HTML here...</div>" /></div><p className="text-xs text-gray-400">⚠️ Chú ý: HTML tùy chỉnh có thể ảnh hưởng đến hiển thị email.</p></div>);
            case 'video': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Video URL</label><input type="text" value={block.url} onChange={(e) => onUpdate({ ...block, url: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="https://youtube.com/..." /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Thumbnail URL</label><input type="text" value={block.thumbnail || ''} onChange={(e) => onUpdate({ ...block, thumbnail: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="https://..." /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Căn chỉnh</label><AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} /></div></div>);
            case 'header': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Logo URL</label><input type="text" value={block.logoSrc} onChange={(e) => onUpdate({ ...block, logoSrc: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div className="p-3 bg-gray-50 rounded-xl border border-gray-200"><div className="text-xs font-semibold text-gray-700 mb-2">Nav Links</div>{block.navLinks.map((l, i) => (<div key={i} className="flex gap-2 mb-2"><input type="text" value={l.text} onChange={(e) => { const n = [...block.navLinks]; n[i].text = e.target.value; onUpdate({ ...block, navLinks: n }); }} className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Text" /><input type="text" value={l.url} onChange={(e) => { const n = [...block.navLinks]; n[i].url = e.target.value; onUpdate({ ...block, navLinks: n }); }} className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="URL" /></div>))}</div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Nền</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><input type="color" className="w-8 h-8 rounded cursor-pointer" value={block.backgroundColor} onChange={(e) => onUpdate({ ...block, backgroundColor: e.target.value })} /></div></div></div>);
            case 'footer': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Nội dung</label><textarea value={block.content} onChange={(e) => onUpdate({ ...block, content: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-24" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Địa chỉ</label><input type="text" value={block.address} onChange={(e) => onUpdate({ ...block, address: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Nền</label><div className="flex items-center gap-2 p-2 border border-gray-200 rounded-xl"><input type="color" className="w-8 h-8 rounded cursor-pointer" value={block.backgroundColor} onChange={(e) => onUpdate({ ...block, backgroundColor: e.target.value })} /></div></div></div>);
            case 'product': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Tên sản phẩm</label><input type="text" value={block.title} onChange={(e) => onUpdate({ ...block, title: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Giá</label><input type="text" value={block.price} onChange={(e) => onUpdate({ ...block, price: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Mô tả</label><textarea value={block.description} onChange={(e) => onUpdate({ ...block, description: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-20" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Ảnh URL</label><input type="text" value={block.productImage} onChange={(e) => onUpdate({ ...block, productImage: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Button Text</label><input type="text" value={block.buttonText} onChange={(e) => onUpdate({ ...block, buttonText: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div></div>);
            case 'unsubscribe': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Text (HTML allowed)</label><textarea value={block.text} onChange={(e) => onUpdate({ ...block, text: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm h-24" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Căn chỉnh</label><AlignBtns val={block.alignment} onChange={(v) => onUpdate({ ...block, alignment: v })} /></div></div>);

            // E-commerce Properties
            case 'product-grid': return (<div className="space-y-4">{block.products.map((p, i) => (<div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200"><div className="text-xs font-bold text-gray-700 mb-2">Product {i + 1}</div><div className="space-y-2"><input type="text" value={p.title} onChange={(e) => { const np = [...block.products]; np[i].title = e.target.value; onUpdate({ ...block, products: np }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Title" /><input type="text" value={p.price} onChange={(e) => { const np = [...block.products]; np[i].price = e.target.value; onUpdate({ ...block, products: np }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Price" /><input type="text" value={p.image} onChange={(e) => { const np = [...block.products]; np[i].image = e.target.value; onUpdate({ ...block, products: np }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Image URL" /></div></div>))}</div>);
            case 'coupon': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Code</label><input type="text" value={block.code} onChange={(e) => onUpdate({ ...block, code: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Discount</label><input type="text" value={block.discount} onChange={(e) => onUpdate({ ...block, discount: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label><input type="text" value={block.description} onChange={(e) => onUpdate({ ...block, description: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div></div>);
            case 'cart-reminder': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Total Price</label><input type="text" value={block.totalPrice} onChange={(e) => onUpdate({ ...block, totalPrice: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Checkout URL</label><input type="text" value={block.checkoutUrl} onChange={(e) => onUpdate({ ...block, checkoutUrl: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div></div>);
            case 'order-summary': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Order ID</label><input type="text" value={block.orderId} onChange={(e) => onUpdate({ ...block, orderId: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Total</label><input type="text" value={block.total} onChange={(e) => onUpdate({ ...block, total: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div></div>);

            // Real Estate Properties
            case 'property-card': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Title</label><input type="text" value={block.title} onChange={(e) => onUpdate({ ...block, title: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Price</label><input type="text" value={block.price} onChange={(e) => onUpdate({ ...block, price: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Address</label><input type="text" value={block.address} onChange={(e) => onUpdate({ ...block, address: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Image URL</label><input type="text" value={block.image} onChange={(e) => onUpdate({ ...block, image: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div></div>);
            case 'features': return (<div className="space-y-4">{block.features.map((f, i) => (<div key={i} className="flex gap-2"><input type="text" value={f.text} onChange={(e) => { const nf = [...block.features]; nf[i].text = e.target.value; onUpdate({ ...block, features: nf }); }} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" /><button onClick={() => { const nf = [...block.features]; nf.splice(i, 1); onUpdate({ ...block, features: nf }); }} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={16} /></button></div>))}<button onClick={() => onUpdate({ ...block, features: [...block.features, { icon: 'check', text: 'New Feature' }] })} className="w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">+ Add Feature</button></div>);
            case 'location': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Address</label><input type="text" value={block.address} onChange={(e) => onUpdate({ ...block, address: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Map Image URL</label><input type="text" value={block.mapImage} onChange={(e) => onUpdate({ ...block, mapImage: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div></div>);

            // Recruitment Properties
            case 'job-listing': return (<div className="space-y-4"><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Job Title</label><input type="text" value={block.title} onChange={(e) => onUpdate({ ...block, title: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Department</label><input type="text" value={block.department} onChange={(e) => onUpdate({ ...block, department: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Location</label><input type="text" value={block.location} onChange={(e) => onUpdate({ ...block, location: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div><div><label className="text-xs font-medium text-gray-500 mb-1.5 block">Salary</label><input type="text" value={block.salary} onChange={(e) => onUpdate({ ...block, salary: e.target.value })} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" /></div></div>);
            case 'benefits': return (<div className="space-y-4">{block.benefits.map((b, i) => (<div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-200"><input type="text" value={b.title} onChange={(e) => { const nb = [...block.benefits]; nb[i].title = e.target.value; onUpdate({ ...block, benefits: nb }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-bold mb-2" placeholder="Title" /><textarea value={b.description} onChange={(e) => { const nb = [...block.benefits]; nb[i].description = e.target.value; onUpdate({ ...block, benefits: nb }); }} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" placeholder="Description" /></div>))}</div>);
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex border-b border-gray-200 mb-4">
                <button onClick={() => setTab('element')} className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 ${tab === 'element' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}><Layers size={14} />Element</button>
                <button onClick={() => setTab('settings')} className={`flex-1 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 ${tab === 'settings' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}><Settings size={14} />Cài đặt</button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {tab === 'settings' && <GeneralSettingsPanel settings={docSettings} onUpdate={onUpdateSettings} />}
                {tab === 'element' && (
                    <div className="space-y-6">
                        {/* Element Properties */}
                        {renderElementContent()}
                        {/* Divider */}
                        {block && <hr className="border-gray-200 my-4" />}
                        {/* Border & Shadow */}
                        {block && <BorderShadowSettings style={blockStyle} onChange={setBlockStyle} />}
                        {/* Divider */}
                        {block && <hr className="border-gray-200 my-4" />}
                        {/* Visibility */}
                        {block && <VisibilitySettings style={blockStyle} onChange={setBlockStyle} />}
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================
// TOP CONTROL BAR
// =============================================
const TopControlBar: React.FC<{
    device: 'desktop' | 'mobile';
    onDeviceChange: (d: 'desktop' | 'mobile') => void;
    onSave: () => void;
    onImport: () => void;
    onPreview: () => void;
}> = ({ device, onDeviceChange, onSave, onImport, onPreview }) => {
    return (
        <div className="h-12 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0 mb-0">
            {/* Device Toggle */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => onDeviceChange('desktop')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${device === 'desktop' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Monitor size={14} /> Desktop
                </button>
                <button
                    onClick={() => onDeviceChange('mobile')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${device === 'mobile' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Smartphone size={14} /> Mobile
                </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-bold transition-colors shadow-sm"
                >
                    <Save size={14} /> Lưu
                </button>
                <div className="h-5 w-px bg-gray-200" />
                <button
                    onClick={onImport}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-800 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
                >
                    <Upload size={14} /> Nhập
                </button>
                <button
                    onClick={onPreview}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm"
                >
                    <Eye size={14} /> Xem trước
                </button>
            </div>
        </div>
    );
};

// =============================================
// IMPORT MODAL
// =============================================
const ImportJsonModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (json: string) => void;
}> = ({ isOpen, onClose, onImport }) => {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setJsonText('');
            setError(null);
        }
    }, [isOpen]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setJsonText(ev.target?.result as string);
            setError(null);
        };
        reader.readAsText(file);
    };

    const handleConfirm = () => {
        if (!jsonText.trim()) {
            setError('Vui lòng nhập nội dung JSON');
            return;
        }
        onImport(jsonText);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Nhập Thiết Kế (JSON)</h3>
                            <p className="text-xs text-gray-500">Dán mã JSON hoặc tải file lên bên dưới</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nội dung JSON</label>
                        <div className="relative">
                            <textarea
                                value={jsonText}
                                onChange={(e) => { setJsonText(e.target.value); setError(null); }}
                                className="w-full h-64 p-4 font-mono text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none transition-all"
                                placeholder={`Paste your JSON here, e.g.:\n{\n  "version": "1.0",\n  "elements": [...],\n  "globalSettings": {...}\n}`}
                            />
                            {error && (
                                <div className="absolute bottom-4 right-4 bg-red-50 text-red-600 text-xs py-1 px-3 rounded-full font-medium border border-red-100 animate-pulse">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-2xl">
                    <div>
                        <input
                            type="file"
                            accept=".json"
                            id="import-json-file"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                        <label
                            htmlFor="import-json-file"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer shadow-sm"
                        >
                            <Upload size={16} /> Tải file lên
                        </label>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2"
                        >
                            <Check size={16} /> Import Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================
// SUBCOMPONENTS: MODALS
// =============================================
const SendTestModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSend: (email: string, subject: string) => Promise<void>;
    defaultSubject: string;
}> = ({ isOpen, onClose, onSend, defaultSubject }) => {
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState(defaultSubject);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen) setSubject(defaultSubject);
    }, [isOpen, defaultSubject]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!email) return;
        setIsSending(true);
        await onSend(email, subject);
        setIsSending(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden ring-1 ring-gray-900/5 animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center shrink-0">
                            <Send size={24} className="text-purple-600 -ml-1 mt-1" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Gửi Email Test</h3>
                            <p className="text-sm text-gray-500">Kiểm tra template trên email thật</p>
                        </div>
                        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 p-1">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email nhận *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 bg-blue-50/50 border border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none font-medium"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tiêu đề Email</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 bg-blue-50/50 border border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none font-medium"
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!email || isSending}
                            className={`w-full mt-4 py-3 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 transition-all ${!email || isSending ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-purple-500/30'}`}
                        >
                            {isSending ? (
                                <>Đang gửi...</>
                            ) : (
                                <><Send size={18} /> Gửi Test Ngay</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// =============================================
// PREVIEW MODAL
// =============================================
const PreviewModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    htmlContent: string;
    jsonContent: string;
    emailTitle: string;
    onSendTest: (email: string, subject: string) => Promise<void>;
}> = ({ isOpen, onClose, htmlContent, jsonContent, emailTitle, onSendTest }) => {
    const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'json'>('preview');
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
    const [showSendModal, setShowSendModal] = useState(false);

    const formatHtml = (html: string) => {
        let formatted = '';
        let pad = 0;
        html.split(/>\s*</).forEach(node => {
            if (node.match(/^\/\w/)) pad -= 1;
            formatted += new Array(pad * 4 + 1).join(' ') + '<' + node + '>\r\n';
            if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith("input") && !node.startsWith("img") && !node.startsWith("br") && !node.startsWith("hr")) pad += 1;
        });
        return formatted.substring(1, formatted.length - 3);
    };

    const handleDownload = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-[90vw] h-[85vh] shadow-2xl flex flex-col overflow-hidden ring-1 ring-gray-900/5">
                {/* Header */}
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1">
                            <button
                                onClick={() => setDevice('desktop')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${device === 'desktop' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Monitor size={16} /> Desktop
                            </button>
                            <button
                                onClick={() => setDevice('mobile')}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${device === 'mobile' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Smartphone size={16} /> Mobile
                            </button>
                        </div>
                    </div>


                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowSendModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                        >
                            <Send size={16} /> Gửi Test
                        </button>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <SendTestModal
                    isOpen={showSendModal}
                    onClose={() => setShowSendModal(false)}
                    defaultSubject={emailTitle}
                    onSend={onSendTest}
                />

                {/* Tabs */}
                <div className="h-12 border-b border-gray-200 flex items-center bg-white px-6 gap-6 shrink-0">
                    <button
                        onClick={() => setActiveTab('preview')}
                        className={`h-full flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'preview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Eye size={16} /> Preview
                    </button>
                    <button
                        onClick={() => setActiveTab('html')}
                        className={`h-full flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'html' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <Code size={16} /> HTML Code
                    </button>
                    <button
                        onClick={() => setActiveTab('json')}
                        className={`h-full flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'json' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        <FileJson size={16} /> JSON Data
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col relative">
                    {activeTab === 'preview' && (
                        <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                            <div className={`transition-all duration-300 flex flex-col shadow-2xl rounded-xl overflow-hidden bg-white border border-gray-200 ${device === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'}`}>
                                {/* Browser Bar */}
                                <div className="bg-gray-900 px-4 py-3 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-3">
                                        {device === 'mobile' ? <Smartphone size={16} className="text-gray-400" /> : <Monitor size={16} className="text-gray-400" />}
                                        <span className="text-xs font-medium text-gray-300">
                                            {device === 'mobile' ? 'Mobile Preview' : 'Desktop Preview'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                    </div>
                                </div>

                                {/* Iframe */}
                                <div className="flex-1 bg-white min-h-[500px]">
                                    <iframe srcDoc={htmlContent} className="w-full h-full border-none block" title="Preview" />
                                </div>

                                {/* Footer Info */}
                                <div className="bg-gray-800 px-4 py-2 flex items-center justify-center gap-4 text-[10px] text-gray-400">
                                    <span className="flex items-center gap-1.5"><Monitor size={10} /> {device === 'mobile' ? '375px' : '900px'} viewport</span>
                                    <span className="flex items-center gap-1.5"><Mail size={10} /> Email Preview</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'html' && (
                        <div className="flex-1 overflow-hidden flex">
                            <div className="flex-1 relative group">
                                <textarea
                                    readOnly
                                    value={formatHtml(htmlContent)}
                                    className="w-full h-full p-6 font-mono text-sm bg-white text-gray-800 border border-gray-200 resize-none outline-none"
                                />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(formatHtml(htmlContent)); }}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 border border-gray-200"
                                    >
                                        <Copy size={14} /> Copy
                                    </button>
                                    <button
                                        onClick={() => handleDownload(formatHtml(htmlContent), 'email-template.html', 'text/html')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <Download size={14} /> Tải về
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'json' && (
                        <div className="flex-1 overflow-hidden flex">
                            <div className="flex-1 relative group">
                                <textarea
                                    readOnly
                                    value={jsonContent}
                                    className="w-full h-full p-6 font-mono text-sm bg-white text-gray-800 border border-gray-200 resize-none outline-none"
                                />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(jsonContent); }}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 border border-gray-200"
                                    >
                                        <Copy size={14} /> Copy
                                    </button>
                                    <button
                                        onClick={() => handleDownload(jsonContent, 'email-data.json', 'application/json')}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                                    >
                                        <Download size={14} /> Tải về
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================================
// MAIN COMPONENT
// =============================================
const VisualEmailBuilder: React.FC = () => {
    const [doc, setDoc] = useState<EmailDocument>(DEFAULT_DOC);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);
    const [emailTitle, setEmailTitle] = useState('Email mới');
    const [leftTab, setLeftTab] = useState<LeftTabType>('elements');
    const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [hasCustomerList] = useState(true);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [emailHistory, setEmailHistory] = useState<EmailHistoryRecord[]>([]);
    const [previewHistoryItem, setPreviewHistoryItem] = useState<EmailHistoryRecord | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDestructive?: boolean }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    React.useEffect(() => { setEmailHistory(StorageService.getEmailHistory()); }, []);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const showToast = (msg: string, type: ToastType = 'info') => setToast({ message: msg, type });
    const closeConfirm = () => setConfirmDialog((p) => ({ ...p, isOpen: false }));
    const selectedBlock = useMemo(() => {
        if (!selectedId) return null;
        return findBlockById(doc.blocks, selectedId);
    }, [doc.blocks, selectedId]);

    const updateBlock = useCallback((upd: EmailBlock) => {
        setDoc((p) => ({ ...p, blocks: updateBlockInList(p.blocks, upd) }));
    }, []);
    const deleteBlock = useCallback((id: string) => { setDoc((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) })); if (selectedId === id) setSelectedId(null); }, [selectedId]);
    const updateSettings = useCallback((s: EmailDocument['settings']) => setDoc((p) => ({ ...p, settings: s })), []);
    const moveBlock = useCallback((id: string, dir: 'up' | 'down') => { setDoc((p) => { const i = p.blocks.findIndex((b) => b.id === id); if (i < 0) return p; const ni = dir === 'up' ? i - 1 : i + 1; if (ni < 0 || ni >= p.blocks.length) return p; return { ...p, blocks: arrayMove(p.blocks, i, ni) }; }); }, []);
    const duplicateBlock = useCallback((id: string) => { setDoc((p) => { const i = p.blocks.findIndex((b) => b.id === id); if (i < 0) return p; const c = { ...p.blocks[i], id: generateId() }; const nb = [...p.blocks]; nb.splice(i + 1, 0, c); return { ...p, blocks: nb }; }); showToast('Đã nhân đôi', 'success'); }, []);
    const handleInsertTag = (tag: string) => { if (selectedBlock && selectedBlock.type === 'text') updateBlock({ ...selectedBlock, content: selectedBlock.content + tag }); };
    const handleTemplateSelect = () => { setConfirmDialog({ isOpen: true, title: 'Áp dụng template?', message: 'Nội dung hiện tại sẽ bị thay thế.', onConfirm: () => { setDoc(DEFAULT_DOC); closeConfirm(); showToast('Đã áp dụng', 'success'); } }); };

    const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);
    const handleDragOver = (e: any) => setDragOverId(e.over?.id || null);
    const handleDragEnd = (e: DragEndEvent) => {
        setActiveId(null); setDragOverId(null);
        const { active, over } = e; if (!over) return;
        const data = active.data.current;
        const overId = over.id as string;

        // Check if dropping into a layout cell (format: blockId-cell-index)
        if (overId.includes('-cell-')) {
            const [parentBlockId, cellIndexStr] = overId.split('-cell-');
            const cellIndex = parseInt(cellIndexStr);
            // Use recursive findBlockById instead of flat Doc.blocks.find
            const parentBlock = findBlockById(doc.blocks, parentBlockId);

            if (parentBlock && (parentBlock.type === 'row2' || parentBlock.type === 'row3' || parentBlock.type === 'column2' || parentBlock.type === 'column3')) {
                // Case 1: Drop NEW element from sidebar
                if (data?.isNew) {
                    const newChild = createDefaultBlock(data.type as EmailBlockType, data.level);
                    setDoc(p => ({
                        ...p,
                        blocks: insertBlockIntoParent(p.blocks, parentBlockId, cellIndex, newChild)
                    }));
                    showToast('Đã thêm element vào ô', 'success');
                    return;
                }

                // Case 2: Drop EXISTING element from main canvas
                const existingBlockIndex = doc.blocks.findIndex(b => b.id === active.id);
                if (existingBlockIndex >= 0) {
                    const blockToMove = doc.blocks[existingBlockIndex];
                    if (['row2', 'row3', 'column2', 'column3'].includes(blockToMove.type)) {
                        showToast('Không thể lồng ghép các block bố cục', 'error');
                        return;
                    }

                    setDoc(p => {
                        const newBlocks = [...p.blocks];
                        newBlocks.splice(existingBlockIndex, 1);
                        return {
                            ...p,
                            blocks: newBlocks.map(b => {
                                if (b.id === parentBlockId) {
                                    const newChildren = [...(b as any).children];
                                    newChildren[cellIndex] = [...newChildren[cellIndex], blockToMove];
                                    return { ...b, children: newChildren };
                                }
                                return b;
                            })
                        };
                    });
                    showToast('Đã di chuyển element vào ô', 'success');
                    return;
                }
            }
        }

        if (data?.isNew) { const nb = createDefaultBlock(data.type as EmailBlockType, data.level); const oi = doc.blocks.findIndex((b) => b.id === over.id); setDoc((p) => { const nb2 = [...p.blocks]; if (oi >= 0) nb2.splice(oi, 0, nb); else nb2.push(nb); return { ...p, blocks: nb2 }; }); setSelectedId(nb.id); return; }
        if (data?.isTag && selectedBlock?.type === 'text') { updateBlock({ ...selectedBlock, content: selectedBlock.content + data.tag }); showToast('Đã thêm tag', 'success'); return; }

        if (active.id !== over.id) {
            setDoc((p) => {
                const oi = p.blocks.findIndex((b) => b.id === active.id);
                const ni = p.blocks.findIndex((b) => b.id === over.id);
                if (oi >= 0 && ni >= 0) return { ...p, blocks: arrayMove(p.blocks, oi, ni) };
                return p;
            });
        }
    };

    const generateHTML = (): string => {
        const { settings, blocks } = doc;
        const toHtml = (b: EmailBlock): string => {
            switch (b.type) {
                case 'heading': return `<${b.level} style="margin:0 0 16px;font-size:${b.level === 'h1' ? '28px' : '20px'};font-weight:bold;text-align:${b.alignment};color:${b.color};">${b.content}</${b.level}>`;
                case 'text': return `<div style="margin:0 0 16px;text-align:${b.alignment};color:#4b5563;">${b.content}</div>`;
                case 'image': return `<div style="text-align:${b.alignment};margin:16px 0;"><img src="${b.src}" alt="${b.alt}" style="max-width:100%;border-radius:8px;" /></div>`;
                case 'button': return `<div style="text-align:${b.alignment};margin:24px 0;"><a href="${b.url}" style="display:inline-block;background:${b.backgroundColor};color:${b.textColor};padding:12px 32px;border-radius:${b.borderRadius}px;text-decoration:none;font-weight:bold;">${b.label}</a></div>`;
                case 'spacer': return `<div style="height:${b.height}px;"></div>`;
                case 'divider': return `<hr style="border:none;border-top:1px ${b.style} ${b.color};margin:24px 0;" />`;
                case 'social': return `<div style="text-align:${b.alignment};margin:24px 0;">${b.platforms.map((p) => `<span style="margin:0 8px;">${p.name}</span>`).join('')}</div>`;
                case 'link': return `<div style="text-align:${b.alignment};margin:16px 0;"><a href="${b.url}" style="color:${b.color};text-decoration:underline;">${b.text}</a></div>`;
                case 'row2': return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${b.children.map(cells => `<tr><td style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">${cells.map(c => toHtml(c)).join('')}</td></tr>`).join('')}</table>`;
                case 'row3': return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${b.children.map(cells => `<tr><td style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">${cells.map(c => toHtml(c)).join('')}</td></tr>`).join('')}</table>`;
                case 'column2': return `<table width="100%" cellpadding="0" cellspacing="8" style="margin:16px 0;"><tr>${b.children.map(cells => `<td width="50%" style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;vertical-align:top;">${cells.map(c => toHtml(c)).join('')}</td>`).join('')}</tr></table>`;
                case 'column3': return `<table width="100%" cellpadding="0" cellspacing="8" style="margin:16px 0;"><tr>${b.children.map(cells => `<td width="33%" style="padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;vertical-align:top;">${cells.map(c => toHtml(c)).join('')}</td>`).join('')}</tr></table>`;
                case 'html': return b.content;
                case 'video': return `<div style="text-align:${b.alignment};margin:16px 0;"><a href="${b.url}" target="_blank"><div style="position:relative;display:inline-block;"><img src="${b.thumbnail || 'https://placehold.co/600x337/333/FFF?text=PLAY+VIDEO'}" alt="${b.alt}" style="max-width:100%;border-radius:8px;" /><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:48px;height:48px;background:rgba(255,255,255,0.9);border-radius:50%;display:flex;align-items:center;justify-content:center;">▶</div></div></a></div>`;
                case 'header': return `<div style="background:${b.backgroundColor};padding:16px;display:flex;align-items:center;justify-content:space-between;flex-direction:${b.alignment === 'center' ? 'column' : b.alignment === 'right' ? 'row-reverse' : 'row'};"><div><img src="${b.logoSrc}" alt="Logo" style="height:32px;" /></div><div style="margin-top:${b.alignment === 'center' ? '12px' : '0'};">${b.navLinks.map(l => `<a href="${l.url}" style="margin:0 8px;color:#4b5563;text-decoration:none;">${l.text}</a>`).join('')}</div></div>`;
                case 'footer': return `<div style="background:${b.backgroundColor};padding:32px 16px;text-align:center;"><div style="margin-bottom:16px;">${b.socialLinks.map(s => `<span style="margin:0 8px;">${s.name}</span>`).join('')}</div><div style="color:#6b7280;font-size:14px;margin-bottom:8px;">${b.content}</div><div style="color:#9ca3af;font-size:12px;">${b.address}</div></div>`;
                case 'product': return `<div style="background:${b.backgroundColor};border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center;"><img src="${b.productImage}" alt="${b.title}" style="width:100%;height:auto;border-radius:4px;margin-bottom:16px;" /><h3 style="margin:0 0 8px;font-size:18px;color:#1f2937;">${b.title}</h3><div style="color:#2563eb;font-weight:bold;margin-bottom:8px;">${b.price}</div><p style="color:#6b7280;font-size:14px;margin-bottom:16px;">${b.description}</p><a href="${b.url}" style="display:inline-block;background:${b.buttonColor};color:#fff;padding:8px 24px;border-radius:4px;text-decoration:none;">${b.buttonText}</a></div>`;
                case 'unsubscribe': return `<div style="text-align:${b.alignment};font-size:12px;color:#9ca3af;padding:16px;">${b.text}</div>`;

                // E-commerce
                case 'product-grid': return `<div style="background:${b.backgroundColor};padding:16px;border-radius:8px;"><table width="100%" cellpadding="0" cellspacing="8"><tr>${b.products.map(p => `<td width="50%" style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;vertical-align:top;"><img src="${p.image}" style="width:100%;height:auto;display:block;"/><div style="padding:12px;"><div style="font-weight:bold;font-size:14px;margin-bottom:4px;">${p.title}</div><div style="color:#2563eb;font-weight:bold;">${p.price}</div></div></td>`).join('')}</tr></table></div>`;
                case 'coupon': return `<div style="background:${b.backgroundColor};border:2px dashed ${b.borderColor};border-radius:12px;padding:32px;text-align:center;margin:16px 0;"><div style="font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">${b.discount}</div><div style="font-size:32px;font-weight:bold;color:#1f2937;letter-spacing:2px;margin-bottom:8px;font-family:monospace;">${b.code}</div><div style="font-size:12px;color:#4b5563;">${b.description}</div></div>`;
                case 'cart-reminder': return `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:16px 0;"><div style="border-bottom:1px solid #f3f4f6;padding-bottom:16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;"><strong>Your Cart (${b.itemsCount})</strong><span style="color:#2563eb;font-weight:bold;">Total: ${b.totalPrice}</span></div><div style="margin-bottom:20px;display:flex;gap:12px;">${b.itemImages.map(img => `<img src="${img}" style="width:64px;height:64px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;"/>`).join('')}</div><a href="${b.checkoutUrl}" style="display:block;background:#2563eb;color:#fff;text-align:center;padding:12px;border-radius:8px;text-decoration:none;font-weight:bold;">Checkout Now</a></div>`;
                case 'order-summary': return `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin:16px 0;"><div style="background:#f9fafb;padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:bold;color:#4b5563;display:flex;justify-content:space-between;"><span>Order ${b.orderId}</span><span style="color:#047857;">CONFIRMED</span></div><div style="padding:20px;">${b.items.map(item => `<div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:12px;border-bottom:1px dashed #f3f4f6;padding-bottom:12px;"><span style="color:#4b5563;">${item.qty}x ${item.name}</span><span style="font-weight:500;">${item.price}</span></div>`).join('')}<div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px;margin-top:16px;"><span>Total</span><span>${b.total}</span></div></div><div style="background:#f9fafb;padding:12px 16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Ship to: ${b.shippingAddress}</div></div>`;

                // Real Estate
                case 'property-card': return `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin:16px 0;"><div style="position:relative;"><img src="${b.image}" style="width:100%;height:auto;display:block;" /><div style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.9);padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;">FOR SALE</div></div><div style="padding:20px;"><div style="font-size:20px;font-weight:bold;color:#1f2937;margin-bottom:4px;">${b.price}</div><div style="color:#4b5563;font-size:14px;margin-bottom:16px;">${b.title}</div><div style="display:flex;gap:16px;font-size:12px;color:#6b7280;padding-bottom:16px;border-bottom:1px solid #f3f4f6;margin-bottom:16px;"><span>${b.specs.beds} Beds</span><span>${b.specs.baths} Baths</span><span>${b.specs.area}</span></div><div style="font-size:12px;color:#9ca3af;">${b.address}</div><a href="${b.url}" style="display:block;margin-top:16px;text-align:center;color:#2563eb;text-decoration:none;font-weight:500;">View Details</a></div></div>`;
                case 'features': return `<table width="100%" cellpadding="0" cellspacing="8" style="margin:16px 0;"><tr>${b.features.map(f => `<td width="${b.columns === 3 ? '33%' : '50%'}" style="text-align:center;padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;"><div style="display:inline-block;padding:8px;background:#eff6ff;border-radius:50%;color:#2563eb;margin-bottom:8px;">✓</div><div style="font-size:12px;font-weight:600;color:#374151;">${f.text}</div></td>`).join('')}</tr></table>`;
                case 'location': return `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin:16px 0;"><img src="${b.mapImage}" style="width:100%;height:auto;display:block;" /><div style="padding:16px;display:flex;gap:12px;"><div style="font-size:14px;font-weight:bold;color:#1f2937;">Our Location</div><div style="font-size:12px;color:#6b7280;">${b.address}</div></div></div>`;

                // Recruitment
                case 'job-listing': return `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:16px 0;"><div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;"><div><h4 style="margin:0 0 4px;font-size:18px;color:#1f2937;">${b.title}</h4><div style="color:#2563eb;font-size:12px;font-weight:bold;text-transform:uppercase;">${b.department}</div></div><div style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:12px;font-weight:bold;color:#374151;">${b.salary}</div></div><div style="margin-bottom:16px;">${b.tags.map(t => `<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:10px;padding:2px 6px;border-radius:4px;margin-right:4px;">${t}</span>`).join('')}</div><div style="border-top:1px solid #f3f4f6;padding-top:12px;font-size:12px;color:#9ca3af;">${b.location}</div></div>`;
                case 'benefits': return `<div style="margin:16px 0;">${b.benefits.map(benefit => `<div style="display:flex;gap:16px;padding:16px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin-bottom:12px;"><div style="font-weight:bold;color:#1f2937;">${benefit.title}</div><div style="font-size:12px;color:#6b7280;">${benefit.description}</div></div>`).join('')}</div>`;

                default: return '';
            }
        };
        return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${emailTitle}</title></head><body style="margin:0;padding:0;font-family:${settings.fontFamily};background:${settings.backgroundColor};"><div style="max-width:${settings.contentWidth}px;margin:0 auto;padding:40px 20px;"><div style="background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 6px rgba(0,0,0,0.05);">${blocks.map(toHtml).join('\n')}</div></div></body></html>`;
    };

    const handleExport = () => { const html = generateHTML(); StorageService.addEmailHistory({ id: Date.now().toString(), timestamp: Date.now(), title: emailTitle, html }); setEmailHistory(StorageService.getEmailHistory()); const blob = new Blob([html], { type: 'text/html' }); const a = window.document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `email-${Date.now()}.html`; a.click(); showToast('Xuất thành công!', 'success'); };
    const handleCreateNew = () => { setConfirmDialog({ isOpen: true, title: 'Tạo mới?', message: 'Thay đổi chưa lưu sẽ mất.', onConfirm: () => { setDoc(DEFAULT_DOC); setEmailTitle('Email mới'); setSelectedId(null); closeConfirm(); showToast('Đã tạo mới', 'success'); } }); };
    const handleDeleteHistory = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setConfirmDialog({ isOpen: true, title: 'Xóa?', message: 'Chắc chắn?', isDestructive: true, onConfirm: () => { StorageService.deleteEmailHistory(id); setEmailHistory((p) => p.filter((h) => h.id !== id)); if (previewHistoryItem?.id === id) setPreviewHistoryItem(null); closeConfirm(); showToast('Đã xóa', 'success'); } }); };

    const handleSaveDesign = () => {
        const json = JSON.stringify(doc);
        const blob = new Blob([json], { type: 'application/json' });
        const a = window.document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `design-${Date.now()}.json`;
        a.click();
        showToast('Đã lưu thiết kế (JSON)', 'success');
    };

    const handleImportDesign = () => {
        setShowImportModal(true);
    };

    const executeImport = (jsonContent: string) => {
        try {
            const parsed = JSON.parse(jsonContent);
            if (parsed.blocks && parsed.settings) {
                setDoc(parsed);
                showToast('Đã nhập thiết kế thành công', 'success');
                setShowImportModal(false);
            } else {
                showToast('Format JSON không hợp lệ (thiếu blocks hoặc settings)', 'error');
            }
        } catch (err) {
            showToast('Lỗi parse JSON', 'error');
        }
    };

    const handlePreview = () => {
        setShowPreviewModal(true);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3"><div className="bg-pink-100 p-2 rounded-lg text-pink-600"><Mail size={18} /></div><h2 className="text-lg font-bold text-gray-800">Visual Email</h2><span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-semibold">Pro</span></div>
                <div className="flex gap-2"><button onClick={handleCreateNew} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-50"><Plus size={16} />Tạo mới</button><button onClick={() => setShowHistoryModal(true)} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 hover:bg-gray-50"><History size={16} />Lịch sử</button><button onClick={handleExport} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-sm"><Download size={16} />Xuất</button></div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                <div className="flex-1 flex overflow-hidden">
                    <LeftSidebar activeTab={leftTab} onTabChange={setLeftTab} onTemplateSelect={handleTemplateSelect} hasCustomerList={hasCustomerList} />
                    <div className="flex-1 flex flex-col min-w-0 bg-gray-100">
                        <TopControlBar device={viewMode} onDeviceChange={setViewMode} onSave={handleSaveDesign} onImport={handleImportDesign} onPreview={handlePreview} />
                        <div className="flex-1 overflow-y-auto p-6 flex justify-center" onClick={() => setSelectedId(null)}>
                            <div className={`transition-all duration-300 ${viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-[700px]'}`}>
                                <div className="mb-3 sticky top-0 z-10 bg-gray-100/95 backdrop-blur-sm pt-2 pb-2"><input type="text" value={emailTitle} onChange={(e) => setEmailTitle(e.target.value)} className="w-full text-center text-base font-bold text-gray-700 bg-transparent border-none outline-none focus:bg-white focus:rounded-lg focus:px-4 py-1" placeholder="Tiêu đề..." /></div>
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 min-h-[500px]" style={{ backgroundColor: doc.settings.backgroundColor }}>
                                    <div className="bg-white rounded-xl p-5 shadow-sm" style={{ maxWidth: viewMode === 'mobile' ? '100%' : `${doc.settings.contentWidth}px`, margin: '0 auto' }}>
                                        <SortableContext items={doc.blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                                            {doc.blocks.length === 0 ? <div className="text-center py-12 text-gray-400"><Type size={36} className="mx-auto mb-3 opacity-50" /><p className="font-medium">Kéo thả vào đây</p></div> : <div className="space-y-2">{doc.blocks.map((b, i) => <SortableBlock key={b.id} block={b} index={i} total={doc.blocks.length} isSelected={selectedId === b.id} onSelect={() => setSelectedId(b.id)} onSelectId={setSelectedId} onDelete={() => deleteBlock(b.id)} onUpdate={updateBlock} onMoveUp={() => moveBlock(b.id, 'up')} onMoveDown={() => moveBlock(b.id, 'down')} onDuplicate={() => duplicateBlock(b.id)} isDragOver={dragOverId === b.id} />)}</div>}
                                        </SortableContext>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-72 bg-white border-l border-gray-200 p-5 flex flex-col overflow-y-auto"><PropertiesPanel block={selectedBlock} onUpdate={updateBlock} onInsertTag={handleInsertTag} docSettings={doc.settings} onUpdateSettings={updateSettings} /></div>
                </div>
                <DragOverlay
                    dropAnimation={{
                        sideEffects: defaultDropAnimationSideEffects({
                            styles: {
                                active: {
                                    opacity: '0.4',
                                },
                            },
                        }),
                    }}
                >
                    {activeId && (
                        activeId.startsWith('element-') ? (() => {
                            const allElements = [...ELEMENT_TYPES, ...LAYOUT_ELEMENTS, ...MEDIA_ELEMENTS, ...CUSTOM_ELEMENTS, ...ECOMMERCE_ELEMENTS, ...REAL_ESTATE_ELEMENTS, ...RECRUITMENT_ELEMENTS];
                            const el = allElements.find((e) => `element-${e.type}-${e.label}` === activeId);

                            if (!el) return null;
                            return (
                                <div className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-blue-500 rounded-2xl shadow-2xl scale-105 cursor-grabbing opacity-90">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        {(el as any).iconText ? <span className="text-sm font-bold">{(el as any).iconText}</span> : el.icon}
                                    </div>
                                    <span className="text-xs font-bold text-gray-700">{el.label}</span>
                                </div>
                            );
                        })() : (() => {
                            const block = findBlockById(doc.blocks, activeId);
                            if (!block) return null;
                            return (
                                <div className="bg-white rounded-lg shadow-2xl ring-2 ring-blue-500 opacity-90 scale-105 cursor-grabbing overflow-hidden pointer-events-none" style={{ width: doc.settings.contentWidth }}>
                                    <div className="p-4">
                                        <BlockRenderer block={block} onUpdate={() => { }} />
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </DragOverlay>
            </DndContext>

            {showHistoryModal && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`bg-white rounded-2xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] ${previewHistoryItem ? 'max-w-4xl' : 'max-w-lg'}`}>
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl"><h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><History size={18} />{previewHistoryItem ? 'Xem trước' : 'Lịch sử'}</h3><button onClick={() => previewHistoryItem ? setPreviewHistoryItem(null) : setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-700 bg-white p-1 rounded-full shadow-sm"><X size={18} /></button></div>
                        <div className="flex flex-1 overflow-hidden">{!previewHistoryItem ? <div className="p-5 overflow-y-auto w-full space-y-2">{emailHistory.length === 0 ? <div className="text-center py-10 text-gray-400">Chưa có.</div> : emailHistory.map((h) => <div key={h.id} onClick={() => setPreviewHistoryItem(h)} className="p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-gray-50 bg-white cursor-pointer flex justify-between items-center"><div><div className="font-medium text-gray-800 text-sm">{h.title}</div><div className="text-[11px] text-gray-400">{new Date(h.timestamp).toLocaleString('vi-VN')}</div></div><div className="flex items-center gap-1"><button onClick={(e) => handleDeleteHistory(e, h.id)} className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg"><Trash2 size={16} /></button><div className="text-blue-400 bg-blue-50 p-1.5 rounded-lg"><Eye size={16} /></div></div></div>)}</div> : <div className="flex-1 bg-gray-200 p-6 flex justify-center overflow-hidden"><div className="w-full max-w-[650px] h-full bg-white shadow-xl rounded-xl overflow-hidden"><iframe srcDoc={previewHistoryItem.html} className="w-full h-full border-none" /></div></div>}</div>
                    </div>
                </div>
            )}

            <ImportJsonModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImport={executeImport} />

            <PreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                htmlContent={generateHTML()}
                jsonContent={JSON.stringify(doc, null, 2)}
                emailTitle={emailTitle}
                onSendTest={async (email, subject) => {
                    showToast(`Đang gửi test tới ${email}...`, 'info');
                    try {
                        await EmailService.sendTestEmail(email, generateHTML(), subject);
                        showToast('Đã gửi thành công! Kiểm tra hộp thư.', 'success');
                    } catch (error) {
                        showToast('Gửi thất bại. Kiểm tra console.', 'error');
                        console.error(error);
                    }
                }}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} isDestructive={confirmDialog.isDestructive} onConfirm={confirmDialog.onConfirm} onCancel={closeConfirm} />
        </div>
    );
};

export default VisualEmailBuilder;