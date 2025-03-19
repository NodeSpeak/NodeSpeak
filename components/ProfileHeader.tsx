"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";

// Función auxiliar para acortar direcciones Ethereum
function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  
  // Asegurarse de que la dirección tiene suficiente longitud
  if (address.length < chars * 2 + 2) {
    return address;
  }
  
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

interface ProfileHeaderProps {
  userAddress: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  memberSince?: string;
  postCount?: number;
  isCurrentUser?: boolean;
}

export function ProfileHeader({
  userAddress,
  username,
  bio = "Web3 enthusiast and NodeSpeak community member",
  avatarUrl,
  memberSince = "Not available",
  postCount = 0,
  isCurrentUser = false,
}: ProfileHeaderProps) {
  const router = useRouter();
  const { isConnected } = useWalletContext();
  
  // Utilizar la dirección del usuario como nombre por defecto si no hay username
  const displayName = username || shortenAddress(userAddress);
  
  // Primera letra para el avatar fallback
  const fallbackInitial = displayName ? displayName[0].toUpperCase() : "N";

  return (
    <Card className="w-full border border-[var(--matrix-green)]/30 bg-black mb-6">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-20 w-20 border-2 border-[var(--matrix-green)]/50">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-[var(--matrix-green)]/10 text-[var(--matrix-green)]">
            {fallbackInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <CardTitle className="text-2xl font-mono text-[var(--matrix-green)]">
            {displayName}
          </CardTitle>
          <CardDescription className="text-[var(--matrix-green)]/70 font-mono mt-1">
            {userAddress}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-[var(--matrix-green)]/90 font-mono">
            {bio}
          </div>
          <div className="grid grid-cols-2 gap-4 text-[var(--matrix-green)]/70 font-mono text-sm">
            <div>
              <span className="font-bold">Member since:</span> {memberSince}
            </div>
            <div>
              <span className="font-bold">Posts:</span> {postCount}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-[var(--matrix-green)]/20 pt-4">
        {isCurrentUser ? (
          <Button 
            variant="outline" 
            className="border-[var(--matrix-green)] text-[var(--matrix-green)] hover:bg-[var(--matrix-green)]/10"
            onClick={() => router.push('/profile/edit')}
          >
            Edit Profile
          </Button>
        ) : (
          <Button 
            variant="outline" 
            className="border-[var(--matrix-green)] text-[var(--matrix-green)] hover:bg-[var(--matrix-green)]/10"
          >
            Follow
          </Button>
        )}
        <Button 
          variant="ghost" 
          className="text-[var(--matrix-green)]/70 hover:bg-[var(--matrix-green)]/10 hover:text-[var(--matrix-green)]"
          onClick={() => router.push('/foro')}
        >
          Back to Forum
        </Button>
      </CardFooter>
    </Card>
  );
}
