import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

// Shared by TypeGuardedOnboarding (both onboarding routes) and
// MissionaryDashboard (Step 9) — same magic-link mechanism as
// Checklist.jsx's own SignInForm, just redirecting back to whatever route
// asked for it instead of always the checklist.
export default function MagicLinkSignIn({ redirectPath }) {
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
