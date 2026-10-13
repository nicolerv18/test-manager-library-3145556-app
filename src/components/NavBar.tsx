import { Link, useNavigate } from 'react-router-dom';
import { clearSession } from '../api/client';

export default function NavBar() {
  const navigate = useNavigate();
  const role = sessionStorage.getItem('role') ?? '';
  const isAdmin = role === 'admin';

  function logout() {
    clearSession();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">📚 Gestor de Biblioteca</span>
      <ul className="navbar-links">
        <li><Link to="/books">Catálogo</Link></li>
        <li><Link to="/members">Socios</Link></li>
        <li><Link to="/loans/new">Préstamo</Link></li>
        <li><Link to="/loans">Préstamos</Link></li>
        <li><Link to="/overdue">Vencidos</Link></li>
        {isAdmin && <li><Link to="/reports/most-borrowed">Informe</Link></li>}
        {isAdmin && <li><Link to="/users/new">Usuarios</Link></li>}
      </ul>
      <button className="btn btn-sm" onClick={logout}>Cerrar sesión</button>
    </nav>
  );
}