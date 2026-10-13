import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export interface ReportRow {
  book_id: string
  book_title: string
  category_name: string
  times_borrowed: number
}

export default function ReportMostBorrowed() {
  const navigate = useNavigate()
  
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [report, setReport] = useState<{ from: string; to: string; rows: ReportRow[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!from || !to) {
      setError('Por favor, selecciona un rango de fechas')
      setLoading(false)
      return
    }

    // Validate dates
    if (new Date(to) < new Date(from)) {
      setError('La fecha final debe ser mayor o igual a la fecha inicial')
      setLoading(false)
      return
    }

    try {
      const query = new URLSearchParams({
        from: from,
        to: to,
      })
      
      const data = await api.get<{ from: string; to: string; rows: ReportRow[] }>(
        `/reports/most-borrowed?${query.toString()}`
      )
      
      setReport(data)
    } catch (err: any) {
      setError(err.error?.message || 'Error generando informe')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="page report-most-borrowed">
      <div className="page-header">
        <h1>Libros más Prestados</h1>
        <button className="btn" onClick={() => navigate('/books')}>
          ← Volver al catálogo
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="from">Desde</label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="to">Hasta</label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generando...' : 'Generar Informe'}
          </button>
        </div>
      </form>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {report && (
        <div className="report-result">
          <h2>Reporte: {formatDate(report.from)} - {formatDate(report.to)}</h2>
          
          {report.rows.length === 0 ? (
            <div className="empty">No hubo préstamos en este rango de fechas</div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Libro</th>
                      <th>Categoría</th>
                      <th>Veces prestado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr key={row.book_id}>
                        <td>{row.book_title}</td>
                        <td>{row.category_name}</td>
                        <td className="times-borrowed">{row.times_borrowed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="summary">
                Total de libros en el reporte: {report.rows.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
