"use client";

import React from "react";
import { useCommunitySettings } from "@/contexts/CommunitySettingsContext";
import { UserPlus, Check, X } from "lucide-react";

interface MembershipRequestsPanelProps {
    communityId: string;
    isCreator: boolean;
    onApprove: (requesterAddress: string) => Promise<void>;
    currentUserAddress?: string;
}

export const MembershipRequestsPanel: React.FC<MembershipRequestsPanelProps> = ({
    communityId,
    isCreator,
    onApprove,
    currentUserAddress
}) => {
    const { getPendingRequests, approveMembership, rejectMembership } = useCommunitySettings();
    const requests = getPendingRequests(communityId);

    // Solo mostrar si es creador y hay solicitudes pendientes
    if (!isCreator || requests.length === 0) return null;

    const handleApprove = async (requestId: string) => {
        const requesterAddress = approveMembership(requestId, currentUserAddress || '');
        if (requesterAddress) {
            // Llamar a la función del contrato para unir al usuario
            await onApprove(requesterAddress);
        }
    };

    const handleReject = (requestId: string) => {
        rejectMembership(requestId, currentUserAddress || '');
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <h3 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Pending Membership Requests ({requests.length})
            </h3>
            <div className="space-y-2">
                {requests.map(request => (
                    <div
                        key={request.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-100"
                    >
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">
                                {request.requesterAddress.slice(0, 6)}...{request.requesterAddress.slice(-4)}
                            </span>
                            <span className="text-xs text-slate-400">
                                {new Date(request.requestedAt).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleApprove(request.id)}
                                className="flex items-center gap-1 text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
                            >
                                <Check className="w-3 h-3" />
                                Approve
                            </button>
                            <button
                                onClick={() => handleReject(request.id)}
                                className="flex items-center gap-1 text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                            >
                                <X className="w-3 h-3" />
                                Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
