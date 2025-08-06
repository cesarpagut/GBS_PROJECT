import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api';
import jsPDF from 'jspdf';
// --- FIX: Importar jspdf-autotable de la manera correcta ---
import autoTable from 'jspdf-autotable';
import getMediaUrl from '../utils/getMediaUrl';
//import logo from "../assets/logo-clinica.png";
//import imagenEquipo from "../assets/equipo-biomedico.png";

const DetailItem = ({ label, value, fullWidth = false }) => (
    <div className={`detail-item ${fullWidth ? 'full-width' : ''}`}>
        <span className="detail-label">{label}:</span>
        <span className="detail-value">{value !== null && value !== '' && value !== 'N/A' ? value : 'No registra'}</span>
    </div>
);

function HojaVidaPage() {
    const { equipoId } = useParams();
    const navigate = useNavigate();
    const [equipo, setEquipo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchEquipo = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/equipos/${equipoId}/`);
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

    const handleDeleteDocumento = async (docId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este documento?')) {
            try {
                await apiClient.delete(`/equipos/${equipo.id}/delete_documento/${docId}/`);
                alert('Documento eliminado con éxito.');
                fetchEquipo();
            } catch (error) {
                console.error("Error al eliminar documento:", error);
                alert('No se pudo eliminar el documento.');
            }
        }
    };

    const getFullDocUrl = (docUrl) => {
        if (!docUrl) return '#';
        if (docUrl.startsWith('http')) return docUrl;
        const baseUrl = apiClient.defaults.baseURL.replace('/api', '');
        return `${baseUrl}${docUrl}`;
    };

 // --- FUNCIÓN MEJORADA PARA GENERAR PDF ---
const generatePDF = async () => {
    const doc = new jsPDF();
    const margin = 14;
    const pageWidth = doc.internal.pageSize.getWidth();

    const loadImageAsBase64 = async (url) => {
        if (!url || url === '#' || typeof url !== 'string') {
            return null;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.warn("No se pudo cargar la imagen:", url);
                return null;
            }
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Error al cargar la imagen:", e);
            return null;
    }
};

    const logoBase64 = await loadImageAsBase64(getFullDocUrl(equipo.clinica?.logo));
    const equipoPhotoBase64 = await loadImageAsBase64(getFullDocUrl(equipo.foto_equipo));

    // Encabezado
    doc.setDrawColor(0);
    doc.rect(margin, 10, pageWidth - margin * 2, 20);
    doc.line(margin + 40, 10, margin + 40, 30);
    doc.line(margin + 40, 20, pageWidth - margin, 20);
    doc.line(pageWidth - margin - 60, 20, pageWidth - margin - 60, 30);
    doc.line(pageWidth - margin - 30, 20, pageWidth - margin - 30, 30);

    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', margin + 2, 12, 36, 16);
    }

    doc.setFontSize(10);
    doc.text(equipo.clinica?.nombre || 'Clínica No Asignada', margin + 45, 16);
    doc.text("HOJA DE VIDA DE EQUIPO BIOMEDICO", margin + 45, 26);
    doc.text(`Código: ${equipo.hoja_vida_id}`, pageWidth - margin - 58, 26);
    doc.text(`Versión: ${equipo.version}`, pageWidth - margin - 28, 26);
    
    let lastY = 40;
    const photoX = margin;
    const photoY = lastY;
    const photoWidth = 60;
    const photoHeight = 60;

    if (equipoPhotoBase64) {
        doc.addImage(equipoPhotoBase64, 'PNG', photoX, photoY, photoWidth, photoHeight);
    } else {
        // Dibuja un recuadro gris con texto "Sin imagen"
        doc.setFillColor(240, 240, 240);
        doc.rect(photoX, photoY, photoWidth, photoHeight, 'F'); // 'F' para fill
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Sin imagen', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center', baseline: 'middle' });
    }

    // 1. IDENTIFICACIÓN DEL EQUIPO
    autoTable(doc, {
        startY: lastY,
        head: [[{ content: '1. IDENTIFICACIÓN DEL EQUIPO', colSpan: 2, styles: { fillColor: [220, 220, 220] } }]],
        body: [
            ['Nombre:', equipo.nombre_equipo],
            ['Marca:', equipo.marca],
            ['Modelo:', equipo.modelo],
            ['Serie:', equipo.serie],
            ['Ubicación:', equipo.ubicacion],
            ['Área/Servicio:', equipo.area_servicio],
            ['Clasificación por Uso:', equipo.clasificacion_uso_display],
            ['Clasificación de Riesgo:', equipo.clasificacion_riesgo],
            ['Código Interno:', equipo.codigo_interno],
            ['Registro Sanitario:', equipo.registro_sanitario],
        ],
        theme: 'grid',
        margin: { left: margin + 65 }
    });
    lastY = doc.lastAutoTable?.finalY + 10;

    // 2. REGISTRO DE ADQUISICIÓN
    autoTable(doc, {
        startY: lastY,
        head: [[{ content: '2. REGISTRO DE ADQUISICIÓN', colSpan: 2, styles: { fillColor: [220, 220, 220] } }]],
        body: [
            ['Fabricante:', equipo.fabricante],
            ['Distribuidor:', equipo.proveedor],
            ['Fecha Adquisición:', equipo.fecha_adquisicion],
            ['Forma de Adquisición:', equipo.forma_adquisicion_display],
            ['Registro Sanitario:', equipo.registro_sanitario],
        ],
        theme: 'grid',
        margin: { left: margin }
    });
    lastY = doc.lastAutoTable?.finalY + 10 || 50;

    autoTable(doc, {
    startY: lastY,
    head: [[
        {
        content: '3. CARACTERÍSTICAS TÉCNICAS',
        colSpan: 4,
        styles: { halign: 'left', fillColor: [220, 220, 220], fontStyle: 'bold' }
        }
    ]],
    body: [
        [
        'Tecnología predominate:', equipo.tecnologia_predominante_display || 'No registra',
        'Voltaje:',
        `${equipo.voltaje_vdc_na ? 'N/A' : (equipo.voltaje_vdc || 'No registra')} VDC / ${equipo.voltaje_vac_na ? 'N/A' : (equipo.voltaje_vac || 'No registra')} VAC`
        ],
        [
        'Corriente:',
        equipo.corriente_na ? 'N/A' : `${equipo.corriente || 'No registra'} A`,
        'Frecuencia:',
        equipo.frecuencia_na ? 'N/A' : `${equipo.frecuencia || 'No registra'} Hz`
        ],
        [
        'Potencia:',
        equipo.potencia_na ? 'N/A' : `${equipo.potencia || 'No registra'} W`,
        'Peso:',
        equipo.peso_na ? 'N/A' : `${equipo.peso || 'No registra'} Kg`
        ],
        [
        'Temperatura:',
        equipo.temperatura_na ? 'N/A' : `${equipo.temperatura || 'No registra'} °C`,
        'Presión:',
        'No registra'
        ]
    ],
    theme: 'grid',
    styles: {
        fontSize: 10,
        cellPadding: 3,
        halign: 'left',
        valign: 'middle',
        overflow: 'linebreak'
    },
    margin: { left: margin },
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.3
});
    lastY = doc.lastAutoTable.finalY + 10;

    // 4. MANTENIMIENTO Y CALIBRACIÓN
    autoTable(doc, {
        startY: lastY,
        head: [[{ content: '4. MANTENIMIENTO Y CALIBRACIÓN', colSpan: 2, styles: { fillColor: [220, 220, 220] } }]],
        body: [
            ['Frec. Mantenimiento:', `${equipo.frecuencia_mantenimiento_meses} meses`],
            ['Requiere Calibración:', equipo.requiere_calibracion ? 'Sí' : 'No'],
            ['Frec. Calibración:', equipo.frecuencia_calibracion_meses || 'N/A'],
        ],
        theme: 'grid',
        margin: { left: margin }
    });

    // Guardar archivo
    doc.save(`HV_${equipo.nombre_equipo}_${equipo.serie}.pdf`);
};


    if (loading) return <div className="loading-container"><p>Cargando hoja de vida...</p></div>;
    if (error) return <p className="error-message">{error}</p>;
    if (!equipo) return <p>Equipo no encontrado.</p>;

    return (
        <div className="hv-container">
            <div className="hv-document-header">
                <div className="hv-logo-container">
                    {equipo.clinica?.logo && <img src={getFullDocUrl(equipo.clinica.logo)} alt="Logo Clínica" className="hv-logo" />}
                    <span className="hv-clinic-name">{equipo.clinica?.nombre || 'Clínica No Asignada'}</span>
                </div>
                <div className="hv-title-container">
                    <h1>Hoja de Vida de Equipo Biomédico</h1>
                </div>
                <div className="hv-code-container">
                    <span className="code-label">Código: {equipo.hoja_vida_id}</span>
                    <span className="version-label">Versión: {equipo.version}</span>
                    <span className="date-label">Fecha: {new Date(equipo.fecha_modificacion).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="hv-header">
                <h2>{equipo.nombre_equipo} - {equipo.marca} {equipo.modelo}</h2>
                <div className="header-actions">
                    <button onClick={generatePDF} className="button-primary">Descargar PDF</button>
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
                                    <img src={getFullDocUrl(equipo.foto_equipo)} alt={`Foto de ${equipo.nombre_equipo}`} /> : 
                                    <div className="photo-placeholder">Sin Imagen</div>
                                }
                            </div>
                            <div className="hv-details-grid two-columns">
                                <DetailItem label="Serie" value={equipo.serie} />
                                <DetailItem label="Código Interno" value={equipo.codigo_interno} />
                                <DetailItem label="Área/Servicio" value={equipo.area_servicio} />
                                <DetailItem label="Ubicación" value={equipo.ubicacion} />
                                <DetailItem label="Clasificación por Uso" value={equipo.clasificacion_uso_display} />
                                <DetailItem label="Registro Sanitario" value={equipo.registro_sanitario} />
                                <DetailItem label="Clasificación de Riesgo" value={equipo.clasificacion_riesgo} />
                            </div>
                        </div>
                    </fieldset>
                    
                    <fieldset className="hv-section">
                        <legend>2. Información de Adquisición</legend>
                        <div className="hv-details-grid three-columns">
                            <DetailItem label="Fecha de Adquisición" value={equipo.fecha_adquisicion} />
                            <DetailItem label="Forma de Adquisición" value={equipo.forma_adquisicion_display} />
                            <DetailItem label="Proveedor" value={equipo.proveedor} />
                            <DetailItem label="Precio (COP)" value={equipo.precio ? `$${parseFloat(equipo.precio).toLocaleString('es-CO')}` : 'No registra'} />
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
                            <DetailItem label="Tecnología" value={equipo.tecnologia_predominante_display} />
                        </div>
                        <div className="hv-details-grid full-width" style={{marginTop: '1rem'}}>
                            <DetailItem label="Otras Fuentes de Alimentación" value={
                                [
                                    equipo.fuente_neumatica && 'Neumática',
                                    equipo.fuente_hidraulica && 'Hidráulica',
                                    equipo.fuente_combustion && 'Combustión'
                                ].filter(Boolean).join(', ') || 'No registra'
                            } fullWidth />
                        </div>
                    </fieldset>

                    <fieldset className="hv-section">
                        <legend>4. Parámetros Entregados</legend>
                        <div className="hv-details-grid three-columns">
                            {equipo.parametros?.length > 0 ? equipo.parametros.map(p => (
                                <DetailItem key={p.id} label={p.parametro_display || p.parametro} value={`Min: ${p.rango_min || 'N/A'} - Max: ${p.rango_max || 'N/A'}`} />
                            )) : <p>No hay parámetros registrados.</p>}
                        </div>
                    </fieldset>

                    <fieldset className="hv-section">
                        <legend>5. Mantenimiento y Calibración</legend>
                        <div className="hv-details-grid three-columns">
                            <DetailItem label="Frec. Mantenimiento" value={`${equipo.frecuencia_mantenimiento_meses} meses`} />
                            <DetailItem label="Requiere Calibración" value={equipo.requiere_calibracion ? 'Sí' : 'No'} />
                            <DetailItem label="Frec. Calibración" value={equipo.frecuencia_calibracion_meses} />
                        </div>
                    </fieldset>
                </div>

                <div className="hv-sidebar">
                    <fieldset className="hv-section">
                        <legend>Documentación y Soporte</legend>
                        <div className="documentos-list">
                            {equipo.documentos?.length > 0 ? (
                                equipo.documentos.map(doc => (
                                    <div key={doc.id} className="documento-item">
                                        <a href={getFullDocUrl(doc.archivo)} target="_blank" rel="noopener noreferrer">{doc.nombre}</a>
                                        <button onClick={() => handleDeleteDocumento(doc.id)} className="delete-doc-btn">&times;</button>
                                    </div>
                                ))
                            ) : <p>No hay documentos adjuntos.</p>}
                        </div>
                    </fieldset>

                    <fieldset className="hv-section">
                        <legend>Historial de Cambios (Últimos 3)</legend>
                        <div className="historial-list">
                            {equipo.historial?.length > 0 ? (
                                equipo.historial.slice(0, 3).map(log => (
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

