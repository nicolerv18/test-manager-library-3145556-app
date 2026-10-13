import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export interface OverdueLine {
  loan_id: string
  item_id: string
  book_title: string
  member_name: string
  due_at: string
  days_late: number
}

export default function OverdueList() {
  const navigate = useNavigate()
  
  const [overdue, setOverdue] = useState<OverdueLine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOverdue = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const data = await api.get<{ items: OverdueLine[] }>('/loans/overdue')
        setOverdue(data.items)
      } catch (err: any) {
        setError(err.error?.message || 'Error cargando vencidos')
      } finally {
        setLoading(false)
      }
    }
    loadOverdue()
  }, [])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="page overdue-list">
      <div className="page-header">
        <h1>Libros Vencidos</h1>
        <button className="btn" onClick={() => navigate('/loans')}>
          ← Volver a préstamos
        </button>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {loading && overdue.length === 0 ? (
        <div className="loading">Cargando...</div>
      ) : overdue.length === 0 ? (
        <div className="empty">No hay libros vencidos</div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Socio</th>
                  <th>Fecha venc.</th>
                  <th>Días de retraso</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((line) => (
                  <tr key={line.item_id}>
                    <td>{line.book_title}</td>
                    <td>{line.member_name}</td>
                    <td>{formatDate(line.due_at)}</td>
                    <td className="days-late">{line.days_late} días</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="summary">
            Total de líneas vencidas: {overdue.length}
          </div>
        </>
      )}
    </div>
  )
}
