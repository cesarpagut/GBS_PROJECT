import React, { useState, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext'; // Importamos el contexto

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext); // Usamos la función login del contexto

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        email: email,
        password: password,
      });
      // Llamamos a la función login del contexto, que se encargará de todo.
      login(response.data.access, response.data.refresh);
    } catch (err) {
      setError('El email o la contraseña son incorrectos.');
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
        <button type="submit" className="login-button">Acceder</button>
      </form>
    </div>
  );
}

export default LoginPage;