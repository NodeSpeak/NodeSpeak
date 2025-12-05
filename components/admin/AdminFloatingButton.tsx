"use client";

import React from "react";
import Link from "next/link";
import { useAdminContext } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const AdminFloatingButton: React.FC = () => {
  const { isAdmin } = useAdminContext();

  if (!isAdmin) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/admin">
            <Button
              size="lg"
              className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg hover:shadow-xl transition-all bg-slate-900 hover:bg-slate-800 text-white w-14 h-14 p-0"
            >
              <Shield className="w-6 h-6" />
            </Button>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Panel de Administración</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
