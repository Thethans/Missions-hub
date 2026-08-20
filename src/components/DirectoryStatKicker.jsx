import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

// A real count from the DB, not a fabricated number — renders nothing while
// loading or if there's nothing to show yet, per this repo's rule that
// social-proof numbers only render when backed by a real data source.
// `label` is passed already pluralized (e.g. "approved churches") since a
// singular/plural transform is more failure-prone than just asking the
// caller for the plural form up front.
export default function DirectoryStatKicker({ table, label }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .then(({ count: c }) => {
        if (!cancelled) setCount(c);
      });
    return () => {
      cancelled = true;
    };
  }, [table]);

  if (!count) return null;

  return <p className="page-hero-stat">{count} {label}</p>;
}
