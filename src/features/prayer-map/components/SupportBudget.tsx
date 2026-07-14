import { useState } from 'react';
import type { MissionaryWithBudget } from '../data/types';
import { formatMoney } from '../data/format';

interface SupportBudgetProps {
  missionary: MissionaryWithBudget;
}

/**
 * Always-visible funding summary, plus a line-item breakdown that is collapsed
 * by default and toggles open (SPEC §4.8).
 */
export default function SupportBudget({ missionary }: SupportBudgetProps) {
  const [open, setOpen] = useState(false);
  const { monthlyNeed, raised, supportGoal, budget } = missionary;
  const toGo = monthlyNeed - raised;

  return (
    <>
      <h3 className="pm-sec-label pm-sec-label--spaced">Monthly Support Budget</h3>

      <div className="pm-budget-summary">
        <div className="pm-budget-need">
          <span className="pm-budget-need__label">Total monthly support needed</span>
          <span className="pm-budget-need__amt">
            {formatMoney(monthlyNeed)}
            <span className="pm-budget-need__per">/mo</span>
          </span>
        </div>
        <div className="pm-budget-track">
          <div className="pm-budget-fill" style={{ width: `${supportGoal}%` }} />
        </div>
        <div className="pm-budget-raised">
          <span>
            {formatMoney(raised)} raised ({supportGoal}%)
          </span>
          {toGo > 0 ? (
            <span className="pm-budget-togo">{formatMoney(toGo)} still needed</span>
          ) : (
            <span>Fully funded 🎉</span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="pm-budget-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="pm-budget-breakdown"
      >
        <span>
          📋 {open ? 'Hide budget breakdown' : 'See budget breakdown'} ({budget.length} items)
        </span>
        <span className={open ? 'pm-budget-chev pm-budget-chev--open' : 'pm-budget-chev'} aria-hidden="true">
          ▼
        </span>
      </button>

      {open && (
        <div id="pm-budget-breakdown" className="pm-budget-list">
          {budget.map((line, i) => (
            <div key={i} className="pm-budget-item">
              <div className="pm-budget-item__info">
                <div className="pm-budget-item__name">{line.item}</div>
                <div className="pm-budget-item__purpose">{line.purpose}</div>
              </div>
              <div className="pm-budget-item__amt">{formatMoney(line.amount)}</div>
            </div>
          ))}
          <div className="pm-budget-total">
            <span>Total per month</span>
            <span>{formatMoney(monthlyNeed)}</span>
          </div>
        </div>
      )}
    </>
  );
}
