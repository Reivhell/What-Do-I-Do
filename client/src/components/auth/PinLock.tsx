import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Lock, AlertCircle, AlertTriangle, Loader2, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Card } from '../ui';

interface PinLockProps {
  onUnlock: () => void;
  onForgotPin: () => void;
}

export function PinLock({ onUnlock, onForgotPin }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((c) => c - 1);
      }, 1000);
    } else if (cooldownRef.current) {
      clearInterval(cooldownRef.current);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || cooldown > 0) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/settings/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();

      if (data.success) {
        onUnlock();
        return;
      }

      setAttempts((a) => a + 1);
      const newAttempts = attempts + 1;

      if (newAttempts >= 3) {
        const unlockTime = new Date(Date.now() + 30000);
        setLockedUntil(unlockTime);
        setCooldown(30);
        setError('Too many failed attempts. Locked for 30 seconds.');
      } else {
        setError(`Incorrect PIN. ${3 - newAttempts} attempt${3 - newAttempts > 1 ? 's' : ''} remaining.`);
      }
      setPin('');
    } catch {
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPin = () => {
    if (window.confirm('This will delete ALL your data and reset the app. Are you sure?')) {
      onForgotPin();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading && cooldown === 0) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const remainingCooldown = lockedUntil ? Math.max(0, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm clay-surface">
      <Card className="w-full max-w-sm clay-shadow-strong">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center size-16 rounded-full clay-bg clay-shadow-inset mb-4">
              <Lock className="size-8 text-ink-500" />
            </div>
            <h2 className="text-xl font-heading font-semibold text-ink-900">App Locked</h2>
            <p className="text-sm text-ink-500 mt-1">Enter your PIN to unlock</p>
          </div>

          {remainingCooldown > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-800 text-sm">
              <AlertTriangle className="size-4 flex-shrink-0" />
              <span>Locked for {remainingCooldown}s</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={handleKeyDown}
                placeholder="Enter PIN"
                disabled={loading || cooldown > 0}
                className="text-center text-2xl tracking-widest font-mono pe-12 clay-inset"
                aria-label="PIN code"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-800 text-sm">
                <AlertCircle className="size-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || cooldown > 0}
              className="w-full clay-btn clay-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : cooldown > 0 ? `Try again in ${cooldown}s` : 'Unlock'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-ink-100">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-ink-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleForgotPin}
              disabled={loading}
            >
              <Trash2 className="size-4 mr-2" />
              Forgot PIN? Reset all data
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}