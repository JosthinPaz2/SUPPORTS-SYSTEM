import React, { useState } from 'react'
import './Login.css'
import ForgotPassword from './ForgotPassword.jsx'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showForgot, setShowForgot] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    // Validación simple
    if (!email || !password) {
      setError('Por favor complete todos los campos')
      return
    }

    // Simulación de autenticación
    // En producción, esto llamaría a una API backend
    if (email === 'ssegur403@gmail.com' && password === '123456') {
      localStorage.setItem('user', JSON.stringify({ email, loggedIn: true }))
      alert('¡Inicio de sesión exitoso!')
      // Aquí redirigirías al dashboard
      window.location.href = '/dashboard'
    } else {
      setError('Usuario o contraseña incorrectos')
    }
  }

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} />
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <div className="lock-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1C6.48 1 2 5.48 2 11v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V11c0-5.52-4.48-10-10-10zm0 2c4.42 0 8 3.58 8 8v2H4v-2c0-4.42 3.58-8 8-8zm0 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
          </svg>
        </div>

        <h1>Sistema de Mesa de Ayuda</h1>
        <p className="subtitle">Inicie sesión para continuar</p>

        <div className="login-box">
          <h2>Iniciar Sesión</h2>
          <p className="instruction">Ingrese sus credenciales para acceder al sistema</p>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Usuario</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ssegur403@gmail.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button 
              type="button" 
              className="forgot-password"
              onClick={() => setShowForgot(true)}
            >
              ¿Olvidó su contraseña?
            </button>

            <button type="submit" className="btn-login">
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
