import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { FileDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HackMDImportButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
}

export const HackMDImportButton: React.FC<HackMDImportButtonProps> = ({
  variant = 'outline',
  size = 'default',
  className = '',
  showText = true
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={className}
            asChild
          >
            <Link href="/import/hackmd">
              <FileDown className="h-4 w-4 mr-2" />
              {showText && "Importar desde HackMD"}
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Importar documentos desde HackMD</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
