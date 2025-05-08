

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * NavSelect: renders a labeled <select> for navigation.
 * Props:
 *   - label: string (display label for the dropdown)
 *   - options: Array<{ value: any, label: string }>
 *   - toPrefix: string (path prefix to navigate to, e.g. '/games')
 */
export default function NavSelect({ label, options, toPrefix }) {
  const [selected, setSelected] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.value;
    // reset selection
    setSelected('');
    if (value) {
      navigate(`${toPrefix}/${value}`);
    }
  };

  return (
    <span style={{ margin: '0 1rem', display: 'inline-block' }}>
      <label style={{ marginRight: '0.5rem' }}>{label}</label>
      <select value={selected} onChange={handleChange}>
        <option value="">Select {label}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </span>
  );
}