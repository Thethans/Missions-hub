import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const ROLE_OPTIONS = [
  { value: 'long_term', label: 'Long-term worker' },
  { value: 'short_term', label: 'Short-term / trip' },
  { value: 'marketplace_tentmaker', label: 'Marketplace / tentmaker' }
];

const ACCESS_OPTIONS = [
  { value: 'open_access', label: 'Open access' },
  { value: 'creative_access', label: 'Creative access' },
  { value: 'restricted_access', label: 'Restricted access' }
];

const CATEGORY_LABELS = {
  legal: 'Legal & Documentation',
  financial: 'Financial',
  medical: 'Medical',
  training: 'Training',
  team_logistics: 'Team & Logistics',
  departure: 'Departure'
};

function matchesProfile(item, profile) {
  const roleOk = !item.role_tags?.length || item.role_tags.includes(profile.role_type);
  const accessOk = !item.access_tags?.length || item.access_tags.includes(profile.access_level);
  return roleOk && accessOk;
}

// Anonymous checklist progress lives entirely in localStorage until (if
// ever) someone creates an account — see the Checklist component below for
// why: the goal is zero friction to try the feature, account creation is
// opt-in and only invited, never required.
const LOCAL_PROFILE_KEY = 'fielded_checklist_profile';
const LOCAL_PROGRESS_KEY = 'fielded_checklist_progress';
// Session-only (not localStorage): a dismissed prompt should stay quiet for
// the rest of this visit, but isn't permanently silenced — someone who
// dismisses it once shouldn't have the account option hidden from them
// forever, especially since they didn't take the action it was inviting.
const PROMPT_DISMISSED_KEY = 'fielded_checklist_prompt_dismissed';

function readLocalProfile() {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readLocalProgress() {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function SignInForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    setSending(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="checklist-auth">
        <p>Check your email — we sent a sign-in link to <strong>{email}</strong>.</p>
      </div>
    );
  }

  return (
    <form className="checklist-auth" onSubmit={handleSubmit}>
      <h2>Sign in to your checklist</h2>
      <p>We'll email you a link — no password needed.</p>
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button type="submit" disabled={sending}>
        {sending ? 'Sending…' : 'Send sign-in link'}
      </button>
      {error && <p className="checklist-error" role="alert">{error}</p>}
    </form>
  );
}

// `anonymous` skips the Supabase round-trip entirely and just hands the
// chosen values back to the caller — the signed-in path still upserts
// user_checklist_profile the same as before.
function ProfileSetup({ initial, onSaved, anonymous }) {
  const [roleType, setRoleType] = useState(initial?.role_type || '');
  const [accessLevel, setAccessLevel] = useState(initial?.access_level || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (anonymous) {
      onSaved({ role_type: roleType, access_level: accessLevel });
      return;
    }
    setSaving(true);
    setError(null);
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setSaving(false);
      setError(userError?.message || 'Your session expired — please sign in again.');
      return;
    }
    const { error: upsertError } = await supabase
      .from('user_checklist_profile')
      .upsert({ user_id: user.id, role_type: roleType, access_level: accessLevel, updated_at: new Date().toISOString() });
    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    onSaved({ role_type: roleType, access_level: accessLevel });
  }

  return (
    <form className="checklist-setup" onSubmit={handleSubmit}>
      <h2>{initial ? 'Update your profile' : 'A couple quick questions'}</h2>
      <p className="checklist-setup-intro">
        These two answers build your checklist — your role determines which preparation steps
        apply, and your destination's access level determines how much of it needs to stay private.
      </p>
      <label>
        Role type
        <select
          value={roleType}
          onChange={(e) => setRoleType(e.target.value)}
          required
          aria-describedby="checklist-role-hint"
        >
          <option value="" disabled>Select a role…</option>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p id="checklist-role-hint" className="checklist-field-hint">
          Long-term, short-term, and marketplace-tentmaker roles unlock different steps — from
          support raising to a tentmaking role's own work-permit paperwork.
        </p>
      </label>
      <label>
        Destination access-level
        <select
          value={accessLevel}
          onChange={(e) => setAccessLevel(e.target.value)}
          required
          aria-describedby="checklist-access-hint"
        >
          <option value="" disabled>Select an access level…</option>
          {ACCESS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p id="checklist-access-hint" className="checklist-field-hint">
          Open access is standard preparation. Creative and restricted access add items like extra
          permits, evacuation coverage, and a digital-security review — the more sensitive the
          field, the less of your prep can be public.
        </p>
      </label>
      <button type="submit" disabled={saving}>{saving ? 'Generating…' : 'Generate my checklist'}</button>
      {error && <p className="checklist-error" role="alert">{error}</p>}
    </form>
  );
}

