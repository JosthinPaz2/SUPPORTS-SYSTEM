import React, { useState } from 'react'
import './ForgotPassword.css'

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('')
  const [step, setStep] = useState(1) // 1: email, 2: code, 3: new password
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSendCode = (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!email) {
      setError('Por favor ingrese su correo electrónico')
      return
    }

    // Simulación de envío de código
    localStorage.setItem('resetEmail', email)
    localStorage.setItem('resetCode', '123456') // Código de ejemplo
    setMessage('Código enviado a ' + email)
    setStep(2)
  }

  const handleVerifyCode = (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const storedCode = localStorage.getItem('resetCode')
    if (code !== storedCode) {
      setError('Código incorrecto')
      return
    }

    setMessage('Código verificado correctamente')
    setStep(3)
  }

  const handleResetPassword = (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!newPassword || !confirmPassword) {
      setError('Por favor complete todos los campos')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    // Simulación de cambio de contraseña
    const email = localStorage.getItem('resetEmail')
    localStorage.setItem(
      'users',
      JSON.stringify({
        [email]: { password: newPassword }
      })
    )
    
    setMessage('¡Contraseña cambiada exitosamente!')
    setTimeout(() => {
      localStorage.removeItem('resetEmail')
      localStorage.removeItem('resetCode')
      onBack()
    }, 2000)
  }

  return (
    <div className="forgot-container">
      <div className="forgot-content">
        <div className="lock-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
          </svg>
        </div>

        <h1>Recuperar Contraseña</h1>
        <p className="subtitle">Restablece tu contraseña de forma segura</p>

        <div className="forgot-box">
          {step === 1 && (
            <>
              <h2>Paso 1: Verificación de Correo</h2>
              <p className="instruction">Ingrese el correo asociado a su cuenta</p>

              {error && <div className="error-message">⚠️ {error}</div>}
              {message && <div className="success-message">✓ {message}</div>}

              <form onSubmit={handleSendCode}>
                <div className="form-group">
                  <label htmlFor="email">Correo Electrónico</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ssegur403@gmail.com"
                  />
                </div>
                <button type="submit" className="btn-next">
                  Enviar Código
                </button>
              </form>

              <div className="test-info">
                <p><strong>Para pruebas:</strong> Usa cualquier correo</p>
                <p><strong>Código:</strong> 123456</p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2>Paso 2: Verificación de Código</h2>
              <p className="instruction">Ingrese el código enviado a su correo</p>

              {error && <div className="error-message">⚠️ {error}</div>}
              {message && <div className="success-message">✓ {message}</div>}

              <form onSubmit={handleVerifyCode}>
                <div className="form-group">
                  <label htmlFor="code">Código de Verificación</label>
                  <input
                    type="text"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                  />
                </div>
                <button type="submit" className="btn-next">
                  Verificar Código
                </button>
              </form>
            </>
          )}

          {step === 3 && (
            <>
              <h2>Paso 3: Nueva Contraseña</h2>
              <p className="instruction">Ingrese su nueva contraseña</p>

              {error && <div className="error-message">⚠️ {error}</div>}
              {message && <div className="success-message">✓ {message}</div>}

              <form onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label htmlFor="newPassword">Nueva Contraseña</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <button type="submit" className="btn-next">
                  Cambiar Contraseña
                </button>
              </form>
            </>
          )}

          <button className="btn-back" onClick={onBack}>
            ← Volver al Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
