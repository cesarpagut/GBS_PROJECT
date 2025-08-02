import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

function AddEquipoModal({ onClose, onSuccess, equipoToEdit }) {
  const [formData, setFormData] = useState({
    nombre_equipo: '', marca: '', modelo: '', serie: '', codigo_interno: '',
    area_servicio: '', ubicacion: '', foto_equipo: null, registro_sanitario_aplica: true,
    registro_sanitario: '', clasificacion_riesgo: 'I', clasificacion_uso: 'DIAGNOSTICO',
    fecha_adquisicion: '', forma_adquisicion: 'COMPRA_NUEVO', proveedor: '',
    precio_no_registra: false, precio: '', garantia_anios: 1, vida_util_anios: 10,
    voltaje_vdc: '', voltaje_vdc_na: false, voltaje_vac: '', voltaje_vac_na: false,
    corriente: '', corriente_na: false, potencia: '', potencia_na: false,
    frecuencia: '', frecuencia_na: false, temperatura: '', temperatura_na: false,
    peso: '', peso_na: false, tecnologia_predominante: 'ELECTRONICO',
    fuente_neumatica: false, fuente_hidraulica: false, fuente_combustion: false,
    frecuencia_mantenimiento_meses: 6, requiere_calibracion: false,
    frecuencia_calibracion_meses: '', estado_actual: 'FUNCIONAL',
    tiene_manual_usuario: false, tiene_manual_servicio: false, tiene_guia_rapida: false,
    tiene_registro_importacion: false, tiene_carta_garantia: false,
  });
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
        } else {
          if (typeof formData[key] === 'boolean') {
            editData[key] = false;
          } else {
            editData[key] = '';
          }
        }
      }
      setFormData(editData);
      if (equipoToEdit.parametros) {
        setParametros(equipoToEdit.parametros);
      }
    }
  }, [equipoToEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prevState => ({ ...prevState, [name]: val }));
  };
  
  const handleFileChange = (e) => {
    setFormData(prevState => ({ ...prevState, foto_equipo: e.target.files[0] }));
  };

  const handleParamChange = (index, e) => {
    const newParametros = [...parametros];
    newParametros[index][e.target.name] = e.target.value;
    setParametros(newParametros);
  };

  const addParametro = () => {
    setParametros([...parametros, { parametro: 'RPM', rango_min: '', rango_max: '' }]);
  };

  const removeParametro = (index) => {
    const newParametros = [...parametros];
    newParametros.splice(index, 1);
    setParametros(newParametros);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let dataToSubmit = { ...formData };

    if (!equipoToEdit) {
        const requiredFields = ['nombre_equipo', 'marca', 'modelo', 'serie', 'codigo_interno', 'area_servicio', 'ubicacion'];
        for (const field of requiredFields) {
            if (!dataToSubmit[field]) {
                setError(`El campo '${field}' es obligatorio para crear un nuevo equipo.`);
                return;
            }
        }
    }

    if (!dataToSubmit.registro_sanitario_aplica) {
        dataToSubmit.registro_sanitario = 'no requiere';
        dataToSubmit.clasificacion_riesgo = 'N/A';
    }

    if (!dataToSubmit.proveedor) {
        dataToSubmit.proveedor = 'no registra';
    }

    if (dataToSubmit.precio_no_registra) {
        dataToSubmit.precio = null;
    }

    const techFields = ['voltaje_vdc', 'voltaje_vac', 'corriente', 'potencia', 'frecuencia', 'temperatura', 'peso'];
    for (const field of techFields) {
        if (dataToSubmit[`${field}_na`]) {
            dataToSubmit[field] = 'N/A';
        } else if (!dataToSubmit[field]) {
            setError(`El campo técnico '${field}' es obligatorio si no está marcado como N/A.`);
            return;
        }
    }

    if (!dataToSubmit.requiere_calibracion) {
        dataToSubmit.frecuencia_calibracion_meses = 'N/A';
    } else if (!dataToSubmit.frecuencia_calibracion_meses) {
        setError('La Frecuencia de Calibración es obligatoria si el equipo la requiere.');
        return;
    }

    if (equipoToEdit && !motivoCambio.trim()) {
        setError('El motivo del cambio es obligatorio al editar un equipo.');
        return;
    }

    setIsSubmitting(true);
    const submissionData = new FormData();
    for (const key in dataToSubmit) {
      if (dataToSubmit[key] !== null && dataToSubmit[key] !== undefined) {
          submissionData.append(key, dataToSubmit[key]);
      }
    }
    submissionData.append('parametros', JSON.stringify(parametros));
    if (equipoToEdit) {
        submissionData.append('motivo_cambio', motivoCambio);
    }

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (equipoToEdit) {
        await apiClient.put(`/inventory/equipos/${equipoToEdit.id}/`, submissionData, config);
        alert('¡Equipo actualizado con éxito!');
      } else {
        await apiClient.post('/inventory/equipos/', submissionData, config);
        alert('¡Equipo añadido con éxito!');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error al guardar equipo:', err.response?.data);
      setError('No se pudo guardar el equipo. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalTitle = equipoToEdit ? 'Editar Hoja de Vida' : 'Crear Hoja de Vida';

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
              <div className="input-group"><label>Nombre del Equipo</label><input type="text" name="nombre_equipo" value={formData.nombre_equipo} onChange={handleChange} /></div>
              <div className="input-group"><label>Marca</label><input type="text" name="marca" value={formData.marca} onChange={handleChange} /></div>
              <div className="input-group"><label>Modelo</label><input type="text" name="modelo" value={formData.modelo} onChange={handleChange} /></div>
              <div className="input-group"><label>Serie</label><input type="text" name="serie" value={formData.serie} onChange={handleChange} /></div>
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
              <div className="input-group"><label>Proveedor</label><input type="text" name="proveedor" value={formData.proveedor} onChange={handleChange} /></div>
              <div className="input-group"><label>Precio (COP)</label><input type="number" step="0.01" name="precio" value={formData.precio} onChange={handleChange} disabled={formData.precio_no_registra} /></div>
              <div className="input-group-checkbox standalone"><input type="checkbox" name="precio_no_registra" id="precio_no_registra" checked={formData.precio_no_registra} onChange={handleChange} /><label htmlFor="precio_no_registra">No Registra Precio</label></div>
              <div className="input-group"><label>Garantía (años)</label><input type="number" name="garantia_anios" value={formData.garantia_anios} onChange={handleChange} min="0" /></div>
              <div className="input-group"><label>Vida Útil (años)</label><input type="number" name="vida_util_anios" value={formData.vida_util_anios} onChange={handleChange} min="0" /></div>
            </div>
          </fieldset>

          <fieldset>
            <legend>3. Características Técnicas (De funcionamiento)</legend>
            <div className="form-grid-four">
              <div className="input-group with-na"><label>Voltaje (Vdc)</label><input type="number" step="0.01" name="voltaje_vdc" value={formData.voltaje_vdc} onChange={handleChange} disabled={formData.voltaje_vdc_na} /><div className="na-checkbox"><input type="checkbox" name="voltaje_vdc_na" id="voltaje_vdc_na" checked={formData.voltaje_vdc_na} onChange={handleChange} /><label htmlFor="voltaje_vdc_na">N/A</label></div></div>
              <div className="input-group with-na"><label>Voltaje (Vac)</label><input type="number" step="0.01" name="voltaje_vac" value={formData.voltaje_vac} onChange={handleChange} disabled={formData.voltaje_vac_na} /><div className="na-checkbox"><input type="checkbox" name="voltaje_vac_na" id="voltaje_vac_na" checked={formData.voltaje_vac_na} onChange={handleChange} /><label htmlFor="voltaje_vac_na">N/A</label></div></div>
              <div className="input-group with-na"><label>Corriente (A)</label><input type="number" step="0.01" name="corriente" value={formData.corriente} onChange={handleChange} disabled={formData.corriente_na} /><div className="na-checkbox"><input type="checkbox" name="corriente_na" id="corriente_na" checked={formData.corriente_na} onChange={handleChange} /><label htmlFor="corriente_na">N/A</label></div></div>
              <div className="input-group with-na"><label>Potencia (W)</label><input type="number" step="0.01" name="potencia" value={formData.potencia} onChange={handleChange} disabled={formData.potencia_na} /><div className="na-checkbox"><input type="checkbox" name="potencia_na" id="potencia_na" checked={formData.potencia_na} onChange={handleChange} /><label htmlFor="potencia_na">N/A</label></div></div>
              <div className="input-group with-na"><label>Frecuencia (Hz)</label><input type="number" step="0.01" name="frecuencia" value={formData.frecuencia} onChange={handleChange} disabled={formData.frecuencia_na} /><div className="na-checkbox"><input type="checkbox" name="frecuencia_na" id="frecuencia_na" checked={formData.frecuencia_na} onChange={handleChange} /><label htmlFor="frecuencia_na">N/A</label></div></div>
              <div className="input-group with-na"><label>Temperatura (°C)</label><input type="number" step="0.01" name="temperatura" value={formData.temperatura} onChange={handleChange} disabled={formData.temperatura_na} /><div className="na-checkbox"><input type="checkbox" name="temperatura_na" id="temperatura_na" checked={formData.temperatura_na} onChange={handleChange} /><label htmlFor="temperatura_na">N/A</label></div></div>
              <div className="input-group with-na"><label>Peso (Kg)</label><input type="number" step="0.01" name="peso" value={formData.peso} onChange={handleChange} disabled={formData.peso_na} /><div className="na-checkbox"><input type="checkbox" name="peso_na" id="peso_na" checked={formData.peso_na} onChange={handleChange} /><label htmlFor="peso_na">N/A</label></div></div>
            </div>
            <div className="form-grid-two">
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
                <div className="input-group-checkbox"><input type="checkbox" name="tiene_manual_usuario" id="tiene_manual_usuario" checked={formData.tiene_manual_usuario} onChange={handleChange} /><label htmlFor="tiene_manual_usuario">Manual de Usuario</label></div>
                <div className="input-group-checkbox"><input type="checkbox" name="tiene_manual_servicio" id="tiene_manual_servicio" checked={formData.tiene_manual_servicio} onChange={handleChange} /><label htmlFor="tiene_manual_servicio">Manual de Servicio</label></div>
                <div className="input-group-checkbox"><input type="checkbox" name="tiene_guia_rapida" id="tiene_guia_rapida" checked={formData.tiene_guia_rapida} onChange={handleChange} /><label htmlFor="tiene_guia_rapida">Guía Rápida</label></div>
                <div className="input-group-checkbox"><input type="checkbox" name="tiene_carta_garantia" id="tiene_carta_garantia" checked={formData.tiene_carta_garantia} onChange={handleChange} /><label htmlFor="tiene_carta_garantia">Carta de Garantía</label></div>
                <div className="input-group-checkbox"><input type="checkbox" name="tiene_registro_importacion" id="tiene_registro_importacion" checked={formData.tiene_registro_importacion} onChange={handleChange} /><label htmlFor="tiene_registro_importacion">Registro de Importación</label></div>
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
