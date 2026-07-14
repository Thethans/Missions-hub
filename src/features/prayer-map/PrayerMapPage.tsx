import { useCallback, useEffect, useState } from 'react';
import usePageMeta from '../../hooks/usePageMeta.js';
import PrayerWorldMap from './components/PrayerWorldMap';
import MissionaryCard from './components/MissionaryCard';
import MemberStatusBadge from './components/MemberStatusBadge';
import IdleToast from './components/IdleToast';
import MemberLoginSheet from './components/sheets/MemberLoginSheet';
import PaySheet from './components/sheets/PaySheet';
import useMemberSession from './hooks/useMemberSession';
import usePrayerState from './hooks/usePrayerState';
import { missionaries } from './data/missionaries';
import { withDerivedBudget } from './data/deriveBudget';
import './prayer-map.css';

export default function PrayerMapPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  const session = useMemberSession();
  const prayer = usePrayerState();

  usePageMeta({
    title: 'Missionary Prayer Map',
    description:
      'Pray for and support missionaries around the world. Tap a pin to see their ministry, prayer requests, and monthly support needs.',
    path: '/prayer-map'
  });

  const close = useCallback(() => setSelectedId(null), []);

  // Close the card on Escape while it's open (and no sheet is capturing Escape).
  useEffect(() => {
    if (!selectedId || loginOpen || payOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selectedId, loginOpen, payOpen, close]);

  const selected = selectedId ? missionaries.find((m) => m.id === selectedId) ?? null : null;
  const selectedWithBudget = selected ? withDerivedBudget(selected) : null;

  const handleSignIn = useCallback(
    (password: string): boolean => {
      const ok = session.signIn(password);
      if (ok) setLoginOpen(false);
      return ok;
    },
    [session]
  );

  return (
    <div className="pm-page">
      <MemberStatusBadge
        isMember={session.isMember}
        remainingMs={session.remainingMs}
        onSignOut={() => session.signOut()}
      />

      <section className="page-hero page-hero--compact">
        <h1>Missionary prayer map</h1>
        <p>
          Every pin is a missionary serving overseas. Tap one to read their ministry, pray over
          their requests, and — if you feel led — support their monthly needs.
        </p>
      </section>

      <div className="page-map">
        <PrayerWorldMap onSelect={setSelectedId} selectedId={selectedId} />
      </div>

      {selectedWithBudget && (
        <div className="pm-overlay" role="presentation" onClick={close}>
          <div
            className="pm-card"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedWithBudget.name} — ${selectedWithBudget.location}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MissionaryCard
              missionary={selectedWithBudget}
              onClose={close}
              isMember={session.isMember}
              onSignIn={() => setLoginOpen(true)}
              isPraying={prayer.isPraying(selectedWithBudget.id)}
              onPray={() => prayer.toggle(selectedWithBudget.id)}
              prayerCount={prayer.countFor(selectedWithBudget.id, selectedWithBudget.prayerCount)}
              onPay={() => setPayOpen(true)}
            />
          </div>
        </div>
      )}

      <IdleToast toast={session.toast} onStay={session.extend} />
      <MemberLoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} onSubmit={handleSignIn} />
      <PaySheet open={payOpen} onClose={() => setPayOpen(false)} missionary={selectedWithBudget} />
    </div>
  );
}
