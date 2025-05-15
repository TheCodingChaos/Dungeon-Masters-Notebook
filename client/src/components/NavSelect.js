import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NavSelect({ label, options, toPrefix }) {
  // State for the current selection
  const [selected, setSelected] = useState('');
  const navigate = useNavigate();
  // Generate a unique id for the select
  const selectId = `nav-select-${label.toLowerCase().replace(/\s+/g, '-')}`;

  // Default option element
  const defaultOption = <option value="">{`Select ${label}`}</option>;

  // Generate option elements from props
  const optionElements = options.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ));

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
      <label htmlFor={selectId} className="nav-select-label">{label}</label>
      <select
        id={selectId}
        className="nav-select-dropdown"
        value={selected}
        onChange={handleChange}
      >
        {defaultOption}
        {optionElements}
      </select>
    </span>
  );
}