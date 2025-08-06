import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import AuthContext from '../context/AuthContext';
import AddEquipoModal from '../components/AddEquipoModal';
import BulkUploadModal from '../components/BulkUploadModal';
import MultiSelectFilter from '../components/MultiSelectFilter';

function InventoryPage() {
    const { user } = useContext(AuthContext);
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [allEquiposOptions, setAllEquiposOptions] = useState([]);
    const [clinicas, setClinicas] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState({
        nombre_equipo: [], 
        modelo: [], 
        marca: [], 
        area_servicio: [],
        clasificacion_uso: [], 
        clasificacion_riesgo: [], 
        requiere_calibracion: '',
        ubicacion: [],
        clinica_id: '',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [equipoToEdit, setEquipoToEdit] = useState(null);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            
            for (const key in activeFilters) {
                if (Array.isArray(activeFilters[key])) {
                    activeFilters[key].forEach(value => params.append(key, value));
                } else if (activeFilters[key]) {
                     params.append(key, activeFilters[key]);
                }
            }

            const response = await apiClient.get('/equipos/', { params });
            setEquipos(response.data);
            setError('');
        } catch (err) {
            setError('No se pudo cargar el inventario.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, activeFilters]);

    useEffect(() => {
        const timer = setTimeout(() => { fetchData(); }, 500);
        return () => clearTimeout(timer);
    }, [fetchData]);

    useEffect(() => {
        apiClient.get('/equipos/').then(response => setAllEquiposOptions(response.data));
        if (user?.is_superuser) {
            apiClient.get('/clinicas/').then(response => setClinicas(response.data));
        }
    }, [user]);

    const handleFilterChange = (filterName, selectedOptions) => {
        setActiveFilters(prev => ({ ...prev, [filterName]: selectedOptions }));
    };
    
    const handleSingleFilterChange = (filterName, value) => {
        setActiveFilters(prev => ({ ...prev, [filterName]: value }));
    };

    const clearFilters = () => {
        setActiveFilters({
            nombre_equipo: [], modelo: [], marca: [], area_servicio: [],
            clasificacion_uso: [], clasificacion_riesgo: [], requiere_calibracion: '', 
            ubicacion: [], clinica_id: '',
        });
        setSearchTerm('');
    };
    
    const removeFilterTag = (filterName, valueToRemove) => {
        setActiveFilters(prev => ({ ...prev, [filterName]: prev[filterName].filter(value => value !== valueToRemove) }));
    };

    const filterOptions = useMemo(() => {
        const uniqueValues = (key) => [...new Set(allEquiposOptions.map(e => e[key]).filter(Boolean))];
        return {
            nombres: uniqueValues('nombre_equipo'), 
            modelos: uniqueValues('modelo'), 
            marcas: uniqueValues('marca'),
            areas: uniqueValues('area_servicio'), 
            usos: uniqueValues('clasificacion_uso_display'), 
            riesgos: uniqueValues('clasificacion_riesgo'),
            ubicaciones: uniqueValues('ubicacion'),
        };
    }, [allEquiposOptions]);

    const handleOpenAddModal = () => { setEquipoToEdit(null); setIsModalOpen(true); };
    const handleOpenEditModal = (equipo) => { setEquipoToEdit(equipo); setIsModalOpen(true); };
    
    const handleDelete = async (equipoId) => {
        if (window.confirm('¿Estás seguro?')) {
            try {
                await apiClient.delete(`/equipos/${equipoId}/`);
                alert('Equipo eliminado.');
                fetchData();
            } catch (err) {
                alert('No se pudo eliminar.');
            }
        }
    };
    
    const handleSuccess = () => {
        fetchData();
        apiClient.get('/equipos/').then(response => setAllEquiposOptions(response.data));
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            for (const key in activeFilters) {
                 if (Array.isArray(activeFilters[key])) {
                    activeFilters[key].forEach(value => params.append(key, value));
                } else if (activeFilters[key]) {
                     params.append(key, activeFilters[key]);
                }
            }
            const response = await apiClient.get('/equipos/export_to_excel/', { params, responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'inventario_equipos.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error al exportar:', error);
            alert('No se pudo generar el archivo.');
        }
    };
    
    const handleRowClick = (equipoId) => navigate(`/inventory/${equipoId}`);

    const getTargetClinicId = () => {
        if (user?.is_superuser) {
            return activeFilters.clinica_id || '';
        }
        return user?.clinica?.id || '';
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
                <input type="text" placeholder="Búsqueda general..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-bar" />
                <div className="main-actions">
                    <button onClick={handleExport} className="button-secondary">Exportar a Excel</button>
                    <button onClick={clearFilters} className="button-delete">Limpiar Filtros</button>
                </div>
            </div>
            
            <div className="filters-bar">
                {user?.is_superuser && (
                    <div className="multiselect-filter">
                        <select className="filter-button" value={activeFilters.clinica_id} onChange={(e) => handleSingleFilterChange('clinica_id', e.target.value)}>
                            <option value="">Todas las Clínicas</option>
                            {clinicas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>
                )}
                <MultiSelectFilter options={filterOptions.nombres} selected={activeFilters.nombre_equipo} onChange={(s) => handleFilterChange('nombre_equipo', s)} title="Nombre Equipo" />
                <MultiSelectFilter options={filterOptions.modelos} selected={activeFilters.modelo} onChange={(s) => handleFilterChange('modelo', s)} title="Modelo" />
                <MultiSelectFilter options={filterOptions.marcas} selected={activeFilters.marca} onChange={(s) => handleFilterChange('marca', s)} title="Marca" />
                <MultiSelectFilter options={filterOptions.ubicaciones} selected={activeFilters.ubicacion} onChange={(s) => handleFilterChange('ubicacion', s)} title="Ubicación" />
                <MultiSelectFilter options={filterOptions.areas} selected={activeFilters.area_servicio} onChange={(s) => handleFilterChange('area_servicio', s)} title="Área/Servicio" />
                <div className="multiselect-filter">
                    <select className="filter-button" value={activeFilters.requiere_calibracion} onChange={(e) => handleSingleFilterChange('requiere_calibracion', e.target.value)}>
                        <option value="">Calibración (Todos)</option>
                        <option value="true">Sí</option>
                        <option value="false">No</option>
                    </select>
                </div>
            </div>

            <div className="active-filters-container">
                {Object.entries(activeFilters).flatMap(([key, values]) => Array.isArray(values) ? values.map(value => (<div key={`${key}-${value}`} className="filter-tag">{value}<button onClick={() => removeFilterTag(key, value)}>&times;</button></div>)) : null)}
            </div>

            {isModalOpen && <AddEquipoModal onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} equipoToEdit={equipoToEdit} clinicaId={getTargetClinicId()} />}
            {isBulkModalOpen && <BulkUploadModal onClose={() => setIsBulkModalOpen(false)} onSuccess={handleSuccess} clinicaId={getTargetClinicId()} />}
            
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
                                <th>Código Interno</th>
                                <th>Ubicación</th>
                                <th>Área/Servicio</th>
                                <th>Clas. Uso</th>
                                <th>Clas. Riesgo</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipos.length > 0 ? (
                                equipos.map(equipo => (
                                    <tr key={equipo.id} onClick={() => handleRowClick(equipo.id)} className="clickable-row">
                                        <td><div className="equipo-name-cell"><span className={`status-dot ${equipo.is_complete ? 'status-green' : 'status-yellow'}`} title={equipo.is_complete ? 'Completa' : 'Incompleta'}></span>{equipo.hoja_vida_id}</div></td>
                                        <td>{equipo.nombre_equipo}</td>
                                        <td>{equipo.marca}</td>
                                        <td>{equipo.modelo}</td>
                                        <td>{equipo.serie}</td>
                                        <td>{equipo.codigo_interno}</td>
                                        <td>{equipo.ubicacion}</td>
                                        <td>{equipo.area_servicio}</td>
                                        <td>{equipo.clasificacion_uso_display}</td>
                                        <td>{equipo.clasificacion_riesgo}</td>
                                        <td><div className="action-buttons"><button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(equipo); }} className="button-edit">Editar</button><button onClick={(e) => { e.stopPropagation(); handleDelete(equipo.id); }} className="button-delete">Eliminar</button></div></td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="11">No se encontraron equipos con los criterios de búsqueda.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default InventoryPage;