

import React from 'react';

/**
 * A reusable dropdown filter.
 *
 * Props:
 * - label: string label to display before the dropdown
 * - options: array of { value, label } objects
 * - value: currently selected value
 * - onChange: function to call with new value
 * - includeAllOption: whether to show an "All" option (default true)
 * - allOptionLabel: label for the "All" option (default "All")
 */
export default function Filter({
  label,
  options,
  value,
  onChange,
  includeAllOption = true,
  allOptionLabel = 'All'
}) {
  return (
    <label>
      {label}{' '}
      <select value={value} onChange={e => onChange(e.target.value)}>
        {includeAllOption && <option value="">{allOptionLabel}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}