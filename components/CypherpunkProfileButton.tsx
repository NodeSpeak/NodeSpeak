"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CypherpunkProfileButtonProps {
  className?: string;
}

export function CypherpunkProfileButton({ className = "" }: CypherpunkProfileButtonProps) {
  const router = useRouter();
  
  return (
    <Button
      onClick={() => router.push('/profile')}
      className={`bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-1.5 px-3 h-auto flex items-center space-x-1 border border-slate-200 rounded-full transition-colors ${className}`}
    >
      <User className="h-3 w-3" />
      <span>Profile</span>
    </Button>
  );
}
