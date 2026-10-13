import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'

export interface LoanItem {
  id: string
  book_id: string
  book_title: string
  isbn: string
  category_name: string
  due_at: string
  returned_at: string | null
}

export interface Loan {
  id: string
  member_id: string
  loaned_at: string
  status: 'open' | 'overdue' | 'closed'
  items: LoanItem[]
}

export default function LoanDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [returning, setReturning] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadLoan = async () => {
      try {
        const data = await api.get<Loan>(`/loans/${id}`)
        setLoan(data)
      } catch (err: any) {
        setError(err.error?.message || 'Error cargando préstamo')
      } finally {
        setLoading(false)
      }
    }
    loadLoan()
  }, [id])

  const handleReturn = async (itemId: string) => {
    if (!id) return
    
    setReturning(itemId)
    
    try {
      await api.post(`/loans/${id}/items/${itemId}/return`, {})
      
      // Refresh loan data
      const data = await api.get<Loan>(`/loans/${id}`)
      setLoan(data)
    } catch (err: any) {
      setError(err.error?.message || 'Error devolviendo artículo')
    } finally {
      setReturning(null)
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Pendiente'
      case 'overdue':
        return 'Vencido'
      case 'closed':
        return 'Devuelto'
      default:
        return status
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'status-open'
      case 'overdue':
        return 'status-overdue'
      case 'closed':
        return 'status-closed'
      default:
        return ''
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (loading && !loan) {
    return <div className="page loading">Cargando...</div>
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert alert-error">{error}</div>
        <button className="btn" onClick={() => navigate('/loans')}>
          ← Volver a préstamos
        </button>
      </div>
    )
  }

  if (!loan) {
    return <div className="page">Préstamo no encontrado</div>
  }

  return (
    <div className="page loan-detail">
      <div className="page-header">
        <h1>Detalle del Préstamo</h1>
        <button className="btn" onClick={() => navigate('/loans')}>
          ← Volver a préstamos
        </button>
      </div>
      
      <div className="loan-info">
        <h2>Información del préstamo</h2>
        <div className="info-grid">
          <div>
            <span className="info-label">Fecha:</span>
            <span className="info-value">{formatDate(loan.loaned_at)}</span>
          </div>
          <div>
            <span className="info-label">Socio:</span>
            <span className="info-value">{loan.member_id}</span>
          </div>
          <div>
            <span className="info-label">Estado:</span>
            <span className={`info-value ${getStatusClass(loan.status)}`}>
              {getStatusLabel(loan.status)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="loan-items">
        <h2>Artículos</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Libro</th>
              <th>ISBN</th>
              <th>Categoría</th>
              <th>Vence</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loan.items.map((item) => (
              <tr key={item.id}>
                <td>{item.book_title}</td>
                <td>{item.isbn}</td>
                <td>{item.category_name}</td>
                <td>{formatDate(item.due_at)}</td>
                <td>{item.returned_at ? 'Devuelto' : 'Pendiente'}</td>
                <td>
                  {!item.returned_at && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleReturn(item.id)}
                      disabled={returning === item.id}
                    >
                      {returning === item.id ? 'Devolviendo...' : 'Devolver'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
