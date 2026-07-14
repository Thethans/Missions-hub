import type { MissionaryWithBudget } from '../data/types';
import { formatMoney } from '../data/format';
import SecurityNotice from './SecurityNotice';
import MinistrySection from './MinistrySection';
import PrayerRequests from './PrayerRequests';
import SensitiveBlock from './SensitiveBlock';
import UpdatesFeed from './UpdatesFeed';
import SupportBudget from './SupportBudget';
import NewsletterSignup from './NewsletterSignup';

interface MissionaryCardProps {
  missionary: MissionaryWithBudget;
  onClose: () => void;
  /** Signed-in member? Drives the sensitive-block reveal. */
  isMember: boolean;
  /** Opens the member login sheet. */
  onSignIn: () => void;
  /** Prayer toggle. */
  isPraying: boolean;
  onPray: () => void;
  /** Displayed prayer count (already includes any optimistic delta). */
  prayerCount: number;
  /** Opens the pay sheet. */
  onPay: () => void;
}

/**
 * Orchestrates the card: header → Ministry → PrayerRequests (+ sensitive gate)
 * → UpdatesFeed → SupportBudget → NewsletterSignup, with a sticky support
 * footer (SPEC §6).
 */
export default function MissionaryCard({
  missionary,
  onClose,
  isMember,
  onSignIn,
  isPraying,
  onPray,
  prayerCount,
  onPay
}: MissionaryCardProps) {
  const { monthlyNeed, raised, supportGoal } = missionary;

  return (
    <>
      <header className="pm-card__header">
        <button type="button" className="pm-card__close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <p className="pm-card__eyebrow">{missionary.role}</p>
        <h2 className="pm-card__name">{missionary.name}</h2>
        {missionary.nameNote && <p className="pm-card__name-note">{missionary.nameNote}</p>}
        <p className="pm-card__location">{missionary.location}</p>
        <p className="pm-card__praying">
          🙏 <b>{prayerCount.toLocaleString('en-US')}</b> praying
        </p>
      </header>

      <div className="pm-card__body">
        {missionary.locationSensitive && <SecurityNotice />}
        <MinistrySection ministry={missionary.ministry} />
        <PrayerRequests requests={missionary.prayerRequests} />
        <SensitiveBlock sensitive={missionary.sensitive} isMember={isMember} onSignIn={onSignIn} />
        <UpdatesFeed updates={missionary.updates} prayerRequests={missionary.prayerRequests} />
        <SupportBudget missionary={missionary} />
        <NewsletterSignup missionaryName={missionary.name} />
      </div>

      <footer className="pm-support-bar">
        <div className="pm-support-bar__meta">
          <span className="pm-support-bar__amt">
            {formatMoney(raised)} of {formatMoney(monthlyNeed)} / mo
          </span>
          <span className="pm-support-bar__pct">{supportGoal}% funded</span>
        </div>
        <div className="pm-support-track">
          <div className="pm-support-fill" style={{ width: `${supportGoal}%` }} />
        </div>
        <div className="pm-support-bar__btns">
          <button
            type="button"
            className={isPraying ? 'pm-btn-pray pm-btn-pray--active' : 'pm-btn-pray'}
            onClick={onPray}
            aria-pressed={isPraying}
          >
            {isPraying ? '✓ Praying' : '🙏 Pray'}
          </button>
          <button type="button" className="pm-btn-pay" onClick={onPay}>
            <span className="pm-applepay-logo" aria-hidden="true">

            </span>{' '}
            Pay · Support
          </button>
        </div>
      </footer>
    </>
  );
}
