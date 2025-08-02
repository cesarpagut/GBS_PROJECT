import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

// --- Componente para mostrar un detalle de forma segura ---
const DetailItem = ({ label, value }) => (
    <div className="detail-item">
        <span className="detail-label">{label}:</span>
        <span className="detail-value">{value || 'No registra'}</span>
    </div>
);

// --- Componente para la sección de Documentos ---
function DocumentosSection({ equipo, fetchEquipo }) {
    const [file, setFile] = useState(null);
    const [nombreDocumento, setNombreDocumento] = useState('Manual de Usuario');
    const [otroNombre, setOtroNombre] = useState('');

    const handleUpload = async () => {
        if (!file) {
            alert('Por favor, selecciona un archivo.');
            return;
        }
        const finalNombre = nombreDocumento === 'Otro' ? otroNombre : nombreDocumento;
        if (!finalNombre) {
            alert('Por favor, especifica un nombre para el documento.');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', file);
        formData.append('nombre', finalNombre);

        try {
            await apiClient.post(`/inventory/equipos/${equipo.id}/upload_documento/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Documento subido con éxito.');
            fetchEquipo(); // Refresca los datos del equipo
        } catch (error) {
            console.error("Error al subir documento:", error);
            alert('No se pudo subir el documento.');
        }
    };
    
    const handleDelete = async (docId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
            try {
                await apiClient.delete(`/inventory/equipos/${equipo.id}/delete_documento/${docId}/`);
                alert('Documento eliminado con éxito.');
                fetchEquipo();
            } catch (error) {
                console.error("Error al eliminar documento:", error);
                alert('No se pudo eliminar el documento.');
            }
        }
    };

    return (
        <fieldset className="hv-section">
            <legend>Documentación y Soporte</legend>
            <div className="documentos-list">
                {equipo.documentos?.length > 0 ? (
                    equipo.documentos.map(doc => (
                        <div key={doc.id} className="documento-item">
                            <a href={`http://127.0.0.1:8000${doc.archivo}`} target="_blank" rel="noopener noreferrer">{doc.nombre}</a>
                            <button onClick={() => handleDelete(doc.id)} className="delete-doc-btn">&times;</button>
                        </div>
                    ))
                ) : <p>No hay documentos adjuntos.</p>}
            </div>
            <div className="upload-section">
                <select value={nombreDocumento} onChange={(e) => setNombreDocumento(e.target.value)}>
                    <option>Manual de Usuario</option>
                    <option>Manual de Servicio</option>
                    <option>Guía Rápida</option>
                    <option>Carta de Garantía</option>
                    <option>Registro de Importación</option>
                    <option value="Otro">Otro (especificar)</option>
                </select>
                {nombreDocumento === 'Otro' && (
                    <input type="text" placeholder="Nombre del documento" value={otroNombre} onChange={(e) => setOtroNombre(e.target.value)} />
                )}
                <input type="file" onChange={(e) => setFile(e.target.files[0])} />
                <button onClick={handleUpload} className="button-primary">Subir</button>
            </div>
        </fieldset>
    );
}

