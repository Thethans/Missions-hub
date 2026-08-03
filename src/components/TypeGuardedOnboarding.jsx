import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import useSupabaseSession from '../hooks/useSupabaseSession.js';
import useAccountProfileType from '../hooks/useAccountProfileType.js';

const TYPE_LABEL = { missionary: 'missionary', church: 'church' };
const ONBOARDING_PATH = { missionary: '/missionary-support/onboarding', church: '/for-churches/onboarding' };

function MagicLinkSignIn({ redirectPath }) {
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
      options: { emailRedirectTo: window.location.origin + redirectPath }
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
      <div className="onboarding-auth">
        <p>Check your email — we sent a sign-in link to <strong>{email}</strong>.</p>
      </div>
    );
  }

  return (
    <form className="onboarding-auth" onSubmit={handleSubmit}>
      <h2>Sign in to continue</h2>
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
      {error && <p className="onboarding-error" role="alert">{error}</p>}
    </form>
  );
}

// Shared by both onboarding routes (/missionary-support/onboarding and
// /for-churches/onboarding). Which route you land on IS the type choice —
// there's no separate type-picker UI. This component only handles sign-in
// and routes around the two states that can't proceed: no session yet, or
// a session that already has the *other* profile type (blocked by the
// prevent_dual_profile_type trigger in supabase/schema.sql regardless, but
// surfacing it here avoids a failed insert as the first thing they hit).
// The actual profile form for `expectedType` is a later build step — for
// now this renders a placeholder once a user is clear to proceed.
export default function TypeGuardedOnboarding({ expectedType, children }) {
  const { session, loading: sessionLoading } = useSupabaseSession();
  const profileType = useAccountProfileType(session);

  if (!supabase) {
    return (
      <p className="onboarding-error" role="alert">
        Sign-in isn't available right now — please try again later.
      </p>
    );
  }

  if (sessionLoading) {
    return <p className="onboarding-loading" role="status">Loading…</p>;
  }

  if (!session) {
    return <MagicLinkSignIn redirectPath={ONBOARDING_PATH[expectedType]} />;
  }

  if (profileType === undefined) {
    return <p className="onboarding-loading" role="status">Checking your account…</p>;
  }

  if (profileType && profileType !== expectedType) {
    return (
      <div className="onboarding-auth">
        <p role="alert">
          This account already has a {TYPE_LABEL[profileType]} profile, so it can't also create a{' '}
          {TYPE_LABEL[expectedType]} profile.
        </p>
        <Link to={ONBOARDING_PATH[profileType]}>
          Go to your {TYPE_LABEL[profileType]} onboarding
        </Link>
      </div>
    );
  }

  if (profileType === expectedType) {
    return (
      <div className="onboarding-auth">
        <p>You already have a {TYPE_LABEL[expectedType]} profile submitted.</p>
      </div>
    );
  }

  // profileType === null: signed in, no profile of either type yet — clear
  // to fill out the expectedType form (not built yet).
  return children;
}