// Low-pressure by design: dismissible (never a hard gate blocking the
// checklist itself), and reappears on a fresh visit rather than being
// permanently hidden by one click of "not now." Collapses into the
// existing SignInForm in place rather than navigating anywhere, so
// signing up never feels like it interrupted whatever they were doing.
function SignupPrompt({ completedCount, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="checklist-signup-prompt" role="status">
      {expanded ? (
        <SignInForm />
      ) : (
        <>
          <p>
            {completedCount > 0
              ? `You've checked off ${completedCount} item${completedCount === 1 ? '' : 's'} — create an account to save your progress permanently and pick it up on another device.`
              : 'Create an account any time to save your progress permanently and pick it up on another device.'}
          </p>
          <div className="checklist-signup-prompt-actions">
            <button type="button" className="cta-button" onClick={() => setExpanded(true)}>
              Save my progress
            </button>
            <button
              type="button"
              className="checklist-signup-prompt-dismiss"
              onClick={onDismiss}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ChecklistView({ items, profile, completedIds, onToggle, onEditProfile }) {
  const [openCategories, setOpenCategories] = useState(() => new Set());
  const openedOnceRef = useRef(false);

  const visibleItems = useMemo(
    () => items.filter((item) => matchesProfile(item, profile)),
    [items, profile]
  );

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of visibleItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return map;
  }, [visibleItems]);

  // Opens the first category by default, once, the first time the grouped
  // list is non-empty — matches the old effect-on-load behavior without
  // re-collapsing everything back to just the first category on every
  // profile-driven recompute.
  useEffect(() => {
    if (openedOnceRef.current) return;
    if (grouped.size === 0) return;
    openedOnceRef.current = true;
    setOpenCategories(new Set([[...grouped.keys()][0]]));
  }, [grouped]);

  function toggleCategory(category) {
    const next = new Set(openCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setOpenCategories(next);
  }

  if (visibleItems.length === 0) {
    return (
      <div className="checklist">
        <p>No checklist items match your profile yet. Try updating your role or access level.</p>
        <button onClick={onEditProfile}>Edit profile</button>
      </div>
    );
  }

  const percent = Math.round((completedIds.size / visibleItems.length) * 100) || 0;

  return (
    <div className="checklist">
      <div className="checklist-header">
        <div className="checklist-progress">
          <div className="checklist-progress-bar">
            <div className="checklist-progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <span>{completedIds.size} / {visibleItems.length} complete</span>
        </div>
        <button className="checklist-settings" onClick={onEditProfile} title="Edit profile">
          <span aria-hidden="true">⚙</span> Profile
        </button>
      </div>

      {[...grouped.entries()].map(([category, categoryItems]) => {
        const isOpen = openCategories.has(category);
        const doneInCategory = categoryItems.filter((i) => completedIds.has(i.id)).length;
        return (
          <section className="checklist-category" key={category}>
            <button
              className="checklist-category-toggle"
              onClick={() => toggleCategory(category)}
              aria-expanded={isOpen}
            >
              <span><span aria-hidden="true">{isOpen ? '▾' : '▸'}</span> {CATEGORY_LABELS[category] || category}</span>
              <span className="checklist-category-count">{doneInCategory} / {categoryItems.length}</span>
            </button>
            {isOpen && (
              <ul className="checklist-items">
                {categoryItems.map((item) => (
                  <li className="checklist-item" key={item.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={completedIds.has(item.id)}
                        onChange={() => onToggle(item.id)}
                      />
                      <span className="checklist-item-title">{item.title}</span>
                    </label>
                    {item.description && <p className="checklist-item-desc">{item.description}</p>}
                    {item.external_link && (
                      <a href={item.external_link} target="_blank" rel="noreferrer">Learn more →</a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default function Checklist() {
  // Starts false (not "loading…"): scripts/prerender.js always captures this
  // page anonymous (no auth cookie in its headless profile), so the snapshot
  // is always the anonymous view. Never a "Loading…" spinner, and never any
  // real session — that's per-user and must never be baked into shared
  // static HTML. Starting from the same anonymous assumption here makes a
  // real visitor's first hydration render match the snapshot; the effect
  // below swaps to the signed-in view once getSession() resolves, same as
  // it did before for any visitor who did have a session.
  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);

  // Item definitions are public-read (see supabase/schema.sql — "Anyone can
  // read checklist items") so this loads the same way regardless of
  // whether anyone is signed in.
  const [items, setItems] = useState(null);
  const [itemsError, setItemsError] = useState(null);

  // Signed-in state — only ever populated once a session exists.
  const [remoteProfile, setRemoteProfile] = useState(undefined); // undefined = not yet loaded, null = none
  const [remoteCompletedIds, setRemoteCompletedIds] = useState(new Set());
  const [remoteProgressLoaded, setRemoteProgressLoaded] = useState(false);
  const [progressError, setProgressError] = useState(null);

  // Anonymous state — the only persistence for anyone who hasn't signed in.
  const [localProfile, setLocalProfileState] = useState(readLocalProfile);
  const [localCompletedIds, setLocalCompletedIdsState] = useState(readLocalProgress);
  const [promptDismissed, setPromptDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(PROMPT_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  function setLocalProfile(profile) {
    setLocalProfileState(profile);
    try {
      localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    } catch {
      // localStorage unavailable (private browsing, quota) — progress just
      // won't persist across a reload, same degradation as saved_opps.
    }
  }

  function setLocalCompletedIds(ids) {
    setLocalCompletedIdsState(ids);
    try {
      localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify([...ids]));
    } catch {
      // ignore — see setLocalProfile
    }
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from('checklist_items')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setItemsError(error.message);
          return;
        }
        setItems(data);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session) {
      setRemoteProfile(undefined);
      return;
    }
    let cancelled = false;
    supabase
      .from('user_checklist_profile')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setRemoteProfile(data);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!supabase || !session) {
      setRemoteCompletedIds(new Set());
      setRemoteProgressLoaded(false);
      return;
    }
    let cancelled = false;
    supabase
      .from('user_checklist_progress')
      .select('item_id')
      .eq('user_id', session.user.id)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setProgressError(error.message);
          return;
        }
        setRemoteCompletedIds(new Set((data || []).map((r) => r.item_id)));
        setRemoteProgressLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Migrates anonymous progress into the account the first time a session
  // appears — never overwrites an existing remote profile with a guest
  // guess (first real choice wins), but always unions completed-item ids
  // into remote rather than requiring an exact match, the same "merge,
  // never clobber" approach saved_opportunities already uses in
  // OpportunitiesExplorer. Waits for both remote reads to resolve so it
  // never mistakes "not loaded yet" for "genuinely empty" and upserts over
  // real data.
  const userId = session?.user?.id;
  const migratedRef = useRef(false);
  useEffect(() => {
    if (!supabase || !userId) return;
    if (remoteProfile === undefined || !remoteProgressLoaded) return;
    if (migratedRef.current) return;
    migratedRef.current = true;

    const hasLocalData = localProfile || localCompletedIds.size > 0;
    if (!hasLocalData) return;

    (async () => {
      if (!remoteProfile && localProfile) {
        const { error } = await supabase.from('user_checklist_profile').upsert({
          user_id: userId,
          role_type: localProfile.role_type,
          access_level: localProfile.access_level,
          updated_at: new Date().toISOString()
        });
        if (!error) setRemoteProfile(localProfile);
      }

      if (localCompletedIds.size > 0) {
        const missing = [...localCompletedIds].filter((id) => !remoteCompletedIds.has(id));
        if (missing.length > 0) {
          const { error } = await supabase
            .from('user_checklist_progress')
            .upsert(missing.map((item_id) => ({ user_id: userId, item_id })), {
              onConflict: 'user_id,item_id'
            });
          if (!error) {
            setRemoteCompletedIds((prev) => new Set([...prev, ...missing]));
          }
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, remoteProfile, remoteProgressLoaded]);

  const isAnonymous = !session;

  // Native browser prompt on hard navigation (tab close, reload, typed
  // URL) while there's anonymous progress that's never been backed up to
  // an account. In-app navigation can't be blocked the same way without a
  // data router (this app uses plain BrowserRouter — see main.jsx —
  // useBlocker/unstable_usePrompt need a data router to work), so the
  // dismissible SignupPrompt banner below covers that case instead: it's
  // visible on the page the whole time there's unsynced progress, not just
  // at the moment of leaving.
  useEffect(() => {
    if (!isAnonymous || localCompletedIds.size === 0) return;
    function handleBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAnonymous, localCompletedIds]);

  function handleToggle(itemId) {
    if (isAnonymous) {
      const next = new Set(localCompletedIds);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      setLocalCompletedIds(next);
      return;
    }

    const isDone = remoteCompletedIds.has(itemId);
    const next = new Set(remoteCompletedIds);
    if (isDone) next.delete(itemId);
    else next.add(itemId);
    setRemoteCompletedIds(next);

    const write = isDone
      ? supabase.from('user_checklist_progress').delete().match({ user_id: userId, item_id: itemId })
      : supabase.from('user_checklist_progress').insert({ user_id: userId, item_id: itemId });

    write.then(({ error }) => {
      if (error) {
        setProgressError(error.message);
        setRemoteCompletedIds(remoteCompletedIds); // revert
      }
    });
  }

  function handleProfileSaved(profile) {
    if (isAnonymous) {
      setLocalProfile(profile);
      setEditingProfile(false);
      return;
    }
    setRemoteProfile(profile);
    setEditingProfile(false);
  }

  function dismissPrompt() {
    setPromptDismissed(true);
    try {
      sessionStorage.setItem(PROMPT_DISMISSED_KEY, '1');
    } catch {
      // ignore — worst case the prompt reappears on the next render
    }
  }

  if (!supabase) {
    return <p className="checklist-error" role="alert">Supabase isn't configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>;
  }

  if (authLoading) return <p className="checklist-loading" role="status">Loading…</p>;

  const showSignupPrompt = isAnonymous && !promptDismissed && (localProfile || localCompletedIds.size > 0);

  if (isAnonymous) {
    return (
      <>
        {showSignupPrompt && (
          <SignupPrompt completedCount={localCompletedIds.size} onDismiss={dismissPrompt} />
        )}
        {!localProfile || editingProfile ? (
          <ProfileSetup anonymous initial={localProfile} onSaved={handleProfileSaved} />
        ) : itemsError ? (
          <p className="checklist-error" role="alert">{itemsError}</p>
        ) : items === null ? (
          <p className="checklist-loading" role="status">Loading checklist…</p>
        ) : (
          <ChecklistView
            items={items}
            profile={localProfile}
            completedIds={localCompletedIds}
            onToggle={handleToggle}
            onEditProfile={() => setEditingProfile(true)}
          />
        )}
      </>
    );
  }

  if (remoteProfile === undefined) return <p className="checklist-loading" role="status">Loading…</p>;

  if (!remoteProfile || editingProfile) {
    return <ProfileSetup initial={remoteProfile} onSaved={handleProfileSaved} />;
  }

  if (progressError) return <p className="checklist-error" role="alert">{progressError}</p>;
  if (itemsError) return <p className="checklist-error" role="alert">{itemsError}</p>;
  if (items === null || !remoteProgressLoaded) return <p className="checklist-loading" role="status">Loading checklist…</p>;

  return (
    <ChecklistView
      items={items}
      profile={remoteProfile}
      completedIds={remoteCompletedIds}
      onToggle={handleToggle}
      onEditProfile={() => setEditingProfile(true)}
    />
  );
}
