import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { fetchBlob } from '../api/client'

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: { id: string; name: string }
  total_copies: number
  available_copies: number
  cover_key: string | null
}

export interface Category {
  id: string
  name: string
}

export default function BooksList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [q, setQ] = useState(searchParams.get('q') ?? '')
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') ?? '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'))
  const [size] = useState(10)
  const [total, setTotal] = useState(0)
  const [coverUrls, setCoverUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await api.get<{ items: Category[] }>('/categories')
        setCategories(data.items)
      } catch (err: any) {
        setError(err.error?.message || 'Error cargando categorías')
      }
    }
    loadCategories()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const query = new URLSearchParams({
          q: q || undefined,
          category_id: categoryId || undefined,
          page: page.toString(),
          size: size.toString(),
        })
        
        const data = await api.get<{
          items: Book[]
          page: number
          size: number
          total: number
        }>(`/books?${query.toString()}`)
        
        setBooks(data.items)
        setTotal(data.total)
      } catch (err: any) {
        setError(err.error?.message || 'Error cargando catálogo')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [q, categoryId, page, size])

  useEffect(() => {
    // Update URL without re-rendering
    const params = new URLSearchParams({ page: page.toString() })
    if (q) params.set('q', q)
    if (categoryId) params.set('category_id', categoryId)
    setSearchParams(params)
  }, [q, categoryId, page, setSearchParams])

  // Fetch cover blobs
  useEffect(() => {
    const fetchCovers = async () => {
      const newUrls: Record<string, string> = {}
      
      for (const book of books) {
        if (book.cover_key) {
          const blob = await fetchBlob(`/books/${book.id}/cover`)
          if (blob) {
            newUrls[book.id] = URL.createObjectURL(blob)
          }
        }
      }
      
      setCoverUrls((prev) => ({ ...prev, ...newUrls }))
    }
    
    if (books.length > 0) {
      fetchCovers()
    }
    
    return () => {
      // Cleanup blob URLs
      Object.values(coverUrls).forEach((url) => URL.revokeObjectURL(url))
    }
  }, [books, coverUrls])

  const handleCoverClick = (book: Book) => {
    if (book.cover_key) {
      window.open(coverUrls[book.id], '_blank')
    }
  }

  const totalPages = Math.ceil(total / size)

  return (
    <div className="page books-list">
      <div className="page-header">
        <h1>Catálogo</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/books/new')}
        >
          + Agregar libro
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar por título o autor..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input-search"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      {loading && books.length === 0 ? (
        <div className="loading">Cargando...</div>
      ) : books.length === 0 ? (
        <div className="empty">No se encontraron libros</div>
      ) : (
        <>
          <div className="book-grid">
            {books.map((book) => (
              <div key={book.id} className="book-card">
                <div
                  className="book-cover"
                  onClick={() => handleCoverClick(book)}
                  style={{ cursor: 'pointer' }}
                >
                  {coverUrls[book.id] ? (
                    <img src={coverUrls[book.id]} alt={book.title} />
                  ) : (
                    <span className="cover-placeholder">📚</span>
                  )}
                </div>
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <div className="book-meta">
                    <span className="book-category">{book.category.name}</span>
                    <span className="book-isbn">ISBN: {book.isbn}</span>
                  </div>
                  <div className="book-copies">
                    Disponibles: {book.available_copies} / {book.total_copies}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                Página {page} de {totalPages} ({total} libros)
              </span>
              <button
                className="btn"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
