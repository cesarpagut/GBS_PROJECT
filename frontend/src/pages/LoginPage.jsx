import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // --- FIX: Usamos la función 'loginUser' del contexto actualizado ---
    const { loginUser } = useContext(AuthContext);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            // La función loginUser ahora maneja toda la lógica interna
            await loginUser(email, password);
            // La navegación ocurrirá automáticamente desde el contexto si el login es exitoso
        } catch (err) {
            setError('El email o la contraseña son incorrectos.');
            console.error("Login failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Iniciar Sesión</h2>
                <p>Software de Gestión Biomédica</p>
                <div className="input-group">
                    <label htmlFor="email">Correo Electrónico</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" className="login-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Accediendo...' : 'Acceder'}
                </button>
            </form>
        </div>
    );
}

export default LoginPage;