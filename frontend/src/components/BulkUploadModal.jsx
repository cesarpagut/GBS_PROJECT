import React, { useState } from 'react';
import apiClient from '../services/api';

function BulkUploadModal({ onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Por favor, selecciona un archivo Excel.');
            return;
        }
        setIsSubmitting(true);
        setError('');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post('/inventory/equipos/bulk_upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert(response.data.message);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Ocurrió un error al subir el archivo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Carga Masiva de Equipos</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p>Selecciona un archivo Excel (.xlsx) para cargar múltiples hojas de vida.</p>
                        <p><strong>Importante:</strong> El archivo debe contener exactamente las siguientes columnas en este orden:</p>
                        <ul className="column-list">
                            <li>nombre_equipo</li>
                            <li>marca</li>
                            <li>modelo</li>
                            <li>serie</li>
                            <li>codigo_interno</li>
                            <li>ubicacion</li>
                            <li>area_servicio</li>
                            <li>registro_sanitario</li>
                        </ul>
                        <div className="input-group">
                            <label htmlFor="bulk-file">Archivo Excel</label>
                            <input type="file" id="bulk-file" onChange={handleFileChange} accept=".xlsx, .xls" required />
                        </div>
                        {error && <p className="error-message">{error}</p>}
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="button-secondary">Cancelar</button>
                        <button type="submit" className="button-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Subiendo...' : 'Subir Archivo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default BulkUploadModal;