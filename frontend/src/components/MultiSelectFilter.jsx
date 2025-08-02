import React, { useState, useEffect, useRef } from 'react';

function MultiSelectFilter({ options, selected, onChange, title }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Hook para cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSelect = (option) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="multiselect-filter" ref={wrapperRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="filter-button">
        {title} {selected.length > 0 && `(${selected.length})`}
      </button>
      {isOpen && (
        <div className="multiselect-dropdown">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dropdown-search"
          />
          <div className="options-list">
            {filteredOptions.map(option => (
              <label key={option} className="option-item">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => handleSelect(option)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiSelectFilter;