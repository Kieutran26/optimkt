import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { NewsCard, NewsArticle } from './NewsCard';
import { RefreshCw, Filter } from 'lucide-react';

const NewsPage: React.FC = () => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

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

    const categories = ['All', 'Finance', 'Marketing', 'Tech', 'Lifestyle'];
    const filteredArticles = filter === 'All'
        ? articles
        : articles.filter(a => a.category === filter);

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
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                ${filter === cat
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            {cat === 'All' ? 'Tất cả' : cat}
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
                </div>
            </div>

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
                        {filteredArticles.map(article => (
                            <NewsCard key={article.id} article={article} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsPage;
