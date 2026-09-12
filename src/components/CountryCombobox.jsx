import React, { useEffect, useId, useRef, useState } from 'react';

const MAX_VISIBLE_RESULTS = 50;

// Hand-rolled WAI-ARIA 1.2 combobox (role="combobox" + role="listbox"), not
// a native <select> — with 200+ countries in the list, native <select>
// forces every keyboard/screen-reader user to scroll a single long popup
// with no way to type-to-filter (typeahead only jumps to the next option
// starting with the typed letter, not a substring match). Same hand-rolled
// approach as MapAccessibleSearch.jsx (plain elements + explicit ARIA, no
// added dependency) rather than a second, inconsistent pattern.
export default function CountryCombobox({ countries, onSelectCountry }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const listboxId = useId();
  const labelId = useId();

  const results = query.trim()
    ? countries.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, MAX_VISIBLE_RESULTS)
    : countries.slice(0, MAX_VISIBLE_RESULTS);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, open]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`#${CSS.escape(`${listboxId}-option-${activeIndex}`)}`);
    el?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, listboxId]);

  function optionId(index) {
    return `${listboxId}-option-${index}`;
  }

  function selectCountry(country) {
    onSelectCountry(country.coordinates);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        selectCountry(results[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
        setActiveIndex(-1);
      }
    } else if (e.key === 'Home' && open) {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End' && open) {
      e.preventDefault();
      setActiveIndex(results.length - 1);
    }
  }

  return (
    <div className="landing-map-country-select">
      <span id={labelId} className="visually-hidden">Explore by country</span>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-labelledby={labelId}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        placeholder="Explore by country"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
      />
      {open && (
        // onMouseDown (not onClick) on the listbox keeps the input's onBlur
        // from closing the list and unmounting the option before its click
        // fires — mousedown runs first and re-focuses the input.
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={labelId}
          className="landing-map-country-listbox"
          ref={listRef}
          onMouseDown={(e) => e.preventDefault()}
        >
          {results.length === 0 ? (
            <li className="landing-map-country-empty" role="presentation">No countries match “{query}”.</li>
          ) : (
            results.map((c, i) => (
              // Per the ARIA 1.2 combobox pattern, focus stays on the <input> the whole
              // time (see aria-activedescendant above) — these <li role="option">
              // elements are never themselves focusable, so a keydown handler here
              // would never fire. Keyboard selection is handled entirely by the
              // input's onKeyDown (Enter); onClick here only serves mouse/touch users.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={c.name}
                id={optionId(i)}
                role="option"
                aria-selected={i === activeIndex}
                className={`landing-map-country-option${i === activeIndex ? ' landing-map-country-option--active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => selectCountry(c)}
              >
                {c.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
