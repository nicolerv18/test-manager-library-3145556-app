import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export interface Loan {
  id: string
  member_id: string
  loaned_at: string
  status: 'open' | 'overdue' | 'closed'
  items: LoanItem[]
}

export interface LoanItem {
  id: string
  book_id: string
  book_title: string
  isbn: string
  category_name: string
  due_at: string
  returned_at: string | null
}

export default function LoansList() {
  const navigate = useNavigate()
  
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState('')
  const [memberId, setMemberId] = useState('')
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams({
          from: from || undefined,
          to: to || undefined,
          status: status || undefined,
          member_id: memberId || undefined,
          page: page.toString(),
          size: size.toString(),
        })
        
        const data = await api.get<{
          items: Loan[]
          page: number
          size: number
          total: number
        }>(`/loans?${params.toString()}`)
        
        setLoans(data.items)
        setTotal(data.total)
      } catch (err: any) {
        setError(err.error?.message || 'Error cargando préstamos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [from, to, status, memberId, page, size])

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
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="page loans-list">
      <div className="page-header">
        <h1>Préstamos</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/loans/new')}
        >
          + Nuevo préstamo
        </button>
      </div>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="Desde"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Hasta"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="open">Pendiente</option>
          <option value="overdue">Vencido</option>
          <option value="closed">Devuelto</option>
        </select>
        <input
          type="text"
          placeholder="Filtrar por socio..."
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
        />
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {loading && loans.length === 0 ? (
        <div className="loading">Cargando...</div>
      ) : loans.length === 0 ? (
        <div className="empty">No se encontraron préstamos</div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Socio</th>
                  <th>Estado</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr
                    key={loan.id}
                    onClick={() => navigate(`/loans/${loan.id}`)}
                    className="clickable-row"
                  >
                    <td>{loan.id.substring(0, 8)}...</td>
                    <td>{formatDate(loan.loaned_at)}</td>
                    <td>{loan.member_id.substring(0, 8)}...</td>
                    <td className={getStatusClass(loan.status)}>
                      {getStatusLabel(loan.status)}
                    </td>
                    <td>{loan.items.length} libro(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {total > size && (
            <div className="pagination">
              <button
                className="btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                Página {page} de {Math.ceil(total / size)} ({total} préstamos)
              </span>
              <button
                className="btn"
                onClick={() => setPage(p => Math.min(Math.ceil(total / size), p + 1))}
                disabled={page === Math.ceil(total / size)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
