"use client";

import React from "react";
import { Lock, UserPlus } from "lucide-react";

interface ClosedCommunityNoticeProps {
  hasPendingRequest: boolean;
  currentUserAddress: string | null;
  onRequestAccess: () => void;
}

/**
 * ClosedCommunityNotice - Access denied message for closed communities
 */
export const ClosedCommunityNotice: React.FC<ClosedCommunityNoticeProps> = ({
  hasPendingRequest,
  currentUserAddress,
  onRequestAccess,
}) => {
  return (
    <div className="p-8 text-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm">
      <Lock className="w-12 h-12 text-amber-400 mx-auto mb-4" />
      <p className="text-slate-700 dark:text-slate-300 mb-2 font-medium">This is a closed community</p>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">Request access to view posts and participate in discussions.</p>
      {currentUserAddress && !hasPendingRequest ? (
        <button onClick={onRequestAccess} className="bg-amber-500 text-white px-6 py-2 rounded-xl hover:bg-amber-600 transition-colors inline-flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Request Access
        </button>
      ) : currentUserAddress && hasPendingRequest ? (
        <span className="bg-amber-100 text-amber-700 px-6 py-2 rounded-xl inline-flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Request Pending...
        </span>
      ) : null}
    </div>
  );
};

export default ClosedCommunityNotice;
