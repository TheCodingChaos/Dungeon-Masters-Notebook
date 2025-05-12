import "./FilterableList.css";

/**
 * A generic list component with filter dropdowns and a list of items.
 *
 * Props:
 *   - filters: Array of filter objects with label, options, value, onChange
 *   - items: Array of data to render
 *   - renderItem: Function to render each item
 */
function FilterableList({ filters, items, renderItem }) {
  // Precompute filterElements and itemElements using for-loops
  const filterElements = [];
  for (let i = 0; i < filters.length; i++) {
    const { label, options, value, onChange } = filters[i];
    filterElements.push(
      <div key={label} className="filter-control">
        <label className="filter-label">{label}</label>
        <select value={value} onChange={onChange}>
          <option value="">All</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  const itemElements = [];
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    itemElements.push(
      <div key={item.id} className="filterable-item">
        {renderItem(item)}
      </div>
    );
  }

  return (
    <div className="filterable-container">
      {/* Filter controls section */}
      <div className="filter-controls">
        {filterElements}
      </div>

      {/* Filtered results */}
      <div className="filterable-list">
        {itemElements}
      </div>
    </div>
  );
}

export default FilterableList;