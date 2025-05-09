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
  // Render dropdowns for each filter
  const renderFilters = () => {
    return filters.map((filter, index) => {
      const { label, options, value, onChange } = filter;

      return (
        <div key={index} className="filter-control">
          <label className="filter-label">{label}</label>
          <select value={value} onChange={onChange}>
            <option value="">All</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      );
    });
  };

  // Render all items using provided render function
  const renderItems = () => {
    return items.map((item, idx) => (
      <div key={idx} className="filterable-item">
        {renderItem(item)}
      </div>
    ));
  };

  return (
    <div className="filterable-container">
      {/* Filter controls section */}
      <div className="filter-controls">
        {renderFilters()}
      </div>

      {/* Filtered results */}
      <div className="filterable-list">
        {renderItems()}
      </div>
    </div>
  );
}

export default FilterableList;