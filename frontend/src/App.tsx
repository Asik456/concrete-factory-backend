import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminRoute from './components/AdminRoute'

import Home from './pages/Home'
import Catalog from './pages/Catalog'
import ProductPage from './pages/ProductPage'
import Login from './pages/Login'
import Register from './pages/Register'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import About from './pages/About'
import Contact from './pages/Contact'

import AdminLayout from './pages/admin/AdminLayout'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminUsers from './pages/admin/AdminUsers'
import AdminInquiries from './pages/admin/AdminInquiries'

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/catalog" element={<PublicLayout><Catalog /></PublicLayout>} />
          <Route path="/products/:id" element={<PublicLayout><ProductPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin pages */}
          <Route
            path="/admin"
            element={<AdminRoute><AdminLayout /></AdminRoute>}
          >
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="inquiries" element={<AdminInquiries />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
