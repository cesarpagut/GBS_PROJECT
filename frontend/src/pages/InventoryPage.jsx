import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import AddEquipoModal from '../components/AddEquipoModal';
import BulkUploadModal from '../components/BulkUploadModal';
import MultiSelectFilter from '../components/MultiSelectFilter';

function InventoryPage() {
  const [allEquipos, setAllEquipos] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    nombre_equipo: [],
    modelo: [],
    marca: [],
    area_servicio: [],
    clasificacion_uso: [],
    clasificacion_riesgo: [],
  });
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [equipoToEdit, setEquipoToEdit] = useState(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  
  const navigate = useNavigate();

  const fetchAllEquipos = async () => {
      try {
        const response = await apiClient.get('/inventory/equipos/');
        setAllEquipos(response.data);
      } catch (err) {
        console.error("Error fetching all equipment for filters:", err);
      }
  };

  useEffect(() => {
    fetchAllEquipos();
  }, []);

  const fetchFilteredEquipos = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      for (const key in filters) {
        filters[key].forEach(value => {
          params.append(key, value);
        });
      }
      const response = await apiClient.get('/inventory/equipos/', { params });
      setEquipos(response.data);
      setError('');
    } catch (err) {
      setError('No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredEquipos();
    }, 500);
    return () => clearTimeout(timer);
  }, [filters, searchTerm, fetchFilteredEquipos]);

  const handleFilterChange = (filterName, selectedOptions) => {
    setFilters(prev => ({ ...prev, [filterName]: selectedOptions }));
  };

  const clearFilters = () => {
    setFilters({
      nombre_equipo: [],
      modelo: [],
      marca: [],
      area_servicio: [],
      clasificacion_uso: [],
      clasificacion_riesgo: [],
    });
    setSearchTerm('');
  };
  
  const removeFilterTag = (filterName, valueToRemove) => {
      setFilters(prev => ({
          ...prev,
          [filterName]: prev[filterName].filter(value => value !== valueToRemove)
      }));
  };

  const filterOptions = useMemo(() => {
    const nombres = [...new Set(allEquipos.map(e => e.nombre_equipo).filter(Boolean))];
    const modelos = [...new Set(allEquipos.map(e => e.modelo).filter(Boolean))];
    const marcas = [...new Set(allEquipos.map(e => e.marca).filter(Boolean))];
    const areas = [...new Set(allEquipos.map(e => e.area_servicio).filter(Boolean))];
    const usos = [...new Set(allEquipos.map(e => e.clasificacion_uso).filter(Boolean))];
    const riesgos = [...new Set(allEquipos.map(e => e.clasificacion_riesgo).filter(Boolean))];
    return { nombres, modelos, marcas, areas, usos, riesgos };
  }, [allEquipos]);

  const handleOpenAddModal = () => { setEquipoToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (equipo) => { setEquipoToEdit(equipo); setIsModalOpen(true); };
  const handleDelete = async (equipoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
      try {
        await apiClient.delete(`/inventory/equipos/${equipoId}/`);
        alert('Equipo eliminado con éxito.');
        fetchFilteredEquipos();
        fetchAllEquipos();
      } catch (err) {
        alert('No se pudo eliminar el equipo.');
      }
    }
  };
  
  const handleSuccess = () => {
      fetchFilteredEquipos();
      fetchAllEquipos();
  }

  const handleExport = async () => { /* ... (código de exportación) ... */ };
  
  const handleRowClick = (equipoId) => {
    navigate(`/inventory/${equipoId}`);
  };

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <h2>Inventario de Equipos Biomédicos</h2>
        <div className="header-actions">
          <button onClick={() => setIsBulkModalOpen(true)} className="button-secondary">Carga Masiva</button>
          <button onClick={handleOpenAddModal} className="add-button">+ Añadir Equipo</button>
        </div>
      </div>

      <div className="search-and-filters-container">
        <input
          type="text"
          placeholder="Búsqueda general..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-bar"
        />
        <div className="main-actions">
            <button onClick={handleExport} className="button-secondary">Exportar a Excel</button>
            <button onClick={clearFilters} className="button-delete">Limpiar Filtros</button>
        </div>
      </div>
      
      <div className="filters-bar">
        <MultiSelectFilter options={filterOptions.nombres} selected={filters.nombre_equipo} onChange={(s) => handleFilterChange('nombre_equipo', s)} title="Nombre Equipo" />
        <MultiSelectFilter options={filterOptions.modelos} selected={filters.modelo} onChange={(s) => handleFilterChange('modelo', s)} title="Modelo" />
        <MultiSelectFilter options={filterOptions.marcas} selected={filters.marca} onChange={(s) => handleFilterChange('marca', s)} title="Marca" />
        <MultiSelectFilter options={filterOptions.areas} selected={filters.area_servicio} onChange={(s) => handleFilterChange('area_servicio', s)} title="Área/Servicio" />
        <MultiSelectFilter options={filterOptions.usos} selected={filters.clasificacion_uso} onChange={(s) => handleFilterChange('clasificacion_uso', s)} title="Clas. Uso" />
        <MultiSelectFilter options={filterOptions.riesgos} selected={filters.clasificacion_riesgo} onChange={(s) => handleFilterChange('clasificacion_riesgo', s)} title="Clas. Riesgo" />
      </div>

      <div className="active-filters-container">
        {Object.entries(filters).flatMap(([key, values]) => 
            values.map(value => (
                <div key={`${key}-${value}`} className="filter-tag">
                    {value}
                    <button onClick={() => removeFilterTag(key, value)}>&times;</button>
                </div>
            ))
        )}
      </div>

      {isModalOpen && <AddEquipoModal onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} equipoToEdit={equipoToEdit} />}
      {isBulkModalOpen && <BulkUploadModal onClose={() => setIsBulkModalOpen(false)} onSuccess={handleSuccess} />}

      {loading && <p>Cargando inventario...</p>}
      {error && <p className="error-message">{error}</p>}
      
      {!loading && !error && (
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Hoja de Vida ID</th>
                <th>Nombre del Equipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Serie</th>
                <th>Área/Servicio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {equipos.length > 0 ? (
                equipos.map(equipo => (
                  <tr key={equipo.id} onClick={() => handleRowClick(equipo.id)} className="clickable-row">
                    <td>
                      <div className="equipo-name-cell">
                        <span className={`status-dot ${equipo.is_complete ? 'status-green' : 'status-yellow'}`} title={equipo.is_complete ? 'Hoja de vida completa' : 'Hoja de vida incompleta'}></span>
                        {equipo.hoja_vida_id}
                      </div>
                    </td>
                    <td>{equipo.nombre_equipo}</td>
                    <td>{equipo.marca}</td>
                    <td>{equipo.modelo}</td>
                    <td>{equipo.serie}</td>
                    <td>{equipo.area_servicio}</td>
                    <td>
                      <div className="action-buttons">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(equipo); }} className="button-edit">Editar</button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(equipo.id); }} className="button-delete">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No se encontraron equipos con los criterios de búsqueda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
