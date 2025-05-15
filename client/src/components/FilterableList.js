import "./FilterableList.css";

function FilterableList({ filters, items, renderItem }) {
  const filterElements = filters.map((filter, index) => {
    const { label, options, value, onChange, id: filterId } = filter;
    const key = filterId || label || `filter-${index}`;
    const selectId = `filter-select-${key}`;

    return (
      <div key={key} className="filter-control">
        {/* Using htmlFor for better accessibility */}
        <label htmlFor={selectId} className="filter-label">{label}</label>
        <select id={selectId} value={value} onChange={onChange}>
          <option value="">All</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  });

  const itemElements = items.map(item => (
    <div key={item.id} className="filterable-item">
      {renderItem(item)}
    </div>
  ));

  return (
    <div className="filterable-container">
      {filters && filters.length > 0 && (
        <div className="filter-controls">
          {filterElements}
        </div>
      )}

      <div className="filterable-list">
        {items && items.length > 0 ? (
          itemElements
        ) : (
          <p className="filterable-list-empty">No items to display.</p>
        )}
      </div>
    </div>
  );
}

export default FilterableList;