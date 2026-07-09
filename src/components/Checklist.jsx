import React, { useEffect, useMemo, useState } from 'react';
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
      {error && <p className="checklist-error">{error}</p>}
    </form>
  );
}

function ProfileSetup({ initial, onSaved }) {
  const [roleType, setRoleType] = useState(initial?.role_type || '');
  const [accessLevel, setAccessLevel] = useState(initial?.access_level || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
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
      <label>
        Role type
        <select value={roleType} onChange={(e) => setRoleType(e.target.value)} required>
          <option value="" disabled>Select a role…</option>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <label>
        Destination access-level
        <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} required>
          <option value="" disabled>Select an access level…</option>
          {ACCESS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Continue'}</button>
      {error && <p className="checklist-error">{error}</p>}
    </form>
  );
}

function ChecklistView({ userId, profile, onEditProfile }) {
  const [items, setItems] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [openCategories, setOpenCategories] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [itemsRes, progressRes] = await Promise.all([
        supabase.from('checklist_items').select('*').order('sort_order'),
        supabase.from('user_checklist_progress').select('item_id').eq('user_id', userId)
      ]);
      if (cancelled) return;
      if (itemsRes.error) {
        setError(itemsRes.error.message);
        return;
      }
      setItems(itemsRes.data);
      setCompletedIds(new Set((progressRes.data || []).map((r) => r.item_id)));
      setOpenCategories(new Set([...(new Set(itemsRes.data.map((i) => i.category)))].slice(0, 1)));
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const visibleItems = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => matchesProfile(item, profile));
  }, [items, profile]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of visibleItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return map;
  }, [visibleItems]);

  async function toggleItem(itemId) {
    const isDone = completedIds.has(itemId);
    const next = new Set(completedIds);
    if (isDone) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setCompletedIds(next);

    const { error: toggleError } = isDone
      ? await supabase.from('user_checklist_progress').delete().match({ user_id: userId, item_id: itemId })
      : await supabase.from('user_checklist_progress').insert({ user_id: userId, item_id: itemId });

    if (toggleError) {
      setError(toggleError.message);
      setCompletedIds(completedIds); // revert
    }
  }

  function toggleCategory(category) {
    const next = new Set(openCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setOpenCategories(next);
  }

  if (error) return <p className="checklist-error">{error}</p>;
  if (!items) return <p className="checklist-loading">Loading checklist…</p>;

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
                        onChange={() => toggleItem(item.id)}
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
  const [authLoading, setAuthLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(undefined); // undefined = not yet loaded, null = no profile
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
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
    if (!session) {
      setProfile(undefined);
      return;
    }
    let cancelled = false;
    supabase
      .from('user_checklist_profile')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfile(data);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (!supabase) {
    return <p className="checklist-error">Supabase isn't configured — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.</p>;
  }

  if (authLoading) return <p className="checklist-loading">Loading…</p>;
  if (!session) return <SignInForm />;
  if (profile === undefined) return <p className="checklist-loading">Loading…</p>;

  if (!profile || editingProfile) {
    return (
      <ProfileSetup
        initial={profile}
        onSaved={(p) => {
          setProfile(p);
          setEditingProfile(false);
        }}
      />
    );
  }

  return <ChecklistView userId={session.user.id} profile={profile} onEditProfile={() => setEditingProfile(true)} />;
}
