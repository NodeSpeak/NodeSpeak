"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronRight, Shield, Vote, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// Wallet configurations with translation keys
const WALLETS = {
  rabby: {
    name: "Rabby",
    emoji: "🐇",
    descKey: "wallet.rabbyDesc" as const,
    desktop: "https://rabby.io/",
    mobile: null, // Rabby is desktop-only for now
  },
  metamask: {
    name: "MetaMask",
    emoji: "🦊",
    descKey: "wallet.metamaskDesc" as const,
    desktop: "https://metamask.io/download/",
    mobile: "https://metamask.app.link/dapp/nodespeak.xyz",
  },
  trust: {
    name: "Trust Wallet",
    emoji: "🛡️",
    descKey: "wallet.trustDesc" as const,
    desktop: "https://trustwallet.com/browser-extension",
    mobile: "https://link.trustwallet.com/open_url?coin_id=60&url=https://nodespeak.xyz",
  },
  coinbase: {
    name: "Coinbase Wallet",
    emoji: "🔵",
    descKey: "wallet.coinbaseDesc" as const,
    desktop: "https://www.coinbase.com/wallet/downloads",
    mobile: "https://go.cb-w.com/dapp?cb_url=https://nodespeak.xyz",
  },
};

interface WalletOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Detect if user is on mobile
const isMobile = (): boolean => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Micro-onboarding screens
const OnboardingScreens = ({ onComplete }: { onComplete: () => void }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState(0);

  const screens = [
    {
      icon: <Shield className="h-14 w-14 text-sky-500" />,
      titleKey: "onboarding.screen1Title" as const,
      descKey: "onboarding.screen1Desc" as const,
      gradient: "from-sky-500/20 to-indigo-500/20",
    },
    {
      icon: <Vote className="h-14 w-14 text-indigo-500" />,
      titleKey: "onboarding.screen2Title" as const,
      descKey: "onboarding.screen2Desc" as const,
      gradient: "from-indigo-500/20 to-violet-500/20",
    },
  ];

  if (step >= screens.length) {
    return null;
  }

  return (
    <div className="py-8 text-center space-y-6">
      {/* Icon with gradient background */}
      <div className="flex justify-center">
        <div className={`p-5 rounded-2xl bg-gradient-to-br ${screens[step].gradient} dark:opacity-90`}>
          {screens[step].icon}
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {t(screens[step].titleKey)}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
          {t(screens[step].descKey)}
        </p>
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-center gap-2 pt-2">
        {screens.map((_, idx) => (
          <div
            key={idx}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === step 
                ? "w-6 bg-gradient-to-r from-sky-500 to-indigo-500" 
                : "w-2 bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
      
      {/* Navigation buttons */}
      <div className="flex gap-3 justify-center pt-4">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            className="px-6 rounded-full border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t("wallet.back")}
          </Button>
        )}
        <Button
          onClick={() => {
            if (step < screens.length - 1) {
              setStep((s) => s + 1);
            } else {
              onComplete();
            }
          }}
          className="px-6 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white shadow-lg shadow-sky-200 dark:shadow-sky-900/30"
        >
          {step < screens.length - 1 ? t("wallet.next") : t("wallet.installWallet")}
        </Button>
      </div>
      
      <button
        onClick={onComplete}
        className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
      >
        {t("wallet.skipIntro")}
      </button>
    </div>
  );
};

// Wallet button component
const WalletButton = ({
  wallet,
  mobile,
}: {
  wallet: (typeof WALLETS)[keyof typeof WALLETS];
  mobile: boolean;
}) => {
  const { t } = useLanguage();
  const url = mobile && wallet.mobile ? wallet.mobile : wallet.desktop;

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:border-sky-300 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-900/20 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{wallet.emoji}</span>
        <div className="text-left">
          <div className="font-medium text-slate-900 dark:text-slate-100">{wallet.name}</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">{t(wallet.descKey)}</div>
        </div>
      </div>
      <ExternalLink className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-sky-500 transition-colors" />
    </a>
  );
};

export const WalletOnboardingModal: React.FC<WalletOnboardingModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { t } = useLanguage();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showOtherWallets, setShowOtherWallets] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(isMobile());
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setShowOnboarding(true);
      setShowOtherWallets(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/60 dark:border-slate-700/60 shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 rounded-3xl">
        {showOnboarding ? (
          <OnboardingScreens onComplete={() => setShowOnboarding(false)} />
        ) : (
          <>
            <DialogHeader className="text-center pb-2">
              <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {t("wallet.connectTitle")}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-400 pt-2">
                {t("wallet.connectDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {/* Primary wallets */}
              <WalletButton wallet={WALLETS.rabby} mobile={mobile} />
              <WalletButton wallet={WALLETS.metamask} mobile={mobile} />

              {/* Other wallets - expandable */}
              <button
                onClick={() => setShowOtherWallets(!showOtherWallets)}
                className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <span className="text-sm">{t("wallet.otherWallets")}</span>
                {showOtherWallets ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {showOtherWallets && (
                <div className="space-y-3 pt-1 animate-fadeIn">
                  <WalletButton wallet={WALLETS.trust} mobile={mobile} />
                  <WalletButton wallet={WALLETS.coinbase} mobile={mobile} />
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                    {t("wallet.allCompatible")}
                  </p>
                </div>
              )}
            </div>

            {/* Help section */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
              <a
                href="https://ethereum.org/wallets/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                <span>{t("wallet.whatIsWallet")}</span>
                <ChevronRight className="h-3 w-3" />
              </a>
            </div>

            {/* Clarification message */}
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50 dark:from-sky-900/20 dark:to-indigo-900/20 rounded-2xl p-4 mt-2 border border-sky-100 dark:border-sky-800/30">
              <p className="text-xs text-slate-600 dark:text-slate-300 text-center leading-relaxed">
                💡 {t("wallet.tipTitle")}
                <br />
                <span className="text-slate-500 dark:text-slate-400">{t("wallet.tipSubtitle")}</span>
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WalletOnboardingModal;