// --- Componente Principal de la Página ---
function HojaVidaPage() {
    const { equipoId } = useParams();
    const navigate = useNavigate();
    const [equipo, setEquipo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchEquipo = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/inventory/equipos/${equipoId}/`);
            setEquipo(response.data);
        } catch (err) {
            setError('No se pudo cargar la información del equipo.');
        } finally {
            setLoading(false);
        }
    }, [equipoId]);

    useEffect(() => {
        fetchEquipo();
    }, [fetchEquipo]);

    if (loading) return <div className="loading-container"><p>Cargando hoja de vida...</p></div>;
    if (error) return <p className="error-message">{error}</p>;
    if (!equipo) return <p>Equipo no encontrado.</p>;

    return (
        <div className="hv-container">
            <div className="hv-header">
                <div>
                    <h1>Hoja de Vida de Equipo Biomédico</h1>
                    <h2>{equipo.nombre_equipo} - {equipo.marca} {equipo.modelo}</h2>
                </div>
                <div className="header-actions">
                    <button onClick={() => navigate('/inventory')} className="button-secondary">Volver al Inventario</button>
                </div>
            </div>

            <div className="hv-grid">
                <div className="hv-main-content">
                    <fieldset className="hv-section">
                        <legend>1. Identificación del Equipo</legend>
                        <div className="hv-photo-and-details">
                            <div className="hv-photo">
                                {equipo.foto_equipo ? 
                                    <img src={`http://127.0.0.1:8000${equipo.foto_equipo}`} alt={`Foto de ${equipo.nombre_equipo}`} /> : 
                                    <div className="photo-placeholder">Sin Imagen</div>
                                }
                            </div>
                            <div className="hv-details-grid two-columns">
                                <DetailItem label="Hoja de Vida ID" value={equipo.hoja_vida_id} />
                                <DetailItem label="Serie" value={equipo.serie} />
                                <DetailItem label="Código Interno" value={equipo.codigo_interno} />
                                <DetailItem label="Área/Servicio" value={equipo.area_servicio} />
                                <DetailItem label="Ubicación" value={equipo.ubicacion} />
                                <DetailItem label="Clasificación por Uso" value={equipo.clasificacion_uso} />
                                <DetailItem label="Registro Sanitario" value={equipo.registro_sanitario} />
                                <DetailItem label="Clasificación de Riesgo" value={equipo.clasificacion_riesgo} />
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="hv-section">
                        <legend>2. Información de Adquisición</legend>
                        <div className="hv-details-grid three-columns">
                            <DetailItem label="Fecha de Adquisición" value={equipo.fecha_adquisicion} />
                            <DetailItem label="Forma de Adquisición" value={equipo.forma_adquisicion} />
                            <DetailItem label="Proveedor" value={equipo.proveedor} />
                            <DetailItem label="Precio (COP)" value={equipo.precio} />
                            <DetailItem label="Garantía (años)" value={equipo.garantia_anios} />
                            <DetailItem label="Vida Útil (años)" value={equipo.vida_util_anios} />
                        </div>
                    </fieldset>

                    <fieldset className="hv-section">
                        <legend>3. Características Técnicas</legend>
                        <div className="hv-details-grid four-columns">
                            <DetailItem label="Voltaje (Vdc)" value={equipo.voltaje_vdc} />
                            <DetailItem label="Voltaje (Vac)" value={equipo.voltaje_vac} />
                            <DetailItem label="Corriente (A)" value={equipo.corriente} />
                            <DetailItem label="Potencia (W)" value={equipo.potencia} />
                            <DetailItem label="Frecuencia (Hz)" value={equipo.frecuencia} />
                            <DetailItem label="Temperatura (°C)" value={equipo.temperatura} />
                            <DetailItem label="Peso (Kg)" value={equipo.peso} />
                            <DetailItem label="Tecnología" value={equipo.tecnologia_predominante} />
                        </div>
                    </fieldset>

                    <fieldset className="hv-section">
                        <legend>4. Mantenimiento y Calibración</legend>
                        <div className="hv-details-grid three-columns">
                            <DetailItem label="Frec. Mantenimiento" value={`${equipo.frecuencia_mantenimiento_meses} meses`} />
                            <DetailItem label="Requiere Calibración" value={equipo.requiere_calibracion ? 'Sí' : 'No'} />
                            <DetailItem label="Frec. Calibración" value={equipo.frecuencia_calibracion_meses ? `${equipo.frecuencia_calibracion_meses} meses` : 'N/A'} />
                        </div>
                    </fieldset>
                </div>

                <div className="hv-sidebar">
                    <DocumentosSection equipo={equipo} fetchEquipo={fetchEquipo} />
                    <fieldset className="hv-section">
                        <legend>Historial de Cambios</legend>
                        <div className="historial-list">
                            {equipo.historial?.length > 0 ? (
                                equipo.historial.map(log => (
                                    <div key={log.id} className="historial-item">
                                        <p><strong>Usuario:</strong> {log.usuario?.email || 'N/A'}</p>
                                        <p><strong>Fecha:</strong> {new Date(log.fecha_modificacion).toLocaleString()}</p>
                                        <p><strong>Motivo:</strong> {log.motivo_cambio}</p>
                                    </div>
                                ))
                            ) : <p>No hay modificaciones registradas.</p>}
                        </div>
                    </fieldset>
                </div>
            </div>
        </div>
    );
}
export default HojaVidaPage;