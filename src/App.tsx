import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import NavBar from './components/NavBar'
import RequireAuth from './auth/RequireAuth'
import RequireRole from './auth/RequireRole'

// Pages
import Login from './pages/Login'
import BooksList from './pages/BooksList'
import BookForm from './pages/BookForm'
import MembersList from './pages/MembersList'
import LoansNew from './pages/LoansNew'
import LoansList from './pages/LoansList'
import LoanDetail from './pages/LoanDetail'
import OverdueList from './pages/OverdueList'
import ReportMostBorrowed from './pages/ReportMostBorrowed'
import UserForm from './pages/UserForm'

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={
            <RequireAuth>
              <Routes>
                <Route path="/books" element={<BooksList />} />
                <Route path="/books/new" element={
                  <RequireRole allowed={['admin']}>
                    <BookForm />
                  </RequireRole>
                } />
                <Route path="/books/:id/edit" element={
                  <RequireRole allowed={['admin']}>
                    <BookForm />
                  </RequireRole>
                } />
                
                <Route path="/members" element={<MembersList />} />
                
                <Route path="/loans/new" element={<LoansNew />} />
                <Route path="/loans" element={<LoansList />} />
                <Route path="/loans/:id" element={<LoanDetail />} />
                
                <Route path="/overdue" element={<OverdueList />} />
                
                <Route path="/reports/most-borrowed" element={
                  <RequireRole allowed={['admin']}>
                    <ReportMostBorrowed />
                  </RequireRole>
                } />
                
                <Route path="/users/new" element={
                  <RequireRole allowed={['admin']}>
                    <UserForm />
                  </RequireRole>
                } />
                
                <Route path="*" element={<div>404 - Página no encontrada</div>} />
              </Routes>
            </RequireAuth>
          } />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
