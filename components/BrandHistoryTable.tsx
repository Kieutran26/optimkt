import React from 'react';
import { BrandSpyResult } from '../types';
import { Eye, Trash2, MoreHorizontal, ExternalLink } from 'lucide-react';

interface BrandHistoryTableProps {
    analyses: BrandSpyResult[];
    onLoad: (analysis: BrandSpyResult) => void;
    onDelete: (id: string) => void;
}

const BrandHistoryTable: React.FC<BrandHistoryTableProps> = ({ analyses, onLoad, onDelete }) => {
    if (analyses.length === 0) {
        return (
            <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                Chưa có báo cáo nào.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-4 font-bold tracking-wider">Tên báo cáo</th>
                        <th className="px-6 py-4 font-bold tracking-wider">URL</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Nền tảng</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Số lượng</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Trạng thái</th>
                        <th className="px-6 py-4 font-bold tracking-wider">Ngày tạo</th>
                        <th className="px-6 py-4 font-bold tracking-wider text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {analyses.map((item) => (
                        <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors group">
                            {/* Report Name */}
                            <td className="px-6 py-4 font-medium text-slate-900">
                                {item.brandName || 'Unknown Brand'}
                            </td>

                            {/* URL */}
                            <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">
                                <a
                                    href={item.targetUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-blue-600 flex items-center gap-1 transition-colors"
                                >
                                    {item.targetUrl}
                                </a>
                            </td>

                            {/* Platform */}
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                    ${item.platform === 'facebook' ? 'bg-blue-50 text-blue-700' :
                                        item.platform === 'tiktok' ? 'bg-black/5 text-slate-800' : 'bg-slate-100 text-slate-600'}`}>
                                    {item.platform}
                                </span>
                            </td>

                            {/* Quantity */}
                            <td className="px-6 py-4 text-slate-600">
                                {item.platform === 'google_ads'
                                    ? `${item.ads?.length || 0} ads`
                                    : `${item.posts?.length || 0} bài`
                                }
                            </td>

                            {/* Status - Mock status since we assume saved = done */}
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                    Hoàn thành
                                </span>
                            </td>

                            {/* Date */}
                            <td className="px-6 py-4 text-slate-500">
                                {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onLoad(item)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        title="Xem chi tiết"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('Bạn có chắc muốn xóa báo cáo này?')) {
                                                onDelete(item.id);
                                            }
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        title="Xóa"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BrandHistoryTable;
