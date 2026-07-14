import { useEffect, useState } from 'react';
import type { MissionaryWithBudget } from '../../data/types';
import { firstName } from '../../data/format';
import BottomSheet from './BottomSheet';

interface PaySheetProps {
  open: boolean;
  onClose: () => void;
  /** The missionary being supported; null while closed. */
  missionary: MissionaryWithBudget | null;
}

type Frequency = 'once' | 'monthly';

const PRESET_AMOUNTS = [25, 50, 100, 250, 500] as const;
const DEFAULT_AMOUNT = 50;

/**
 * MOCK tap-to-pay support sheet (SPEC §4.10). One-time/monthly toggle, preset
 * amounts plus a custom "Other", an Apple-Pay-styled confirm, and a Face-ID-
 * style success screen. Nothing is charged.
 * TODO(real): real Apple Pay / Stripe merchant, or deep-link to Planning Center
 * Giving; recurring gifts become a Stripe subscription / PC recurring fund.
 */
export default function PaySheet({ open, onClose, missionary }: PaySheetProps) {
  const [freq, setFreq] = useState<Frequency>('once');
  const [amount, setAmount] = useState<number>(DEFAULT_AMOUNT);
  const [other, setOther] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset to defaults each time the sheet opens.
  useEffect(() => {
    if (open) {
      setFreq('once');
      setAmount(DEFAULT_AMOUNT);
      setOther(false);
      setSuccess(false);
    }
  }, [open]);

  if (!missionary) return null;

  const name = firstName(missionary.name);
  const amountValid = amount >= 1;
  const confirmLabel = freq === 'monthly' ? `Pay $${amount || 0}/mo` : `Pay $${amount || 0}`;

  const selectPreset = (a: number) => {
    setOther(false);
    setAmount(a);
  };
  const selectOther = () => {
    setOther(true);
    setAmount(0);
  };
  const confirm = () => {
    if (!amountValid) return;
    setSuccess(true);
  };

  return (
    <BottomSheet open={open} onClose={onClose} label={`Support ${name}`}>
      {success ? (
        <div className="pm-pay-success">
          <div className="pm-pay-success__check" aria-hidden="true">
            ✓
          </div>
          <div className="pm-pay-success__title">Thank you!</div>
          <p className="pm-pay-success__sub">
            Your ${amount}
            {freq === 'monthly' ? ' every month' : ''} gift to {name} is on its way.
          </p>
          <button type="button" className="pm-pay-confirm" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <>
          <h2 className="pm-sheet__title">Support {name}</h2>
          <p className="pm-sheet__sub">
            {missionary.role} · {missionary.location}
          </p>

          <div className="pm-freq-toggle" role="group" aria-label="Gift frequency">
            <button
              type="button"
              className={freq === 'once' ? 'pm-freq-opt pm-freq-opt--sel' : 'pm-freq-opt'}
              aria-pressed={freq === 'once'}
              onClick={() => setFreq('once')}
            >
              One-time
            </button>
            <button
              type="button"
              className={freq === 'monthly' ? 'pm-freq-opt pm-freq-opt--sel' : 'pm-freq-opt'}
              aria-pressed={freq === 'monthly'}
              onClick={() => setFreq('monthly')}
            >
              Monthly
            </button>
          </div>

          <div className="pm-pay-amounts">
            {PRESET_AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                className={!other && a === amount ? 'pm-pay-amt pm-pay-amt--sel' : 'pm-pay-amt'}
                onClick={() => selectPreset(a)}
              >
                ${a}
              </button>
            ))}
            <button
              type="button"
              className={other ? 'pm-pay-amt pm-pay-amt--other pm-pay-amt--sel' : 'pm-pay-amt pm-pay-amt--other'}
              onClick={selectOther}
            >
              Other
            </button>
          </div>

          {other && (
            <div className="pm-pay-other">
              <input
                className="pm-pay-other__input"
                type="number"
                min="1"
                autoFocus
                placeholder="$ Enter amount"
                value={amount || ''}
                onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                aria-label="Custom amount in dollars"
              />
            </div>
          )}

          {freq === 'monthly' && <p className="pm-pay-freq-note">You can cancel your recurring gift anytime.</p>}

          {/* Mock payment instrument — no real card, no charge. */}
          <div className="pm-pay-card">
            <div className="pm-pay-card__icon" aria-hidden="true">

            </div>
            <div className="pm-pay-card__text">
              <b>Apple Pay</b>
              <span>Visa •••• 4242</span>
            </div>
          </div>

          <button type="button" className="pm-pay-confirm" onClick={confirm} disabled={!amountValid}>
            <span className="pm-applepay-logo" aria-hidden="true">

            </span>{' '}
            {confirmLabel}
          </button>
          <button type="button" className="pm-pay-cancel" onClick={onClose}>
            Cancel
          </button>
        </>
      )}
    </BottomSheet>
  );
}
