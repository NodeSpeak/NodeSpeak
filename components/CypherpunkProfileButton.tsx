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
      className={`bg-[#001800] hover:bg-[#002800] text-[var(--matrix-green)] text-xs py-1 px-2 h-auto flex items-center space-x-1 border border-[var(--matrix-green)] ${className}`}
    >
      <User className="h-4 w-4" />
      <span>Profile</span>
    </Button>
  );
}
