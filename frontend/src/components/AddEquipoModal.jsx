import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

// Componente para manejar la carga de un documento individual
function DocumentoUploader({ label, onFileChange }) {
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = (e) => {
        setIsChecked(e.target.checked);
        if (!e.target.checked) {
            onFileChange(null);
        }
    };

    const handleFileChange = (e) => {
        onFileChange(e.target.files[0]);
    };

    return (
        <div className="input-group-checkbox with-file">
            <input 
                type="checkbox" 
                id={`doc_${label}`} 
                checked={isChecked} 
                onChange={handleCheckboxChange} 
            />
            <label htmlFor={`doc_${label}`}>{label}</label>
            {isChecked && (
                <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                />
            )}
        </div>
    );
}

// Componente para manejar la carga de documentos "Otros"
function OtroDocumentoUploader({ id, onUpdate, onRemove }) {
    const [nombre, setNombre] = useState('');
    const [archivo, setArchivo] = useState(null);

    useEffect(() => {
        onUpdate(id, nombre, archivo);
    }, [id, nombre, archivo, onUpdate]);

    return (
        <div className="otro-documento-row">
            <input 
                type="text"
                placeholder="Nombre del documento"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
            />
            <input 
                type="file"
                onChange={(e) => setArchivo(e.target.files[0])}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
            />
            <button type="button" onClick={() => onRemove(id)} className="button-delete-param">-</button>
        </div>
    );
}


