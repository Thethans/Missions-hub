import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CountryCombobox from './CountryCombobox.jsx';

const COUNTRIES = [
  { name: 'Chad', coordinates: [1, 1] },
  { name: 'Chile', coordinates: [2, 2] },
  { name: 'Sudan', coordinates: [3, 3] }
];

describe('CountryCombobox', () => {
  it('exposes the ARIA combobox contract', async () => {
    render(<CountryCombobox countries={COUNTRIES} onSelectCountry={vi.fn()} />);
    const combobox = screen.getByRole('combobox', { name: /explore by country/i });
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(combobox).toHaveAttribute('aria-autocomplete', 'list');

    await userEvent.click(combobox);
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
    expect(combobox).toHaveAttribute('aria-controls', screen.getByRole('listbox').id);
  });

  it('filters options as the user types', async () => {
    render(<CountryCombobox countries={COUNTRIES} onSelectCountry={vi.fn()} />);
    const combobox = screen.getByRole('combobox', { name: /explore by country/i });

    await userEvent.type(combobox, 'ch');
    expect(screen.getByRole('option', { name: 'Chad' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Chile' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Sudan' })).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    render(<CountryCombobox countries={COUNTRIES} onSelectCountry={vi.fn()} />);
    await userEvent.type(screen.getByRole('combobox'), 'zzz');
    expect(screen.getByText(/no countries match/i)).toBeInTheDocument();
  });

  it('moves aria-activedescendant with the arrow keys and selects on Enter', async () => {
    const onSelectCountry = vi.fn();
    render(<CountryCombobox countries={COUNTRIES} onSelectCountry={onSelectCountry} />);
    const combobox = screen.getByRole('combobox');

    await userEvent.type(combobox, 'ch');
    await userEvent.keyboard('{ArrowDown}');
    const firstOption = screen.getByRole('option', { name: 'Chad' });
    expect(combobox).toHaveAttribute('aria-activedescendant', firstOption.id);

    await userEvent.keyboard('{ArrowDown}');
    const secondOption = screen.getByRole('option', { name: 'Chile' });
    expect(combobox).toHaveAttribute('aria-activedescendant', secondOption.id);

    await userEvent.keyboard('{Enter}');
    expect(onSelectCountry).toHaveBeenCalledWith([2, 2]);
    expect(combobox).toHaveValue('');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes without selecting on Escape', async () => {
    const onSelectCountry = vi.fn();
    render(<CountryCombobox countries={COUNTRIES} onSelectCountry={onSelectCountry} />);
    const combobox = screen.getByRole('combobox');

    await userEvent.click(combobox);
    await userEvent.keyboard('{Escape}');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
    expect(onSelectCountry).not.toHaveBeenCalled();
  });

  it('selects an option on click', async () => {
    const onSelectCountry = vi.fn();
    render(<CountryCombobox countries={COUNTRIES} onSelectCountry={onSelectCountry} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Sudan' }));
    expect(onSelectCountry).toHaveBeenCalledWith([3, 3]);
  });
});
