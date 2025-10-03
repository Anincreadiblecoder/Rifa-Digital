import { useState, useEffect } from 'react'
import AdminPanel from './components/AdminPanel.jsx'
import RifaPage from './components/RifaPage.jsx'
import RifaDetailsPage from './components/RifaDetailsPage.jsx'
import LoginPage from './components/LoginPage.jsx'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('rifa') // 'rifa', 'admin', 'details', ou 'login'
  const [rifaId, setRifaId] = useState(null)
  const [selectedRifaForDetails, setSelectedRifaForDetails] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Verificar parâmetros da URL ao carregar
  useEffect(() => {
    // Verificar se já está autenticado
    const authToken = localStorage.getItem('epav-admin-auth')
    if (authToken) {
      // Verificar se o token ainda é válido (24 horas)
      const authData = JSON.parse(authToken)
      const now = new Date().getTime()
      if (now - authData.timestamp < 24 * 60 * 60 * 1000) { // 24 horas
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('epav-admin-auth')
      }
    }

    const urlParams = new URLSearchParams(window.location.search)
    const rifaParam = urlParams.get('rifa')
    const adminParam = urlParams.get('admin')
    const detailsParam = urlParams.get('details')

    if (adminParam === 'true') {
      setCurrentView('login') // Sempre mostrar login primeiro
    } else if (detailsParam && rifaParam) {
      setRifaId(rifaParam)
      setCurrentView('details')
      // Carregar dados da rifa do localStorage para a página de detalhes
      const rifas = JSON.parse(localStorage.getItem('epav-rifas') || '[]')
      const rifa = rifas.find(r => r.id === rifaParam)
      if (rifa) {
        setSelectedRifaForDetails(rifa)
      }
    } else if (rifaParam) {
      setRifaId(rifaParam)
      setCurrentView('rifa')
    } else {
      setCurrentView('rifa')
    }
  }, [])

  const goToAdmin = () => {
    setCurrentView('login') // Sempre mostrar login primeiro
    // Atualizar URL sem recarregar a página
    const newUrl = new URL(window.location)
    newUrl.searchParams.set('admin', 'true')
    newUrl.searchParams.delete('rifa')
    window.history.pushState({}, '', newUrl)
  }

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true)
      setCurrentView('admin')
      // Salvar token de autenticação
      const authData = {
        timestamp: new Date().getTime(),
        authenticated: true
      }
      localStorage.setItem('epav-admin-auth', JSON.stringify(authData))
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('epav-admin-auth')
    goToRifa()
  }

  const goToRifa = (selectedRifaId = null) => {
    setCurrentView('rifa')
    if (selectedRifaId) {
      setRifaId(selectedRifaId)
      // Atualizar URL sem recarregar a página
      const newUrl = new URL(window.location)
      newUrl.searchParams.set('rifa', selectedRifaId)
      newUrl.searchParams.delete('admin')
      newUrl.searchParams.delete('details')
      window.history.pushState({}, '', newUrl)
    } else {
      // Limpar URL
      const newUrl = new URL(window.location)
      newUrl.searchParams.delete('rifa')
      newUrl.searchParams.delete('admin')
      newUrl.searchParams.delete('details')
      window.history.pushState({}, '', newUrl)
    }
  }

  const goToRifaDetails = (rifa) => {
    setSelectedRifaForDetails(rifa)
    setRifaId(rifa.id)
    setCurrentView('details')
    // Atualizar URL sem recarregar a página
    const newUrl = new URL(window.location)
    newUrl.searchParams.set('rifa', rifa.id)
    newUrl.searchParams.set('details', 'true')
    newUrl.searchParams.delete('admin')
    window.history.pushState({}, '', newUrl)
  }

  if (currentView === 'login') {
    return <LoginPage onLogin={handleLogin} onBack={() => goToRifa()} />
  }

  if (currentView === 'admin' && isAuthenticated) {
    return <AdminPanel onBackToRifa={() => goToRifa()} onViewRifaDetails={goToRifaDetails} onLogout={handleLogout} />
  }

  if (currentView === 'details' && isAuthenticated) {
    return <RifaDetailsPage rifa={selectedRifaForDetails} onBack={() => goToAdmin()} />
  }

  // Se tentar acessar admin ou details sem estar autenticado, redirecionar para login
  if ((currentView === 'admin' || currentView === 'details') && !isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onBack={() => goToRifa()} />
  }

  return <RifaPage rifaId={rifaId} onGoToAdmin={goToAdmin} />
}

export default App
