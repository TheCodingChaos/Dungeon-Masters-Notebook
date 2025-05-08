

import React from 'react';

/**
 * A generic list wrapper that displays multiple filter controls and a list of items.
 *
 * Props:
 *   - filters: Array of { label: string, options: { value, label }[], value, onChange }
 *   - items: Array of data items to render
 *   - renderItem: Function(item) => JSX element for each item
 *
 * Example usage:
 *   <FilterableList
 *     filters={[
 *       { label: 'Filter by Game', options: gameOptions, value: filterGameId, onChange: e => setFilterGameId(e.target.value) },
 *       { label: 'Filter by Player', options: playerOptions, value: filterPlayerId, onChange: e => setFilterPlayerId(e.target.value) }
 *     ]}
 *     items={filteredCharacters}
 *     renderItem={c => <CharacterCard key={c.id} character={c} />}
 *   />
 * }
 */
function FilterableList({ filters, items, renderItem }) {
  return (
    <>
      <div className="filter-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
        {filters.map(({ label, options, value, onChange }, idx) => (
          <div key={idx} className="filter-control">
            <label style={{ marginRight: '0.5rem' }}>{label}</label>
            <select value={value} onChange={onChange}>
              <option value="">All</option>
              {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="filterable-list">
        {items.map(item => renderItem(item))}
      </div>
    </>
  );
}

export default FilterableList;