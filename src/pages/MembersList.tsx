import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export interface Member {
  id: string
  full_name: string
  document_number: string
  active_loans?: number
}

export default function MembersList() {
  const navigate = useNavigate()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const params = new URLSearchParams({
          q: q || undefined,
          page: page.toString(),
          size: size.toString(),
        })
        
        const data = await api.get<{
          items: Member[]
          page: number
          size: number
          total: number
        }>(`/members?${params.toString()}`)
        
        setMembers(data.items)
        setTotal(data.total)
      } catch (err: any) {
        setError(err.error?.message || 'Error cargando socios')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [q, page, size])

  return (
    <div className="page members-list">
      <div className="page-header">
        <h1>Socios</h1>
        <button
          className="btn btn-primary"
          onClick={() => alert('Functionality coming soon: create member')}
        >
          + Agregar socio
        </button>
      </div>
      
      {/* Search */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar por nombre o documento..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input-search"
        />
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {loading && members.length === 0 ? (
        <div className="loading">Cargando...</div>
      ) : members.length === 0 ? (
        <div className="empty">No se encontraron socios</div>
      ) : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Préstamos activos</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} onClick={() => navigate(`/loans/${member.id}`)}>
                    <td>{member.full_name}</td>
                    <td>{member.document_number}</td>
                    <td>{member.active_loans ?? 0}</td>
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
                Página {page} de {Math.ceil(total / size)} ({total} socios)
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
