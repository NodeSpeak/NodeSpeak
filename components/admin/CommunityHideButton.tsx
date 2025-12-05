"use client";

import React, { useState } from "react";
import { useAdminContext } from "@/contexts/AdminContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { EyeOff, Eye, AlertTriangle, Home } from "lucide-react";

interface CommunityHideButtonProps {
  communityId: string;
  communityName: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const CommunityHideButton: React.FC<CommunityHideButtonProps> = ({
  communityId,
  communityName,
  variant = "outline",
  size = "sm",
  className = "",
}) => {
  const { isAdmin, hideCommunity, unhideCommunity, isCommunityHidden } = useAdminContext();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const hidden = isCommunityHidden(communityId);

  if (!isAdmin) {
    return null;
  }

  const handleHideCommunity = () => {
    setIsProcessing(true);
    try {
      hideCommunity(communityId, communityName, reason);
      setIsOpen(false);
      setReason("");
    } catch (error) {
      console.error("Error ocultando comunidad:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnhideCommunity = () => {
    setIsProcessing(true);
    try {
      unhideCommunity(communityId);
    } catch (error) {
      console.error("Error restableciendo comunidad:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (hidden) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleUnhideCommunity}
        disabled={isProcessing}
        className={`gap-2 ${className}`}
      >
        <Eye className="w-4 h-4" />
        Restablecer Comunidad
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`gap-2 ${className}`}
        >
          <EyeOff className="w-4 h-4" />
          Ocultar Comunidad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Ocultar Comunidad
          </DialogTitle>
          <DialogDescription>
            Estás a punto de ocultar esta comunidad y todo su contenido de la plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              Comunidad a ocultar
            </h4>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Nombre:</strong> {communityName}
              </p>
              <p className="text-sm break-all">
                <strong>ID:</strong>{" "}
                <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                  {communityId}
                </code>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reason" className="block text-sm font-medium">
              Motivo (opcional)
            </label>
            <Textarea
              id="reason"
              placeholder="Escribe el motivo por el cual estás ocultando esta comunidad..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-slate-500">
              Este motivo será visible solo para administradores en el panel de administración.
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2 text-sm">
              Consecuencias de esta acción:
            </h4>
            <ul className="space-y-1 text-sm text-orange-800">
              <li>• La comunidad no aparecerá en listados públicos</li>
              <li>• Todos los posts y comentarios de la comunidad quedarán ocultos</li>
              <li>• La comunidad no será accesible para otros usuarios</li>
              <li>• Puedes revertir esta acción en cualquier momento</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleHideCommunity}
            disabled={isProcessing}
            className="gap-2"
          >
            <EyeOff className="w-4 h-4" />
            {isProcessing ? "Ocultando..." : "Ocultar Comunidad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
