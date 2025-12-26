import React from 'react';
import { ExternalLink, Calendar, Tag } from 'lucide-react';

export interface NewsArticle {
    id: string;
    title: string;
    link: string;
    pub_date: string;
    source: string;
    category: string;
    summary: string;
    image_url?: string;
}

interface NewsCardProps {
    article: NewsArticle;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
    // Format date nicely (e.g., "Today, 10:00 AM" or "25 Dec")
    const date = new Date(article.pub_date);
    const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

    // Category badge colors (Soft Pastel)
    const getCategoryColor = (cat: string) => {
        switch (cat?.toLowerCase()) {
            case 'finance': return 'bg-emerald-50 text-emerald-600';
            case 'marketing': return 'bg-blue-50 text-blue-600';
            case 'tech': return 'bg-purple-50 text-purple-600';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    // Helper to decode HTML entities
    const decodeHtml = (html: string) => {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    };

    const title = decodeHtml(article.title);
    const summary = decodeHtml(article.summary.replace(/<[^>]*>?/gm, ''));

    return (
        <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block h-full"
        >
            <div className="bg-white rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-transparent hover:border-gray-50">

                {/* Header: Source & Date */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getCategoryColor(article.category)}`}>
                            {article.category || 'News'}
                        </span>
                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider pl-2 border-l border-gray-100">
                            {article.source}
                        </span>
                    </div>
                </div>

                {/* Image (Always show - use placeholder if missing) */}
                <div className="mb-4 overflow-hidden rounded-xl bg-gray-100 aspect-video relative">
                    {article.image_url ? (
                        <img
                            src={article.image_url}
                            alt={title}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    {/* Fallback Image / Placeholder */}
                    <div className={`${article.image_url ? 'hidden' : ''} w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-400`}>
                        <Tag size={32} strokeWidth={1.5} className="mb-2 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">News</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-800 leading-snug mb-3 group-hover:text-blue-600 transition-colors">
                    {title}
                </h3>

                {/* Summary */}
                <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3">
                    {summary}
                </p>

                {/* Footer */}
                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-gray-400 text-xs">
                    <div className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {dateStr}
                    </div>
                    <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-blue-500 opacity-0 group-hover:opacity-100 font-medium">
                        Đọc tiếp <ExternalLink size={12} />
                    </div>
                </div>
            </div>
        </a>
    );
};
