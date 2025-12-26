import React from 'react';
import { Calendar, X, Users } from 'lucide-react';
import { EmailCampaign } from '../../services/campaignService';

interface ScheduledCampaignsModalProps {
    campaigns: EmailCampaign[];
    onClose: () => void;
}

export const ScheduledCampaignsModal: React.FC<ScheduledCampaignsModalProps> = ({ campaigns, onClose }) => {
    const scheduled = campaigns
        .filter(c => (c.status === 'scheduled' || (c.status === 'draft' && c.scheduled_at)) && c.scheduled_at)
        .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-blue-50">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                        <Calendar size={20} className="text-blue-600" />
                        Lịch Chiến Dịch ({scheduled.length})
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-blue-100 rounded text-blue-700">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
                    {scheduled.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                            <p>Không có chiến dịch nào được lên lịch sắp tới.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {scheduled.map(campaign => (
                                <div key={campaign.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                                    <div className="bg-blue-100 text-blue-700 w-14 h-14 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold uppercase">{new Date(campaign.scheduled_at!).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-xl font-bold">{new Date(campaign.scheduled_at!).getDate()}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-bold text-gray-900 truncate">{campaign.name}</h4>
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium whitespace-nowrap">
                                                {new Date(campaign.scheduled_at!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2 truncate">{campaign.subject}</p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            {campaign.list_id && (
                                                <span className="flex items-center gap-1">
                                                    <Users size={12} /> List ID: {campaign.list_id.slice(0, 8)}...
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 bg-white text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};
