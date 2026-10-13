import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

export interface Member {
  id: string
  full_name: string
  document_number: string
}

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  available_copies: number
}

export default function LoansNew() {
  const navigate = useNavigate()
  
  const [members, setMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  
  const [books, setBooks] = useState<Book[]>([])
  const [searchBooks, setSearchBooks] = useState('')
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load initial members for selection
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await api.get<{
          items: Member[]
          total: number
        }>('/members?page=1&size=50')
        setMembers(data.items)
      } catch (err: any) {
        setError(err.error?.message || 'Error cargando socios')
      }
    }
    loadMembers()
  }, [])

  // Search books
  const handleSearchBooks = async (query: string) => {
    if (query.length < 2) {
      setSearchBooks(query)
      return
    }
    
    try {
      const data = await api.get<{
        items: Book[]
      }>(`/books?q=${encodeURIComponent(query)}&page=1&size=10`)
      setSearchBooks(query)
    } catch (err: any) {
      // Silently fail
    }
  }

  const addBook = (book: Book) => {
    if (selectedBooks.some((b) => b.id === book.id)) {
      return
    }
    if (selectedBooks.length >= 3) {
      setError('Un préstamo no puede tener más de 3 libros')
      return
    }
    setSelectedBooks([...selectedBooks, book])
  }

  const removeBook = (bookId: string) => {
    setSelectedBooks(selectedBooks.filter((b) => b.id !== bookId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await api.post<{ id: string }>(`/loans`, {
        member_id: selectedMember?.id,
        items: selectedBooks.map((b) => ({ book_id: b.id })),
      })

      setSuccess(true)
      setTimeout(() => navigate(`/loans/${response.id}`), 1500)
    } catch (err: any) {
      setError(err.error?.message || 'Error registrando préstamo')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="page">
        <div className="alert alert-success">
          ¡Préstamo registrado exitosamente!
        </div>
      </div>
    )
  }

  return (
    <div className="page loans-new">
      <div className="page-header">
        <h1>Nuevo Préstamo</h1>
        <button className="btn" onClick={() => navigate('/loans')}>
          ← Volver a préstamos
        </button>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="member">Socio *</label>
          <select
            id="member"
            value={selectedMember?.id || ''}
            onChange={(e) => {
              const member = members.find((m) => m.id === e.target.value)
              setSelectedMember(member ?? null)
            }}
            required
            disabled={loading}
          >
            <option value="">Selecciona un socio</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name} - {member.document_number}
              </option>
            ))}
          </select>
        </div>
        
        {selectedMember && (
          <div className="member-info">
            <strong>Socio seleccionado:</strong> {selectedMember.full_name} (
            {selectedMember.document_number})
          </div>
        )}
        
        <div className="form-group">
          <label>Libros (1-3) *</label>
          <div className="books-search">
            <input
              type="text"
              placeholder="Buscar libros (mínimo 2 caracteres)..."
              onChange={(e) => handleSearchBooks(e.target.value)}
              disabled={loading}
            />
            
            {searchBooks && (
              <div className="books-results">
                {books.map((book) => (
                  <div key={book.id} className="book-result">
                    <div className="book-result-info">
                      <span className="book-title">{book.title}</span>
                      <span className="book-author">{book.author}</span>
                      <span className="book-isbn">ISBN: {book.isbn}</span>
                      <span className="book-copies">
                        Disponibles: {book.available_copies}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => addBook(book)}
                      disabled={book.available_copies === 0}
                    >
                      Agregar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {selectedBooks.length > 0 && (
            <div className="selected-books">
              <h4>Libros seleccionados ({selectedBooks.length}/3):</h4>
              <ul>
                {selectedBooks.map((book) => (
                  <li key={book.id}>
                    <span>{book.title}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => removeBook(book.id)}
                    >
                      Quitar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {selectedBooks.length === 0 && (
            <p className="form-hint">
              Busca y agrega de 1 a 3 libros al préstamo
            </p>
          )}
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Préstamo'}
          </button>
        </div>
      </form>
    </div>
  )
}
