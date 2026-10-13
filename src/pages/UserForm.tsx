import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export default function UserForm() {
  const navigate = useNavigate()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('librarian')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await api.post('/users', {
        username: username.trim(),
        password,
        role,
      })
      
      setSuccess(true)
      setTimeout(() => navigate('/books'), 1500)
    } catch (err: any) {
      setError(err.error?.message || 'Error creando usuario')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="page">
        <div className="alert alert-success">
          ¡Usuario creado exitosamente!
        </div>
      </div>
    )
  }

  return (
    <div className="page user-form">
      <div className="page-header">
        <h1>Crear Usuario</h1>
        <button className="btn" onClick={() => navigate('/books')}>
          ← Volver al catálogo
        </button>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="username">Usuario *</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej. bibliotecario"
            required
            disabled={loading}
          />
          <p className="form-hint">El nombre de usuario se guardará en minúsculas</p>
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Contraseña *</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa una contraseña segura"
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="role">Rol</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
          >
            <option value="librarian">Bibliotecario</option>
            <option value="admin" disabled>
              Admin (no disponible)
            </option>
          </select>
          <p className="form-hint">Solo se pueden crear usuarios con rol "librarian"</p>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
        </div>
      </form>
    </div>
  )
}
