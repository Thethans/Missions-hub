import { useState } from 'react';
import { firstName } from '../data/format';

interface NewsletterSignupProps {
  /** Missionary's display name; used to personalize the heading. */
  missionaryName: string;
}

/**
 * MOCK newsletter signup. Validates the email format and shows a confirmation.
 * Nothing is stored or sent.
 * TODO(real): POST to the email tool (Mailchimp / ConvertKit / Planning Center).
 */
export default function NewsletterSignup({ missionaryName }: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    // Minimal client-side format check — same intent as the reference.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setSubscribed(true);
  };

  return (
    <>
      <h3 className="pm-sec-label pm-sec-label--spaced">Stay Connected</h3>
      <div className="pm-news">
        {subscribed ? (
          <div className="pm-news__done">✓ You’re subscribed! Look for the next update in your inbox.</div>
        ) : (
          <>
            <div className="pm-news__title">Get {firstName(missionaryName)}’s newsletter</div>
            <p className="pm-news__sub">Personal updates and prayer letters sent straight to your inbox.</p>
            <form className="pm-news__row" onSubmit={submit} noValidate>
              <input
                className="pm-news__input"
                type="email"
                inputMode="email"
                placeholder="you@email.com"
                aria-label="Email address"
                aria-invalid={error ? true : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="pm-news__btn">
                Sign Up
              </button>
            </form>
            {error && (
              <p className="pm-news__error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
