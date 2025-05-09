import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * NavSelect: renders a labeled <select> for navigation.
 *
 * Props:
 *   - label: string (display label for the dropdown)
 *   - options: Array<{ value: any, label: string }>
 *   - toPrefix: string (path prefix to navigate to, e.g. '/games')
 */
export default function NavSelect({ label, options, toPrefix }) {
  // State for the current selection
  const [selected, setSelected] = useState('');
  const navigate = useNavigate();

  // Handle when user selects a new option
  const handleChange = (e) => {
    const value = e.target.value;
    setSelected(''); // Reset selection after navigating
    if (value) {
      navigate(`${toPrefix}/${value}`);
    }
  };

  // Render labeled select dropdown for navigation
  return (
    <span className="nav-select">
      <label className="nav-select-label">{label}</label>
      <select value={selected} onChange={handleChange}>
        <option value="">Select {label}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </span>
  );
}