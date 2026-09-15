import React, { useState } from 'react';
import { Download, Smartphone, Apple, Monitor, CheckCircle, X, ExternalLink, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [installedSuccess, setInstalledSuccess] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstalledSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">ENSv1 Mobile & Desktop App</h2>
              <p className="text-xs text-slate-400">Explore Network Simulator Version 1 — Install on Android, iOS & Desktop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
              activeTab === 'android'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>Android App</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
              activeTab === 'ios'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Apple className="h-4 w-4" />
            <span>Apple iOS / iPad</span>
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
              activeTab === 'desktop'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Monitor className="h-4 w-4" />
            <span>Desktop (PC/Mac)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {isInstalled && (
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>ENSv1 is currently running as an installed standalone application!</span>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    Android Web APK & PWA
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                    Standalone Compatible
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ENSv1 is optimized for Android tablets and smartphones. Installing adds an app icon to your home screen, removes browser address bars, and enables offline topology access.
                </p>

                {isInstallable && !isInstalled ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 text-xs shadow-lg shadow-emerald-950 transition active:scale-[0.99]"
                  >
                    <Download className="h-4 w-4" />
                    Install ENSv1 on Android Now
                  </button>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                    <p className="font-semibold text-slate-200">Installation Instructions for Android:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                      <li>Open ENSv1 in <strong className="text-slate-200">Google Chrome</strong> or <strong className="text-slate-200">Samsung Internet</strong>.</li>
                      <li>Tap the browser menu <strong className="text-slate-200">(three vertical dots ⋮)</strong> in the top-right corner.</li>
                      <li>Select <strong className="text-slate-200">"Add to Home screen"</strong> or <strong className="text-slate-200">"Install app"</strong>.</li>
                      <li>Confirm by tapping <strong className="text-slate-200">"Install"</strong>.</li>
                    </ol>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                  <p className="font-semibold text-slate-200 mb-1">📱 Mobile Workspace</p>
                  <p className="text-slate-400 text-[11px]">Includes floating bottom navigation with device drag, touch cable linking, and responsive properties sheets.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800">
                  <p className="font-semibold text-slate-200 mb-1">⚡ Offline Ready</p>
                  <p className="text-slate-400 text-[11px]">Topology engine and CLI parser cache locally via Service Worker for uninterrupted network lab practice.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Apple className="h-4 w-4 text-sky-400" />
                    Apple iOS & iPadOS App
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                    Apple Web App Ready
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  On Apple iPhone and iPad, Safari provides seamless native PWA installation with custom home screen icon, splash screen, and full-screen laboratory workspace without browser chrome.
                </p>

                <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs">1</div>
                    <p className="text-slate-300">Open ENSv1 in <strong className="text-white">Apple Safari</strong> on your iPhone or iPad.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs">2</div>
                    <div className="space-y-1">
                      <p className="text-slate-300 flex items-center gap-1.5">
                        Tap the <strong className="text-white">Share</strong> button <Share className="h-3.5 w-3.5 inline text-sky-400" /> in the Safari bottom bar (or top toolbar on iPad).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs">3</div>
                    <p className="text-slate-300">Scroll down and tap <strong className="text-white">"Add to Home Screen"</strong> (with the plus ⊞ icon).</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 font-bold text-xs">4</div>
                    <p className="text-slate-300">Tap <strong className="text-white">"Add"</strong> in the top-right corner. ENSv1 will appear on your home screen!</p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/40 text-xs text-sky-300">
                💡 <strong className="text-sky-200">iPad Pro Tip:</strong> ENSv1 works with Apple Pencil for selecting topology nodes and connecting virtual cables with touch precision.
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-purple-400" />
                    Desktop Application (Windows / Mac / Linux)
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                    Desktop PWA
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Install ENSv1 as a dedicated desktop workstation application on Windows 11/10, macOS Sonoma/Sequoia, or Linux (Ubuntu/Debian/Fedora).
                </p>

                {isInstallable && !isInstalled ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 px-4 text-xs shadow-lg shadow-purple-950 transition active:scale-[0.99]"
                  >
                    <Download className="h-4 w-4" />
                    Install ENSv1 Desktop Application
                  </button>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
                    <p className="font-semibold text-slate-200">How to Install in Desktop Browsers:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>In Chrome/Edge: Look for the <strong className="text-slate-200">Install icon</strong> (computer with down arrow) on the right side of the address bar.</li>
                      <li>Or click browser menu <strong className="text-slate-200">Settings (...) → "Install ENSv1"</strong>.</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 px-6 py-3 text-xs text-slate-400">
          <span>ENSv1 v1.0 • PWA Certified</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 font-medium text-slate-200 transition"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
