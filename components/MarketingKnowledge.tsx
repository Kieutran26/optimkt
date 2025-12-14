import React, { useState, useEffect, useMemo } from 'react';
import { KnowledgeService, Knowledge } from '../services/knowledgeService';
import { BookOpen, Search, Plus, X, Edit2, Trash2, Save, Eye, BookMarked, Sparkles } from 'lucide-react';

// Soft category colors
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
    'Khách Hàng': { bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-400' },
    'Phễu & Leads': { bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-400' },
    'Chiến Lược': { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400' },
    'Đo Lường': { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-400' },
    'Chi Phí': { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
    'Chuyển Đổi': { bg: 'bg-cyan-50', text: 'text-cyan-600', dot: 'bg-cyan-400' },
    'Giá Trị': { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-400' },
    'Thị Trường': { bg: 'bg-teal-50', text: 'text-teal-600', dot: 'bg-teal-400' },
    'Công Cụ': { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-400' },
    'Kênh': { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-400' },
    'Định Giá': { bg: 'bg-pink-50', text: 'text-pink-600', dot: 'bg-pink-400' },
    'Ngân Sách': { bg: 'bg-lime-50', text: 'text-lime-600', dot: 'bg-lime-500' },
};

const getColor = (cat: string) => CATEGORY_COLORS[cat] || { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' };

// Initial data
const INITIAL_KNOWLEDGE: Omit<Knowledge, 'id'>[] = [
    { term: 'Relationship Marketing', definition: 'Chiến lược tập trung vào việc xây dựng mối quan hệ lâu dài, cá nhân hóa với khách hàng.\n\n**Ví dụ:** Shopee gửi voucher sinh nhật, Amazon đề xuất sản phẩm dựa trên lịch sử mua hàng.', category: 'Khách Hàng' },
    { term: 'ICP (Ideal Customer Profile)', definition: 'Mô tả loại khách hàng mang lại giá trị cao nhất cho công ty.\n\n**Ví dụ:** "Doanh nghiệp SME doanh thu 5-50 tỷ/năm, đang muốn rebrand".', category: 'Khách Hàng' },
    { term: 'Customer Segmentation', definition: 'Quá trình chia cơ sở khách hàng thành các nhóm dựa trên đặc điểm chung.\n\n**Ví dụ:** Chia theo độ tuổi, hành vi mua, giá trị đơn hàng.', category: 'Khách Hàng' },
    { term: 'Customer Advocacy', definition: 'Mức độ khách hàng chủ động giới thiệu thương hiệu cho người khác.\n\n**Ví dụ:** Khách hàng Apple thường xuyên giới thiệu sản phẩm cho bạn bè.', category: 'Khách Hàng' },
    { term: 'Customer Loyalty', definition: 'Mức độ khách hàng tiếp tục mua hàng từ một thương hiệu.\n\n**Ví dụ:** Chương trình Starbucks Rewards.', category: 'Khách Hàng' },
    { term: 'Pain Points', definition: 'Những vấn đề, thách thức cụ thể mà khách hàng đang gặp phải.\n\n**Ví dụ:** "Tôi mất quá nhiều thời gian để tạo content".', category: 'Khách Hàng' },
    { term: 'Customer Churn', definition: 'Khách hàng ngừng sử dụng sản phẩm/dịch vụ.\n\n**Ví dụ:** Spotify mất 5% subscriber/tháng = Churn Rate 5%.', category: 'Khách Hàng' },
    { term: 'Customer Journey Map', definition: 'Sơ đồ mô tả các bước khách hàng trải qua khi tương tác với thương hiệu.\n\n**Ví dụ:** Awareness → Interest → Consideration → Purchase → Loyalty.', category: 'Khách Hàng' },
    { term: 'Buyer Persona', definition: 'Hồ sơ đại diện cho kiểu khách hàng lý tưởng.\n\n**Ví dụ:** "Lan, 28 tuổi, thu nhập 15-20 triệu, quan tâm skincare".', category: 'Khách Hàng' },
    { term: 'Ambassador', definition: 'Khách hàng hoặc người ảnh hưởng hợp tác quảng bá sản phẩm một cách tự nhiên.\n\n**Ví dụ:** Brand Ambassador của Nike, Adidas.', category: 'Khách Hàng' },
    { term: 'Touchpoint', definition: 'Điểm khách hàng tương tác với thương hiệu.\n\n**Ví dụ:** Quảng cáo, website, email, nhân viên tư vấn.', category: 'Khách Hàng' },
    { term: 'VOC (Voice of Customer)', definition: 'Chương trình thu thập và phân tích phản hồi của khách hàng.\n\n**Ví dụ:** Survey NPS, phỏng vấn khách hàng, phân tích review.', category: 'Khách Hàng' },
    { term: 'Customer Delight', definition: 'Cung cấp trải nghiệm vượt xa mong đợi khách hàng.\n\n**Ví dụ:** Zappos gửi hoa tặng khách hàng, upgrade miễn phí giao hàng.', category: 'Khách Hàng' },
    { term: 'Customer Success', definition: 'Đảm bảo khách hàng đạt được mục tiêu khi sử dụng sản phẩm/dịch vụ.\n\n**Ví dụ:** Đội CS của SaaS giúp onboard và training khách hàng.', category: 'Khách Hàng' },
    { term: 'UX (User Experience)', definition: 'Cách người dùng tương tác và cảm nhận về sản phẩm.\n\n**Ví dụ:** UI/UX tốt giúp giữ chân người dùng trên app/website.', category: 'Khách Hàng' },
    { term: 'Marketing Funnel', definition: 'Mô hình mô tả hành trình khách hàng từ biết đến mua hàng.\n\n**Giai đoạn:** Awareness → Consideration → Conversion → Loyalty → Advocacy.', category: 'Phễu & Leads' },
    { term: 'Sales Funnel', definition: 'Các bước hành động dẫn đến giao dịch, do đội sales quản lý.\n\n**Ví dụ:** Cold call → Đánh giá nhu cầu → Demo → Báo giá → Chốt.', category: 'Phễu & Leads' },
    { term: 'AIDA Model', definition: '**A**ttention - **I**nterest - **D**esire - **A**ction\n\nMô hình mô tả các bước nhận thức của khách hàng.', category: 'Phễu & Leads' },
    { term: 'Leads', definition: 'Cá nhân/tổ chức đã thể hiện sự quan tâm đến sản phẩm.\n\n**Ví dụ:** Người điền form, để lại email, inbox fanpage.', category: 'Phễu & Leads' },
    { term: 'MQL', definition: 'Marketing Qualified Lead - Lead được Marketing đánh giá có tiềm năng cao.\n\n**Ví dụ:** Người tải 3 ebook, xem 5 video demo, quay lại 10 lần/tuần.', category: 'Phễu & Leads' },
    { term: 'SQL', definition: 'Sales Qualified Lead - MQL sẵn sàng nhận cuộc gọi bán hàng.\n\n**Ví dụ:** Người yêu cầu báo giá, hỏi cụ thể về gói dịch vụ.', category: 'Phễu & Leads' },
    { term: 'Lead Generation', definition: 'Quá trình thu hút và chuyển đổi người lạ thành leads.\n\n**Ví dụ:** Chạy ads, SEO, content marketing, webinar.', category: 'Phễu & Leads' },
    { term: 'SWOT Analysis', definition: '**S**trengths - **W**eaknesses - **O**pportunities - **T**hreats\n\nCông cụ đánh giá yếu tố nội bộ và bên ngoài.', category: 'Chiến Lược' },
    { term: 'SMART Goals', definition: '**S**pecific - **M**easurable - **A**chievable - **R**elevant - **T**ime-bound\n\nKhuôn khổ thiết lập mục tiêu hiệu quả.', category: 'Chiến Lược' },
    { term: 'STP', definition: '**S**egmentation - **T**argeting - **P**ositioning\n\nBa bước quan trọng trong hoạch định chiến lược marketing.', category: 'Chiến Lược' },
    { term: 'USP', definition: 'Unique Selling Proposition - Lý do độc đáo mà khách hàng nên mua sản phẩm của bạn.\n\n**Ví dụ:** Domino\'s "Pizza nóng trong 30 phút hoặc miễn phí".', category: 'Chiến Lược' },
    { term: 'Brand Positioning', definition: 'Tạo hình ảnh độc đáo trong tâm trí khách hàng.\n\n**Ví dụ:** Volvo = An toàn, Apple = Sáng tạo.', category: 'Chiến Lược' },
    { term: 'Blue Ocean Strategy', definition: 'Chiến lược tạo không gian thị trường mới không có cạnh tranh.\n\n**Ngược lại:** Red Ocean = thị trường bão hòa, cạnh tranh khốc liệt.', category: 'Chiến Lược' },
    { term: 'Competitive Advantage', definition: 'Yếu tố cho phép công ty hoạt động hiệu quả hơn đối thủ.\n\n**Ví dụ:** Chi phí thấp, sản phẩm khác biệt, dịch vụ vượt trội.', category: 'Chiến Lược' },
    { term: 'PESTEL Analysis', definition: '**P**olitical - **E**conomic - **S**ociocultural - **T**echnological - **E**nvironmental - **L**egal\n\nPhân tích yếu tố vĩ mô.', category: 'Chiến Lược' },
    { term: 'Organic Reach', definition: 'Số người thấy nội dung mà không trả tiền quảng cáo.\n\n**Ví dụ:** Đăng bài, 5.000 người thấy mà không chạy ads.', category: 'Đo Lường' },
    { term: 'Paid Reach', definition: 'Số người thấy nội dung thông qua quảng cáo trả tiền.\n\n**Ví dụ:** Chi $100 FB Ads, tiếp cận 20.000 người.', category: 'Đo Lường' },
    { term: 'Impressions', definition: 'Số lần nội dung được hiển thị.\n\n**Lưu ý:** Một người có thể thấy nhiều lần, nên Impressions ≥ Reach.', category: 'Đo Lường' },
    { term: 'Frequency', definition: 'Số lần trung bình một người thấy quảng cáo.\n\n**Lưu ý:** Frequency > 7 có thể gây khó chịu.', category: 'Đo Lường' },
    { term: 'CPM', definition: 'Cost Per Mille - Chi phí cho mỗi 1.000 lượt hiển thị.\n\n**Ví dụ:** CPM = $5 nghĩa là trả $5/1.000 Impressions.', category: 'Chi Phí' },
    { term: 'CPC', definition: 'Cost Per Click - Chi phí cho mỗi click.\n\n**Công thức:** CPC = Tổng chi phí / Số click', category: 'Chi Phí' },
    { term: 'CPA', definition: 'Cost Per Acquisition - Chi phí để có khách hàng mới.\n\n**Ví dụ:** Chi $1.000, có 50 đơn → CPA = $20/đơn.', category: 'Chi Phí' },
    { term: 'CPL', definition: 'Cost Per Lead - Chi phí cho mỗi lead thu được.\n\n**Công thức:** CPL = Tổng chi phí / Số leads', category: 'Chi Phí' },
    { term: 'ROI', definition: 'Return on Investment - Tỷ suất hoàn vốn.\n\n**Công thức:** ROI = (Lợi nhuận - Chi phí) / Chi phí × 100%', category: 'Chi Phí' },
    { term: 'ROMI', definition: 'Return on Marketing Investment.\n\n**Công thức:** ROMI = (Doanh thu tăng - Chi phí MKT) / Chi phí MKT', category: 'Chi Phí' },
    { term: 'ROAS', definition: 'Return on Ad Spend - Tỷ suất lợi nhuận trên chi tiêu quảng cáo.\n\n**Ví dụ:** Chi $1.000, thu $5.000 → ROAS = 5:1.', category: 'Chi Phí' },
    { term: 'COGS', definition: 'Cost of Goods Sold - Giá vốn hàng bán.\n\nTổng chi phí trực tiếp để tạo ra sản phẩm/dịch vụ.', category: 'Chi Phí' },
    { term: 'Conversion', definition: 'Hành động mong muốn mà người dùng thực hiện.\n\n**Ví dụ:** Mua hàng, đăng ký, tải app, điền form.', category: 'Chuyển Đổi' },
    { term: 'Conversion Rate', definition: 'Tỷ lệ người dùng thực hiện hành động chuyển đổi.\n\n**Công thức:** CR = (Conversions / Visits) × 100%', category: 'Chuyển Đổi' },
    { term: 'CTR', definition: 'Click-Through Rate - Tỷ lệ click so với impressions.\n\n**Công thức:** CTR = (Clicks / Impressions) × 100%', category: 'Chuyển Đổi' },
    { term: 'Engagement Rate', definition: 'Tỷ lệ tương tác trên tổng số người tiếp cận.\n\n**Công thức:** ER = (Like + Comment + Share) / Reach × 100%', category: 'Chuyển Đổi' },
    { term: 'AOV', definition: 'Average Order Value - Giá trị đơn hàng trung bình.\n\n**Công thức:** AOV = Tổng doanh thu / Số đơn hàng', category: 'Giá Trị' },
    { term: 'LTV / CLV', definition: 'Customer Lifetime Value - Tổng giá trị khách hàng mang lại.\n\n**Ví dụ:** Mua 200k/tháng × 24 tháng = LTV 4.8 triệu.', category: 'Giá Trị' },
    { term: 'LTV:CPA Ratio', definition: 'Tỷ lệ LTV so với CPA.\n\n**Lành mạnh:** ≥ 3:1 (LTV gấp 3 lần CPA).', category: 'Giá Trị' },
    { term: 'Retention Rate', definition: 'Tỷ lệ khách hàng tiếp tục sử dụng dịch vụ.\n\n**Ví dụ:** Đầu tháng 1.000, cuối tháng còn 950 → Retention = 95%.', category: 'Giá Trị' },
    { term: 'Churn Rate', definition: 'Tỷ lệ khách hàng ngừng mua/hủy dịch vụ.\n\n**Công thức:** Churn Rate = 100% - Retention Rate', category: 'Giá Trị' },
    { term: 'NPS', definition: 'Net Promoter Score - Chỉ số đo lường lòng trung thành.\n\n**Công thức:** NPS = %Promoters - %Detractors', category: 'Giá Trị' },
    { term: 'Market Share', definition: 'Tỷ lệ doanh số của bạn trong tổng doanh số ngành.\n\n**Ví dụ:** Thị trường 100 tỷ, bạn bán 20 tỷ → 20% market share.', category: 'Thị Trường' },
    { term: 'Market Size', definition: 'Tổng giá trị hoặc số lượng sản phẩm có thể bán trong một thị trường.\n\n**Gồm:** TAM, SAM, SOM.', category: 'Thị Trường' },
    { term: 'Niche Market', definition: 'Phân khúc nhỏ của thị trường lớn, phục vụ nhu cầu rất cụ thể.\n\n**Ví dụ:** Mỹ phẩm hữu cơ cho da nhạy cảm của phụ nữ mang thai.', category: 'Thị Trường' },
    { term: 'Market Penetration', definition: 'Chiến lược tăng doanh số trong thị trường hiện tại.\n\n**Cách làm:** Khuyến mãi, quảng cáo rầm rộ.', category: 'Thị Trường' },
    { term: 'Market Development', definition: 'Chiến lược đưa sản phẩm hiện có vào thị trường mới.\n\n**Ví dụ:** Mở rộng địa lý, phân khúc tuổi mới.', category: 'Thị Trường' },
    { term: 'A/B Testing', definition: 'Thử nghiệm 2 phiên bản để xem bản nào hiệu quả hơn.\n\n**Ví dụ:** 2 quảng cáo khác hình ảnh, so sánh CTR.', category: 'Công Cụ' },
    { term: 'Remarketing', definition: 'Quảng cáo nhắm đến người đã từng tương tác với thương hiệu.\n\n**Ví dụ:** Xem giày Shopee → thấy quảng cáo đôi giày đó trên Facebook.', category: 'Công Cụ' },
    { term: 'Lookalike Audience', definition: 'Tạo nhóm đối tượng có đặc điểm tương tự khách hàng hiện tại.\n\n**Ví dụ:** Upload 1.000 khách VIP, Facebook tìm 1 triệu người tương tự.', category: 'Công Cụ' },
    { term: 'UTM Parameters', definition: 'Đoạn mã thêm vào URL để theo dõi nguồn traffic.\n\n**Cấu trúc:** ?utm_source=&utm_medium=&utm_campaign=', category: 'Công Cụ' },
    { term: 'UGC', definition: 'User-Generated Content - Nội dung do khách hàng tạo ra.\n\n**Ví dụ:** Ảnh check-in, unboxing video, review.', category: 'Công Cụ' },
    { term: 'Gated Content', definition: 'Nội dung có giá trị chỉ truy cập được sau khi cung cấp thông tin.\n\n**Ví dụ:** Ebook, Whitepaper yêu cầu email.', category: 'Công Cụ' },
    { term: 'Cross-sell', definition: 'Khuyến khích mua thêm sản phẩm bổ sung.\n\n**Ví dụ:** Mua laptop → gợi ý mua chuột, balo.', category: 'Công Cụ' },
    { term: 'Landing Page', definition: 'Trang web thiết kế riêng cho một chiến dịch với mục tiêu conversion.\n\n**Ví dụ:** Trang đăng ký webinar, trang flash sale.', category: 'Kênh' },
    { term: 'Inbound Marketing', definition: 'Chiến lược thu hút khách hàng bằng nội dung có giá trị.\n\n**Kênh:** Blog, SEO, Social Media.', category: 'Kênh' },
    { term: 'Outbound Marketing', definition: 'Phương pháp chủ động tìm kiếm khách hàng.\n\n**Kênh:** Quảng cáo, cold call, email hàng loạt.', category: 'Kênh' },
    { term: 'Media Mix', definition: 'Tỷ lệ phân chia ngân sách giữa các kênh truyền thông.\n\n**Kênh:** TV, Digital, Social, OOH.', category: 'Kênh' },
    { term: 'Price Skimming', definition: 'Định giá cao ban đầu, sau đó giảm dần.\n\n**Ví dụ:** iPhone mới 30 triệu → sau 6 tháng còn 25 triệu.', category: 'Định Giá' },
    { term: 'Penetration Pricing', definition: 'Đặt giá thấp để nhanh chóng chiếm thị phần.\n\n**Ví dụ:** Netflix, Spotify giảm 50% cho 3 tháng đầu.', category: 'Định Giá' },
    { term: 'Budget Allocation', definition: 'Phân chia ngân sách marketing cho các kênh/chiến dịch.\n\n**Cân nhắc:** ROI từng kênh, mục tiêu chiến dịch.', category: 'Ngân Sách' },
    { term: 'Break-even Point', definition: 'Mức doanh số mà tổng doanh thu = tổng chi phí.\n\n**Công thức:** BEP = Fixed Cost / (Price - Variable Cost)', category: 'Ngân Sách' },
    { term: 'Marketing Budget', definition: 'Tổng ngân sách dành cho hoạt động marketing.\n\n**Thông thường:** 5-15% doanh thu.', category: 'Ngân Sách' },
];

const MarketingKnowledge: React.FC = () => {
    const [items, setItems] = useState<Knowledge[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Knowledge | null>(null);
    const [newTerm, setNewTerm] = useState('');
    const [newDefinition, setNewDefinition] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTerm, setEditTerm] = useState('');
    const [editDefinition, setEditDefinition] = useState('');
    const [editCategory, setEditCategory] = useState('');

    useEffect(() => { loadKnowledge(); }, []);

    const loadKnowledge = async () => {
        setIsLoading(true);
        const data = await KnowledgeService.getAll();
        if (data.length === 0) {
            await KnowledgeService.bulkInsert(INITIAL_KNOWLEDGE);
            setItems(await KnowledgeService.getAll());
        } else {
            setItems(data);
        }
        setIsLoading(false);
    };

    const filteredItems = useMemo(() => {
        let result = items;
        if (selectedCategory !== 'all') result = result.filter(item => item.category === selectedCategory);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item => item.term.toLowerCase().includes(q) || item.definition.toLowerCase().includes(q));
        }
        return result;
    }, [items, searchQuery, selectedCategory]);

    const categories = useMemo(() => [...new Set(items.map(item => item.category))].sort(), [items]);

    const handleAdd = async () => {
        if (!newTerm.trim() || !newDefinition.trim()) return;
        const newItem = await KnowledgeService.add({ term: newTerm.trim(), definition: newDefinition.trim(), category: newCategory.trim() || 'Chung' });
        if (newItem) { setItems(prev => [...prev, newItem]); setNewTerm(''); setNewDefinition(''); setNewCategory(''); setShowAddForm(false); }
    };

    const startEdit = (item: Knowledge) => { setEditingId(item.id); setEditTerm(item.term); setEditDefinition(item.definition); setEditCategory(item.category); setSelectedItem(null); };

    const handleSaveEdit = async () => {
        if (!editingId || !editTerm.trim() || !editDefinition.trim()) return;
        const updated = await KnowledgeService.update(editingId, { term: editTerm.trim(), definition: editDefinition.trim(), category: editCategory.trim() || 'Chung' });
        if (updated) { setItems(prev => prev.map(item => item.id === editingId ? updated : item)); setEditingId(null); }
    };

    const handleDelete = async (id: string) => { if (await KnowledgeService.delete(id)) { setItems(prev => prev.filter(item => item.id !== id)); setSelectedItem(null); } };

    return (
        <div className="min-h-screen bg-soft-surface">
            {/* Sticky Header + Category Pills */}
            <div className="sticky top-0 z-20 bg-white">
                {/* Compact Header */}
                <div className="border-b border-soft-border px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-xl">
                                <BookMarked size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-800">Kho Kiến Thức Marketing</h1>
                                <p className="text-slate-400 text-xs">{items.length} thuật ngữ • {categories.length} chủ đề</p>
                            </div>
                        </div>
                        <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-medium">
                            <Plus size={14} /> Thêm
                        </button>
                    </div>
                </div>

                {/* Category Pills - Wrap */}
                <div className="border-b border-soft-border px-6 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedCategory === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Tất cả
                        </button>
                        {categories.map(cat => {
                            const color = getColor(cat);
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${selectedCategory === cat
                                        ? `${color.bg} ${color.text}`
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`}></span>
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-8">
                {/* Search Bar */}
                <div className="relative mb-6 max-w-2xl">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm kiếm thuật ngữ marketing..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-soft-border rounded-xl text-sm focus:outline-none focus:border-indigo-400 shadow-soft"
                    />
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="bg-white rounded-2xl border border-soft-border p-6 mb-6 shadow-soft max-w-4xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800">Thêm kiến thức mới</h3>
                            <button onClick={() => setShowAddForm(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input type="text" value={newTerm} onChange={(e) => setNewTerm(e.target.value)} placeholder="Thuật ngữ *" className="px-4 py-3 bg-slate-50 border border-soft-border rounded-xl text-sm" />
                            <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Chủ đề" className="px-4 py-3 bg-slate-50 border border-soft-border rounded-xl text-sm" />
                        </div>
                        <textarea value={newDefinition} onChange={(e) => setNewDefinition(e.target.value)} placeholder="Định nghĩa và ví dụ..." rows={3} className="w-full px-4 py-3 bg-slate-50 border border-soft-border rounded-xl text-sm resize-none mb-4" />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-sm">Hủy</button>
                            <button onClick={handleAdd} disabled={!newTerm.trim() || !newDefinition.trim()} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm disabled:opacity-50">Lưu</button>
                        </div>
                    </div>
                )}

                {/* Edit Form */}
                {editingId && (
                    <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6 shadow-soft max-w-4xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800">Chỉnh sửa</h3>
                            <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg"><X size={18} /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input type="text" value={editTerm} onChange={(e) => setEditTerm(e.target.value)} className="px-4 py-3 bg-white border border-soft-border rounded-xl text-sm" />
                            <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="px-4 py-3 bg-white border border-soft-border rounded-xl text-sm" />
                        </div>
                        <textarea value={editDefinition} onChange={(e) => setEditDefinition(e.target.value)} rows={3} className="w-full px-4 py-3 bg-white border border-soft-border rounded-xl text-sm resize-none mb-4" />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setEditingId(null)} className="px-5 py-2.5 text-slate-600 hover:bg-white rounded-xl text-sm">Hủy</button>
                            <button onClick={handleSaveEdit} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm flex items-center gap-2"><Save size={14} /> Lưu</button>
                        </div>
                    </div>
                )}

                {/* Content Grid */}
                {isLoading ? (
                    <div className="text-center py-16 text-slate-500">
                        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        Đang tải...
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <BookOpen size={40} className="mx-auto mb-3 opacity-50" />
                        <p>Không tìm thấy kiến thức nào</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredItems.map(item => {
                            const color = getColor(item.category);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    className="group bg-white rounded-xl border border-soft-border p-4 cursor-pointer transition-all hover:shadow-md hover:border-indigo-200"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${color.bg} ${color.text}`}>
                                            {item.category}
                                        </span>
                                        <button className="p-1.5 text-slate-300 group-hover:text-indigo-500 transition-colors">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                    <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                                        {item.term}
                                    </h3>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedItem(null)}>
                    <div className="bg-white rounded-2xl max-w-xl w-full max-h-[80vh] overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className={`${getColor(selectedItem.category).bg} px-6 py-5`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getColor(selectedItem.category).text} bg-white/80`}>
                                        {selectedItem.category}
                                    </span>
                                    <h2 className="text-xl font-bold text-slate-800 mt-2">{selectedItem.term}</h2>
                                </div>
                                <button onClick={() => setSelectedItem(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/50 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[50vh]">
                            {selectedItem.definition.split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className="text-slate-600 mb-4 leading-relaxed">
                                    {paragraph.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-slate-800">{part}</strong> : part)}
                                </p>
                            ))}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => startEdit(selectedItem)} className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-sm flex items-center gap-2">
                                <Edit2 size={14} /> Sửa
                            </button>
                            <button onClick={() => handleDelete(selectedItem.id)} className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm flex items-center gap-2">
                                <Trash2 size={14} /> Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketingKnowledge;
