import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import { fetchBlob } from '../api/client'

export interface Category {
  id: string
  name: string
}

export default function BookForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [isbn, setIsbn] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [totalCopies, setTotalCopies] = useState(1)
  const [cover, setCover] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverRemoved, setCoverRemoved] = useState(false)

  const [book, setBook] = useState<{
    id: string
    title: string
    author: string
    isbn: string
    category_id: string
    total_copies: number
    available_copies: number
    cover_key: string | null
  } | null>(null)

  useEffect(() => {
    // Load categories
    const loadCategories = async () => {
      try {
        const data = await api.get<{ items: Category[] }>('/categories')
        setCategories(data.items)
      } catch (err: any) {
        setError(err.error?.message || 'Error cargando categorías')
      }
    }
    loadCategories()
    
    // Load existing book if editing
    if (id) {
      const loadBook = async () => {
        try {
          const data = await api.get<{
            id: string
            title: string
            author: string
            isbn: string
            category_id: string
            total_copies: number
            available_copies: number
            cover_key: string | null
          }>(`/books/${id}`)
          setBook(data)
          setTitle(data.title)
          setAuthor(data.author)
          setIsbn(data.isbn)
          setCategoryId(data.category_id)
          setTotalCopies(data.total_copies)
          if (data.cover_key) {
            const blob = await fetchBlob(`/books/${data.id}/cover`)
            if (blob) setCoverPreview(URL.createObjectURL(blob))
          }
        } catch (err: any) {
          setError(err.error?.message || 'Error cargando libro')
        }
      }
      loadBook()
    }
  }, [id])

  const validateIsbn = (value: string): boolean => {
    return /^\d{13}$/.test(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (id) {
        // Update existing book (JSON, per the contract)
        await api.put(`/books/${id}`, {
          title: title.trim(),
          author: author.trim(),
          category_id: categoryId,
          total_copies: totalCopies,
        })
        // Cover is a separate multipart route: PUT /books/{id}/cover
        if (cover) {
          const formData = new FormData()
          formData.append('file', cover)
          await api.upload(`/books/${id}/cover`, formData)
        } else if (coverRemoved) {
          await api.delete(`/books/${id}/cover`)
        }
      } else {
        // Create new book (JSON), then upload the cover if one was chosen
        const created = await api.post<{ id: string }>('/books', {
          title: title.trim(),
          author: author.trim(),
          isbn,
          category_id: categoryId,
          total_copies: totalCopies,
        })
        if (cover) {
          const formData = new FormData()
          formData.append('file', cover)
          await api.upload(`/books/${created.id}/cover`, formData)
        }
      }

      setSuccess(true)
      setTimeout(() => navigate('/books'), 1500)
    } catch (err: any) {
      setError(err.error?.message || 'Error guardando libro')
    } finally {
      setLoading(false)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setError('La portada debe ser JPG o PNG')
        return
      }
      // Validate file size (2 MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('La portada debe ser menor a 2 MB')
        return
      }
      
      setCover(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleCoverRemove = () => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview)
    setCover(null)
    setCoverPreview(null)
    setCoverRemoved(true)
  }

  if (success) {
    return (
      <div className="page">
        <div className="alert alert-success">¡Libro guardado exitosamente!</div>
      </div>
    )
  }

  return (
    <div className="page book-form">
      <div className="page-header">
        <h1>{id ? 'Editar libro' : 'Nuevo libro'}</h1>
        <button className="btn" onClick={() => navigate('/books')}>
          ← Volver al catálogo
        </button>
      </div>
      
      {error && <div className="alert alert-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="title">Título *</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Cien años de soledad"
            required
            maxLength={250}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="author">Autor *</label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Ej. Gabriel García Márquez"
            required
            maxLength={200}
            disabled={loading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="isbn">ISBN (13 dígitos) *</label>
          <input
            id="isbn"
            type="text"
            value={isbn}
            onChange={(e) => setIsbn(e.target.value)}
            placeholder="Ej. 9780307474728"
            required
            pattern="\d{13}"
            title="El ISBN debe tener 13 dígitos"
            disabled={loading}
          />
          {!validateIsbn(isbn) && isbn.length > 0 && (
            <span className="field-error">El ISBN debe tener 13 dígitos</span>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="category_id">Categoría *</label>
          <select
            id="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            disabled={loading}
          >
            <option value="">Selecciona una categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="total_copies">Total de ejemplares *</label>
          <input
            id="total_copies"
            type="number"
            value={totalCopies}
            onChange={(e) => setTotalCopies(Math.max(1, parseInt(e.target.value) || 1))}
            min={1}
            required
            disabled={loading}
          />
        </div>
        
        {id && coverPreview && book?.cover_key && (
          <div className="form-group">
            <label>Portada actual</label>
            <div className="cover-preview">
              <img src={coverPreview} alt="Portada" />
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={handleCoverRemove}
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="cover">Subir portada (JPG/PNG, max 2 MB)</label>
          <input
            id="cover"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleCoverChange}
            disabled={loading}
          />
          {cover && !coverPreview && (
            <span className="file-name">Seleccionado: {cover.name}</span>
          )}
        </div>
        
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : id ? 'Guardar cambios' : 'Crear libro'}
          </button>
        </div>
      </form>
    </div>
  )
}
