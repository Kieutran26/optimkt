import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { NewsCard, NewsArticle } from './NewsCard';
import { RefreshCw, Filter, Trash2, Calendar, X } from 'lucide-react';

const NewsPage: React.FC = () => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customDate, setCustomDate] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('news_articles')
                .select('*')
                .order('pub_date', { ascending: false })
                .limit(500);

            if (data) {
                setArticles(data);
            }
        } catch (err) {
            console.error('Error fetching news:', err);
        } finally {
            setLoading(false);
        }
    };

    // Delete articles before a specific date
    const deleteArticlesBefore = async (beforeDate: Date) => {
        setDeleting(true);
        try {
            const { error, count } = await supabase
                .from('news_articles')
                .delete({ count: 'exact' })
                .lt('pub_date', beforeDate.toISOString());

            if (error) {
                alert(`Lỗi khi xóa: ${error.message}`);
            } else {
                alert(`Đã xóa ${count || 0} bài viết!`);
                fetchNews(); // Refresh
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    // Delete articles from a specific date range
    const deleteArticlesOnDate = async (date: Date) => {
        setDeleting(true);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        try {
            const { error, count } = await supabase
                .from('news_articles')
                .delete({ count: 'exact' })
                .gte('pub_date', startOfDay.toISOString())
                .lte('pub_date', endOfDay.toISOString());

            if (error) {
                alert(`Lỗi khi xóa: ${error.message}`);
            } else {
                alert(`Đã xóa ${count || 0} bài viết ngày ${date.toLocaleDateString('vi-VN')}!`);
                fetchNews();
            }
        } catch (err) {
            console.error('Delete error:', err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleDeleteYesterday = () => {
        if (!confirm('Bạn có chắc muốn xóa tất cả bài viết của ngày hôm qua?')) return;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        deleteArticlesOnDate(yesterday);
    };

    const handleDeleteLastWeek = () => {
        if (!confirm('Bạn có chắc muốn xóa tất cả bài viết từ tuần trước?')) return;
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        deleteArticlesBefore(oneWeekAgo);
    };

    const handleDeleteCustomDate = () => {
        if (!customDate) {
            alert('Vui lòng chọn ngày!');
            return;
        }
        const selectedDate = new Date(customDate);
        if (!confirm(`Bạn có chắc muốn xóa tất cả bài viết ngày ${selectedDate.toLocaleDateString('vi-VN')}?`)) return;
        deleteArticlesOnDate(selectedDate);
    };

    const handleDeleteAll = async () => {
        if (!confirm('⚠️ BẠN CÓ CHẮC MUỐN XÓA TẤT CẢ BÀI VIẾT? Hành động này không thể hoàn tác!')) return;
        setDeleting(true);
        try {
            const { error } = await supabase
                .from('news_articles')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (error) {
                alert(`Lỗi: ${error.message}`);
            } else {
                alert('Đã xóa tất cả bài viết!');
                fetchNews();
            }
        } catch (err) {
            console.error('Delete all error:', err);
        } finally {
            setDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const categories = ['All', 'Finance', 'Marketing', 'Tech', 'Lifestyle'];
    const filteredArticles = filter === 'All'
        ? articles
        : articles.filter(a => a.category === filter);

    const getCategoryCount = (cat: string) => {
        if (cat === 'All') return articles.length;
        return articles.filter(a => a.category === cat).length;
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Tin Tức Tổng Hợp</h1>
                    <p className="text-gray-500">Cập nhật tin tức mới nhất về Tài chính, Marketing & Công nghệ</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2
                                ${filter === cat
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            <span>{cat === 'All' ? 'Tất cả' : cat}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === cat ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {getCategoryCount(cat)}
                            </span>
                        </button>
                    ))}
                    <div className="w-px h-6 bg-gray-200 mx-1"></div>
                    <button
                        onClick={fetchNews}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Quản lý xóa bài"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Quản Lý Bài Viết</h2>
                            <button onClick={() => setShowDeleteModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleDeleteYesterday}
                                disabled={deleting}
                                className="w-full p-4 text-left rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                <Calendar size={20} className="text-red-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Xóa bài viết hôm qua</p>
                                    <p className="text-sm text-gray-500">Xóa tất cả bài viết của ngày hôm qua</p>
                                </div>
                            </button>

                            <button
                                onClick={handleDeleteLastWeek}
                                disabled={deleting}
                                className="w-full p-4 text-left rounded-xl border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                <Calendar size={20} className="text-orange-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Xóa bài viết tuần trước</p>
                                    <p className="text-sm text-gray-500">Xóa tất cả bài viết cũ hơn 7 ngày</p>
                                </div>
                            </button>

                            <div className="p-4 rounded-xl border border-gray-200">
                                <p className="font-medium text-gray-900 mb-3">Xóa theo ngày cụ thể</p>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={customDate}
                                        onChange={(e) => setCustomDate(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleDeleteCustomDate}
                                        disabled={deleting || !customDate}
                                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Xóa
                                    </button>
                                </div>
                            </div>

                            <hr className="my-4" />

                            <button
                                onClick={handleDeleteAll}
                                disabled={deleting}
                                className="w-full p-4 text-left rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                <Trash2 size={20} className="text-red-600" />
                                <div>
                                    <p className="font-medium text-red-600">⚠️ Xóa TẤT CẢ bài viết</p>
                                    <p className="text-sm text-red-500">Hành động này không thể hoàn tác!</p>
                                </div>
                            </button>
                        </div>

                        {deleting && (
                            <div className="mt-4 text-center text-gray-500">
                                <RefreshCw className="animate-spin inline mr-2" size={16} />
                                Đang xóa...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-2xl p-6 h-64 animate-pulse shadow-sm">
                                <div className="h-4 bg-gray-100 rounded w-1/4 mb-4"></div>
                                <div className="h-48 bg-gray-100 rounded-xl mb-4"></div>
                                <div className="h-6 bg-gray-100 rounded w-3/4"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredArticles.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-gray-300 mb-4">
                            <Filter size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900">Không tìm thấy tin tức</h3>
                        <p className="text-gray-500 mt-2">Hệ thống đang thu thập tin tức. Vui lòng quay lại sau.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredArticles.map((article, index) => (
                            <NewsCard key={article.id} article={article} index={index} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsPage;