function AddEquipoModal({ onClose, onSuccess, equipoToEdit, clinicaId }) {
    const [formData, setFormData] = useState({
        nombre_equipo: '', marca: '', modelo: '', serie: '', codigo_interno: '',
        area_servicio: '', ubicacion: '', foto_equipo: null, registro_sanitario_aplica: true,
        registro_sanitario: '', clasificacion_riesgo: 'I', clasificacion_uso: 'DIAGNOSTICO',
        fecha_adquisicion: '', forma_adquisicion: 'COMPRA_NUEVO', proveedor: '', fabricante: '',
        precio_no_registra: false, precio: '', garantia_anios: 1, vida_util_anios: 10,
        voltaje_vdc: '', voltaje_vdc_na: false, voltaje_vac: '', voltaje_vac_na: false,
        corriente: '', corriente_na: false, potencia: '', potencia_na: false,
        frecuencia: '', frecuencia_na: false, temperatura: '', temperatura_na: false,
        peso: '', peso_na: false, tecnologia_predominante: 'ELECTRONICO',
        fuente_neumatica: false, fuente_hidraulica: false, fuente_combustion: false,
        frecuencia_mantenimiento_meses: 6, requiere_calibracion: false,
        frecuencia_calibracion_meses: '', estado_actual: 'FUNCIONAL',
    });
    
    const [documentos, setDocumentos] = useState({});
    const [otrosDocumentos, setOtrosDocumentos] = useState([]);
    const [parametros, setParametros] = useState([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [motivoCambio, setMotivoCambio] = useState('');

    useEffect(() => {
        if (equipoToEdit) {
            const editData = {};
            for (const key in formData) {
                if (equipoToEdit.hasOwnProperty(key) && equipoToEdit[key] !== null) {
                    editData[key] = equipoToEdit[key];
                }
            }
            setFormData(prev => ({ ...prev, ...editData }));
            if (equipoToEdit.parametros) {
                setParametros(equipoToEdit.parametros);
            }
        }
    }, [equipoToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let val = type === 'checkbox' ? checked : value;

        const technicalField = name.replace('_na', '');
        if (name.endsWith('_na')) {
            if (checked) {
                setFormData(prevState => ({
                    ...prevState,
                    [name]: val,
                    [technicalField]: '' 
                }));
            } else {
                setFormData(prevState => ({ ...prevState, [name]: val }));
            }
        } else {
            setFormData(prevState => ({ ...prevState, [name]: val }));
        }
    };
    
    const handleFileChange = (e) => {
        setFormData(prevState => ({ ...prevState, foto_equipo: e.target.files[0] }));
    };

    const handleParamChange = (index, e) => {
        const newParametros = [...parametros];
        newParametros[index][e.target.name] = e.target.value;
        setParametros(newParametros);
    };

    const addParametro = () => setParametros([...parametros, { parametro: 'RPM', rango_min: '', rango_max: '' }]);
    const removeParametro = (index) => setParametros(parametros.filter((_, i) => i !== index));

    const handleDocumentoChange = useCallback((nombre, archivo) => {
        setDocumentos(prev => ({ ...prev, [nombre]: archivo }));
    }, []);

    const addOtroDocumento = () => {
        setOtrosDocumentos(prev => [...prev, { id: Date.now(), nombre: '', archivo: null }]);
    };

    const updateOtroDocumento = useCallback((id, nombre, archivo) => {
        setOtrosDocumentos(prev => prev.map(doc => doc.id === id ? { ...doc, nombre, archivo } : doc));
    }, []);

    const removeOtroDocumento = useCallback((id) => {
        setOtrosDocumentos(prev => prev.filter(doc => doc.id !== id));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const techFields = ['voltaje_vdc', 'voltaje_vac', 'corriente', 'potencia', 'frecuencia', 'temperatura', 'peso'];
        for (const field of techFields) {
            if (!formData[field] && !formData[`${field}_na`]) {
                setError(`El campo técnico '${field}' es obligatorio si no está marcado como N/A.`);
                return;
            }
        }

        if (formData.requiere_calibracion && !formData.frecuencia_calibracion_meses) {
            setError('La Frecuencia de Calibración es obligatoria si el equipo la requiere.');
            return;
        }

        if (equipoToEdit && !motivoCambio.trim()) {
            setError('El motivo del cambio es obligatorio al editar un equipo.');
            return;
        }

        setIsSubmitting(true);
        const submissionData = new FormData();

        let dataToSubmit = { ...formData };
        if (!dataToSubmit.registro_sanitario_aplica) dataToSubmit.registro_sanitario = 'no requiere';
        if (dataToSubmit.precio_no_registra) dataToSubmit.precio = null;
        if (!dataToSubmit.requiere_calibracion) dataToSubmit.frecuencia_calibracion_meses = 'N/A';
        
        for (const field of techFields) {
            if (dataToSubmit[`${field}_na`]) {
                dataToSubmit[field] = 'N/A';
            }
        }

        for (const key in dataToSubmit) {
            if (dataToSubmit[key] !== null && dataToSubmit[key] !== undefined) {
                submissionData.append(key, dataToSubmit[key]);
            }
        }

        submissionData.append('parametros', JSON.stringify(parametros));
        
        for (const nombre in documentos) {
            if (documentos[nombre]) {
                submissionData.append(`documentos[${nombre}]`, documentos[nombre]);
            }
        }
        otrosDocumentos.forEach(doc => {
            if (doc.nombre && doc.archivo) {
                submissionData.append(`documentos[Otro-${doc.nombre}]`, doc.archivo);
            }
        });

        if (equipoToEdit) {
            submissionData.append('motivo_cambio', motivoCambio);
        } else if (clinicaId) {
            submissionData.append('clinica_id', clinicaId);
        }

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            if (equipoToEdit) {
                await apiClient.put(`/equipos/${equipoToEdit.id}/`, submissionData, config);
                alert('¡Equipo actualizado con éxito!');
            } else {
                await apiClient.post('/equipos/', submissionData, config);
                alert('¡Equipo añadido con éxito!');
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error al guardar equipo:', err.response?.data);
            const errorData = err.response?.data;
            const errorMessage = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
            setError(`No se pudo guardar el equipo. Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalTitle = equipoToEdit ? 'Editar Hoja de Vida' : 'Crear Hoja de Vida';
    const documentosPredefinidos = [
        'Manual de Usuario', 'Manual de Servicio', 'Guía Rápida', 
        'Carta de Garantía', 'Registro de Importación'
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>{modalTitle}</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <fieldset>
                         <legend>1. Identificación del Equipo</legend>
                         <div className="form-grid-three">
                             <div className="input-group"><label>Nombre del Equipo</label><input type="text" name="nombre_equipo" value={formData.nombre_equipo} onChange={handleChange} required /></div>
                             <div className="input-group"><label>Marca</label><input type="text" name="marca" value={formData.marca} onChange={handleChange} required /></div>
                             <div className="input-group"><label>Modelo</label><input type="text" name="modelo" value={formData.modelo} onChange={handleChange} required /></div>
                             <div className="input-group"><label>Serie</label><input type="text" name="serie" value={formData.serie} onChange={handleChange} required /></div>
                             <div className="input-group"><label>Código Interno</label><input type="text" name="codigo_interno" value={formData.codigo_interno} onChange={handleChange} /></div>
                             <div className="input-group"><label>Área/Servicio</label><input type="text" name="area_servicio" value={formData.area_servicio} onChange={handleChange} /></div>
                             <div className="input-group"><label>Ubicación</label><input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} /></div>
                             <div className="input-group"><label>Clasificación por Uso</label><select name="clasificacion_uso" value={formData.clasificacion_uso} onChange={handleChange}><option value="DIAGNOSTICO">Diagnóstico</option><option value="SOPORTE_VITAL">Soporte Vital</option><option value="LABORATORIO">Laboratorio Clínico</option><option value="TRATAMIENTO">Tratamiento/Quirúrgico</option><option value="TERAPEUTICO">Terapéutico/Rehabilitación</option><option value="ESTERILIZACION">Esterilización/Desinfección</option><option value="OTRO">Otro</option></select></div>
                             <div className="input-group"><label>Registro Sanitario</label><input type="text" name="registro_sanitario" value={formData.registro_sanitario} onChange={handleChange} disabled={!formData.registro_sanitario_aplica} /></div>
                             <div className="input-group-checkbox standalone"><input type="checkbox" name="registro_sanitario_aplica" id="registro_sanitario_aplica" checked={formData.registro_sanitario_aplica} onChange={handleChange} /><label htmlFor="registro_sanitario_aplica">Aplica Reg. Sanitario</label></div>
                             <div className="input-group"><label>Clasificación de Riesgo</label><select name="clasificacion_riesgo" value={formData.clasificacion_riesgo} onChange={handleChange} disabled={!formData.registro_sanitario_aplica}><option value="I">Clase I</option><option value="IIA">Clase IIa</option><option value="IIB">Clase IIb</option><option value="III">Clase III</option></select></div>
                             <div className="input-group span-three"><label>Foto del Equipo (JPG, PNG)</label><input type="file" name="foto_equipo" onChange={handleFileChange} accept="image/png, image/jpeg" /></div>
                         </div>
                    </fieldset>
                    <fieldset>
                        <legend>2. Información de Adquisición</legend>
                        <div className="form-grid-three">
                             <div className="input-group"><label>Fecha de Adquisición</label><input type="date" name="fecha_adquisicion" value={formData.fecha_adquisicion} onChange={handleChange} /></div>
                             <div className="input-group"><label>Forma de Adquisición</label><select name="forma_adquisicion" value={formData.forma_adquisicion} onChange={handleChange}><option value="COMPRA_NUEVO">Compra (Nuevo)</option><option value="COMPRA_SEGUNDA">Compra (Segunda)</option><option value="DONACION">Donación</option><option value="COMODATO">Comodato</option><option value="OTRO">Otro</option></select></div>
                             <div className="input-group"><label>fabricante</label><input type="text" name="fabricante" value={formData.fabricante} onChange={handleChange} /></div>
                             <div className="input-group"><label>Proveedor</label><input type="text" name="proveedor" value={formData.proveedor} onChange={handleChange} /></div>
                             <div className="input-group"><label>Precio (COP)</label><input type="number" step="0.01" name="precio" value={formData.precio} onChange={handleChange} disabled={formData.precio_no_registra} /></div>
                             <div className="input-group-checkbox standalone"><input type="checkbox" name="precio_no_registra" id="precio_no_registra" checked={formData.precio_no_registra} onChange={handleChange} /><label htmlFor="precio_no_registra">No Registra Precio</label></div>
                             <div className="input-group"><label>Garantía (años)</label><input type="number" name="garantia_anios" value={formData.garantia_anios} onChange={handleChange} min="0" /></div>
                             <div className="input-group"><label>Vida Útil (años)</label><input type="number" name="vida_util_anios" value={formData.vida_util_anios} onChange={handleChange} min="0" /></div>
                        </div>
                    </fieldset>
                    
                    <fieldset>
                         <legend>3. Características Técnicas</legend>
                         <div className="form-grid-four">
                             <div className="input-group with-na"><label>Voltaje (Vdc)</label><input type="number" step="0.01" name="voltaje_vdc" value={formData.voltaje_vdc} onChange={handleChange} disabled={formData.voltaje_vdc_na} /><div className="na-checkbox"><input type="checkbox" name="voltaje_vdc_na" id="voltaje_vdc_na" checked={formData.voltaje_vdc_na} onChange={handleChange} /><label htmlFor="voltaje_vdc_na">N/A</label></div></div>
                             <div className="input-group with-na"><label>Voltaje (Vac)</label><input type="number" step="0.01" name="voltaje_vac" value={formData.voltaje_vac} onChange={handleChange} disabled={formData.voltaje_vac_na} /><div className="na-checkbox"><input type="checkbox" name="voltaje_vac_na" id="voltaje_vac_na" checked={formData.voltaje_vac_na} onChange={handleChange} /><label htmlFor="voltaje_vac_na">N/A</label></div></div>
                             <div className="input-group with-na"><label>Corriente (A)</label><input type="number" step="0.01" name="corriente" value={formData.corriente} onChange={handleChange} disabled={formData.corriente_na} /><div className="na-checkbox"><input type="checkbox" name="corriente_na" id="corriente_na" checked={formData.corriente_na} onChange={handleChange} /><label htmlFor="corriente_na">N/A</label></div></div>
                             <div className="input-group with-na"><label>Potencia (W)</label><input type="number" step="0.01" name="potencia" value={formData.potencia} onChange={handleChange} disabled={formData.potencia_na} /><div className="na-checkbox"><input type="checkbox" name="potencia_na" id="potencia_na" checked={formData.potencia_na} onChange={handleChange} /><label htmlFor="potencia_na">N/A</label></div></div>
                             <div className="input-group with-na"><label>Frecuencia (Hz)</label><input type="number" step="0.01" name="frecuencia" value={formData.frecuencia} onChange={handleChange} disabled={formData.frecuencia_na} /><div className="na-checkbox"><input type="checkbox" name="frecuencia_na" id="frecuencia_na" checked={formData.frecuencia_na} onChange={handleChange} /><label htmlFor="frecuencia_na">N/A</label></div></div>
                             <div className="input-group with-na"><label>Temperatura (°C)</label><input type="number" step="0.01" name="temperatura" value={formData.temperatura} onChange={handleChange} disabled={formData.temperatura_na} /><div className="na-checkbox"><input type="checkbox" name="temperatura_na" id="temperatura_na" checked={formData.temperatura_na} onChange={handleChange} /><label htmlFor="temperatura_na">N/A</label></div></div>
                             <div className="input-group with-na"><label>Peso (Kg)</label><input type="number" step="0.01" name="peso" value={formData.peso} onChange={handleChange} disabled={formData.peso_na} /><div className="na-checkbox"><input type="checkbox" name="peso_na" id="peso_na" checked={formData.peso_na} onChange={handleChange} /><label htmlFor="peso_na">N/A</label></div></div>
                         </div>
                         <div className="form-grid-two" style={{marginTop: '1rem'}}>
                           <div className="input-group"><label>Tecnología Predominante</label><select name="tecnologia_predominante" value={formData.tecnologia_predominante} onChange={handleChange}><option value="MECANICO">Mecánico</option><option value="ELECTRONICO">Electrónico</option><option value="HIDRAULICO">Hidráulico</option><option value="NEUMATICO">Neumático</option><option value="INFORMATICO">Informático</option></select></div>
                           <div className="input-group"><label>Otras Fuentes de Alimentación:</label><div className="form-grid-docs"><div className="input-group-checkbox"><input type="checkbox" name="fuente_neumatica" id="fuente_neumatica" checked={formData.fuente_neumatica} onChange={handleChange} /><label htmlFor="fuente_neumatica">Neumática</label></div><div className="input-group-checkbox"><input type="checkbox" name="fuente_hidraulica" id="fuente_hidraulica" checked={formData.fuente_hidraulica} onChange={handleChange} /><label htmlFor="fuente_hidraulica">Hidráulica</label></div><div className="input-group-checkbox"><input type="checkbox" name="fuente_combustion" id="fuente_combustion" checked={formData.fuente_combustion} onChange={handleChange} /><label htmlFor="fuente_combustion">Combustión (Gas)</label></div></div></div>
                         </div>
                    </fieldset>

                    <fieldset>
                        <legend>4. Parámetros Entregados</legend>
                        {parametros.map((p, index) => (
                          <div key={index} className="param-row">
                            <select name="parametro" value={p.parametro} onChange={(e) => handleParamChange(index, e)}><option value="RPM">RPM</option><option value="TEMPERATURA">Temperatura (°C)</option><option value="PRESION">Presión (PSI)</option><option value="FLUJO">Flujo (lpm)</option><option value="PESO">Peso (kg)</option><option value="SPO2">SpO2</option><option value="FC">FC (LPM)</option><option value="ENERGIA">Energía (J)</option></select>
                            <input type="number" step="0.01" name="rango_min" placeholder="Rango Mín." value={p.rango_min} onChange={(e) => handleParamChange(index, e)} />
                            <input type="number" step="0.01" name="rango_max" placeholder="Rango Máx." value={p.rango_max} onChange={(e) => handleParamChange(index, e)} />
                            <button type="button" onClick={() => removeParametro(index)} className="button-delete-param">-</button>
                          </div>
                        ))}
                        <button type="button" onClick={addParametro} className="button-add-param">+ Añadir Parámetro</button>
                    </fieldset>
                    <fieldset>
                        <legend>5. Mantenimiento y Calibración</legend>
                         <div className="form-grid-three">
                           <div className="input-group"><label>Frecuencia Mantenimiento (meses)</label><input type="number" name="frecuencia_mantenimiento_meses" value={formData.frecuencia_mantenimiento_meses} onChange={handleChange} min="1" /></div>
                           <div className="input-group"><label>Frecuencia Calibración (meses)</label><input type="number" name="frecuencia_calibracion_meses" value={formData.frecuencia_calibracion_meses} onChange={handleChange} min="1" disabled={!formData.requiere_calibracion} /></div>
                           <div className="input-group-checkbox standalone"><input type="checkbox" name="requiere_calibracion" id="requiere_calibracion" checked={formData.requiere_calibracion} onChange={handleChange} /><label htmlFor="requiere_calibracion">Requiere Calibración</label></div>
                         </div>
                    </fieldset>

                    <fieldset>
                        <legend>6. Documentación y Soporte</legend>
                        <div className="form-grid-docs">
                            {documentosPredefinidos.map(nombre => (
                                <DocumentoUploader 
                                    key={nombre}
                                    label={nombre}
                                    onFileChange={(file) => handleDocumentoChange(nombre, file)}
                                />
                            ))}
                        </div>
                        <div style={{marginTop: '1.5rem', borderTop: '1px solid #e0e0e0', paddingTop: '1.5rem'}}>
                            <label>Otros Documentos:</label>
                            {otrosDocumentos.map(doc => (
                                <OtroDocumentoUploader 
                                    key={doc.id}
                                    id={doc.id}
                                    onUpdate={updateOtroDocumento}
                                    onRemove={removeOtroDocumento}
                                />
                            ))}
                            <button type="button" onClick={addOtroDocumento} className="button-add-param" style={{marginTop: '0.5rem'}}>
                                + Añadir Otro Documento
                            </button>
                        </div>
                    </fieldset>

                    {equipoToEdit && (
                        <fieldset>
                            <legend>Registro de Cambio</legend>
                            <div className="input-group">
                                <label htmlFor="motivo_cambio">Motivo de la Modificación (Obligatorio)</label>
                                <textarea 
                                    id="motivo_cambio"
                                    name="motivo_cambio"
                                    rows="3"
                                    value={motivoCambio}
                                    onChange={(e) => setMotivoCambio(e.target.value)}
                                ></textarea>
                            </div>
                        </fieldset>
                    )}

                    {error && <p className="error-message">{error}</p>}

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="button-secondary">Cancelar</button>
                        <button type="submit" className="button-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AddEquipoModal;
