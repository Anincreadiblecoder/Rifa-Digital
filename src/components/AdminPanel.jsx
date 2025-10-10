import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService.js'
import { SystemStatus } from './SystemStatus.jsx'
import { PersistentNotifications } from './PersistentNotifications.jsx'
import { Button } from './ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx'
import { Input } from './ui/input.jsx'
import { Label } from './ui/label.jsx'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx'
import { Badge } from './ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select.jsx'
import { Plus, Eye, Download, Users, Trophy, Link, Copy, Archive, Trash2, ArchiveRestore, Settings } from 'lucide-react'

const AdminPanel = ({ onBackToRifa, onViewRifaDetails, onLogout }) => {
  const [rifas, setRifas] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false)
  const [isSupabaseConfigModalOpen, setIsSupabaseConfigModalOpen] = useState(false)
  const [selectedRifa, setSelectedRifa] = useState(null)
  const [newRifaName, setNewRifaName] = useState('')
  const [newRifaSize, setNewRifaSize] = useState('600')
  const [customLinkLimit, setCustomLinkLimit] = useState('1')
  const [customLinks, setCustomLinks] = useState([])
  const [showArchived, setShowArchived] = useState(false)
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('')

  // Carregar rifas usando dataService
  useEffect(() => {
    // Carregar configurações do Supabase do localStorage na inicialização
    const storedUrl = localStorage.getItem('supabaseUrl')
    const storedKey = localStorage.getItem('supabaseAnonKey')
    if (storedUrl && storedKey) {
      dataService.initSupabase(storedUrl, storedKey)
      setSupabaseUrl(storedUrl)
      setSupabaseAnonKey(storedKey)
    }
    loadRifas()
  }, [])

  const loadRifas = async () => {
    try {
      const rifasData = await dataService.getRifas()
      setRifas(rifasData)
    } catch (error) {
      console.error('Erro ao carregar rifas:', error)
      alert('Erro ao carregar rifas. Verifique sua conexão com o Supabase.')
    }
  }

  // Salvar rifas usando dataService
  const saveRifas = async (updatedRifas) => {
    setRifas(updatedRifas)
    // Salvar cada rifa individualmente no dataService
    for (const rifa of updatedRifas) {
      try {
        await dataService.saveRifa(rifa)
      } catch (error) {
        console.error('Erro ao salvar rifa:', error)
        alert('Erro ao salvar rifa. Verifique sua conexão com o Supabase.')
      }
    }
  }

  const createNewRifa = async () => {
    if (!newRifaName.trim()) {
      alert('Por favor, digite um nome para a rifa.')
      return
    }

    const rifaSize = parseInt(newRifaSize)
    if (rifaSize < 10 || rifaSize > 10000) {
      alert('O tamanho da rifa deve estar entre 10 e 10.000 números.')
      return
    }

    if (!dataService.isSupabaseReady()) {
      alert('Supabase não configurado ou conectado. Por favor, configure o Supabase para criar rifas.')
      return
    }

    const newRifa = {
      id: dataService.generateId(),
      name: newRifaName.trim(),
      size: rifaSize,
      createdAt: new Date().toISOString(),
      participants: {},
      status: 'active',
      customLinks: [], // Array para armazenar links personalizados
      winner: null, // Para armazenar dados do vencedor
      finishedAt: null, // Data de finalização
      archived: false // Campo para controlar arquivamento
    }

    try {
      await dataService.saveRifa(newRifa)
      const updatedRifas = [...rifas, newRifa]
      setRifas(updatedRifas)
      setNewRifaName('')
      setNewRifaSize('600')
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Erro ao criar rifa:', error)
      alert('Erro ao criar rifa. Verifique sua conexão com o Supabase.')
    }
  }

  const viewRifaDetails = (rifa) => {
    if (onViewRifaDetails) {
      onViewRifaDetails(rifa)
    } else {
      // Fallback para o modal antigo se a função não estiver disponível
      setSelectedRifa(rifa)
      setIsViewModalOpen(true)
    }
  }

  const exportParticipants = (rifa) => {
    const participants = Object.entries(rifa.participants).map(([number, data]) => ({
      numero: number,
      nome: data.name,
      telefone: data.phone,
      email: data.email,
      dataReserva: new Date(data.timestamp).toLocaleString('pt-BR')
    }))

    const csvContent = [
      'Número,Nome,Telefone,Email,Data da Reserva',
      ...participants.map(p => `${p.numero},"${p.nome}","${p.telefone}","${p.email}","${p.dataReserva}"`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `rifa-${rifa.name.replace(/\s+/g, '-').toLowerCase()}-participantes.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getRifaStats = (rifa) => {
    const totalParticipants = Object.keys(rifa.participants).length
    const totalNumbers = rifa.size || 600 // Usar tamanho dinâmico ou 600 como padrão
    const percentage = ((totalParticipants / totalNumbers) * 100).toFixed(1)
    return { totalParticipants, totalNumbers, percentage }
  }

  const getRifaLink = (rifaId) => {
    return `${window.location.origin}?rifa=${rifaId}`
  }

  const copyRifaLink = (rifaId) => {
    const link = getRifaLink(rifaId)
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copiado para a área de transferência!')
    })
  }

  const openLinksModal = (rifa) => {
    setSelectedRifa(rifa)
    setCustomLinks(rifa.customLinks || [])
    setIsLinksModalOpen(true)
  }

  const createCustomLink = async () => {
    const limitValue = parseInt(customLinkLimit)
    if (!customLinkLimit || limitValue < 1 || limitValue > 100) {
      alert('Por favor, digite um limite válido entre 1 e 100 números.')
      return
    }

    if (!dataService.isSupabaseReady()) {
      alert('Supabase não configurado ou conectado. Por favor, configure o Supabase para criar links personalizados.')
      return
    }

    const linkId = Date.now().toString()
    const newLink = {
      id: linkId,
      limit: limitValue,
      used: false,
      createdAt: new Date().toISOString(),
      usedAt: null,
      usedBy: null,
      url: `${window.location.origin}?rifa=${selectedRifa.id}&limit=${limitValue}&linkId=${linkId}`
    }

    const updatedLinks = [...customLinks, newLink]
    setCustomLinks(updatedLinks)

    try {
      await dataService.saveLink(selectedRifa.id, newLink)
      const updatedRifas = rifas.map(rifa => 
        rifa.id === selectedRifa.id 
          ? { ...rifa, customLinks: updatedLinks }
          : rifa
      )
      setRifas(updatedRifas)
      setSelectedRifa({ ...selectedRifa, customLinks: updatedLinks })
    } catch (error) {
      console.error('Erro ao criar link personalizado:', error)
      alert('Erro ao criar link personalizado. Verifique sua conexão com o Supabase.')
    }
  }

  const copyCustomLink = (link) => {
    navigator.clipboard.writeText(link.url).then(() => {
      alert(`Link copiado! Permite selecionar até ${link.limit} número(s).`)
    })
  }

  const deleteCustomLink = async (linkIdToDelete) => {
    if (!dataService.isSupabaseReady()) {
      alert('Supabase não configurado ou conectado. Não é possível excluir links personalizados.')
      return
    }

    const confirmDelete = window.confirm('Tem certeza que deseja excluir este link personalizado?')
    if (!confirmDelete) return

    try {
      await dataService.deleteLink(selectedRifa.id, linkIdToDelete)
      const updatedLinks = customLinks.filter(link => link.id !== linkIdToDelete)
      setCustomLinks(updatedLinks)

      const updatedRifas = rifas.map(rifa => 
        rifa.id === selectedRifa.id 
          ? { ...rifa, customLinks: updatedLinks }
          : rifa
      )
      setRifas(updatedRifas)
      setSelectedRifa({ ...selectedRifa, customLinks: updatedLinks })
    } catch (error) {
      console.error('Erro ao excluir link personalizado:', error)
      alert('Erro ao excluir link personalizado. Verifique sua conexão com o Supabase.')
    }
  }

  // Finalizar rifa e sortear vencedor
  const finishRifa = async (rifaId) => {
    if (!dataService.isSupabaseReady()) {
      alert('Supabase não configurado ou conectado. Não é possível finalizar rifas.')
      return
    }

    const rifa = rifas.find(r => r.id === rifaId)
    if (!rifa || Object.keys(rifa.participants).length === 0) {
      alert('Não é possível finalizar uma rifa sem participantes.')
      return
    }

    const confirmFinish = window.confirm(
      `Tem certeza que deseja finalizar a rifa "${rifa.name}"? Esta ação não pode ser desfeita e um vencedor será sorteado automaticamente.`
    )

    if (!confirmFinish) return

    // Sortear um número vencedor entre os participantes
    const participantNumbers = Object.keys(rifa.participants)
    const randomIndex = Math.floor(Math.random() * participantNumbers.length)
    const winnerNumber = participantNumbers[randomIndex]
    const winnerParticipant = rifa.participants[winnerNumber]

    const updatedRifas = rifas.map(r => 
      r.id === rifaId 
        ? { 
            ...r, 
            status: 'finished',
            finishedAt: new Date().toISOString(),
            winner: {
              number: winnerNumber,
              participant: winnerParticipant
            }
          }
        : r
    )

    try {
      await dataService.saveRifa(updatedRifas.find(r => r.id === rifaId))
      setRifas(updatedRifas)
      alert(`Rifa finalizada! O número vencedor é ${winnerNumber}, pertencente a ${winnerParticipant.name}.`)
    } catch (error) {
      console.error('Erro ao finalizar rifa:', error)
      alert('Erro ao finalizar rifa. Verifique sua conexão com o Supabase.')
    }
  }

  // Pausar rifa
  const pauseRifa = async (rifaId) => {
    if (!dataService.isSupabaseReady()) {
      alert('Supabase não configurado ou conectado. Não é possível pausar rifas.')
      return
    }

    const rifa = rifas.find(r => r.id === rifaId)
    const confirmPause = window.confirm(
      `Tem certeza que deseja pausar a rifa "${rifa.name}"? Novos participantes não poderão se inscrever até que seja reativada.`
    )

    if (!confirmPause) return

    const updatedRifas = rifas.map(r => 
      r.id === rifaId 
        ? { ...r, status: 'paused', pausedAt: new Date().toISOString() }
        : r
    )

    try {
      await dataService.saveRifa(updatedRifas.find(r => r.id === rifaId))
      setRifas(updatedRifas)
      alert('Rifa pausada com sucesso!')
    } catch (error) {
      console.error('Erro ao pausar rifa:', error)
      alert('Erro ao pausar rifa. Verifique sua conexão com o Supabase.')
    }
  }

  // Reativar rifa
  const resumeRifa = async (rifaId) => {
    if (!dataService.isSupabaseReady()) {
      alert('Supabase não configurado ou conectado. Não é possível reativar rifas.')
      return
    }

    const rifa = rifas.find(r => r.id === rifaId)
    const confirmResume = window.confirm(
      `Tem certeza que deseja reativar a rifa "${rifa.name}"? Novos participantes poderão se inscrever novamente.`
    )

    if (!confirmResume) return

    const updatedRifas = rifas.map(r => 
      r.id === rifaId 
        ? { ...r, status: 'active', resumedAt: new Date().toISOString() }
        : r
    )

    try {
      await dataService.saveRifa(updatedRifas.find(r => r.id === rifaId))
      setRifas(updatedRifas)
      alert('Rifa reativada com sucesso!')
    } catch (error) {
      console.error('Erro ao reativar rifa:', error)
      alert('Erro ao reativar rifa. Verifique sua conexão com o Supabase.')
    }
  }

  // Arquivar rifa finalizada
  const archiveRifa = async (rifaId) => {
    if (!dataService.isSupabaseReady()) {
      alert('Supabase não configurado ou conectado. Não é possível arquivar rifas.')
      return
    }

    const rifa = rifas.find(r => r.id === rifaId)
    const confirmArchive = window.confirm(
      `Tem certeza que deseja arquivar a rifa "${rifa.name}"? Ela será movida para a seção de rifas arquivadas.`
    )

    if (!confirmArchive) return

    const updatedRifas = rifas.map(r => 
      r.id === rifaId 
        ? { ...r, archived: true, archivedAt: new Date().toISOString() }
        : r
    )

    try {
      await dataService.saveRifa(updatedRifas.find(r => r.id === rifaId))
      setRifas(updatedRifas)
      alert('Rifa arquivada com sucesso!')
    } catch (error) {
      console.error('Erro ao arquivar rifa:', error)
      alert('Erro ao arquivar rifa. Verifique sua conexão com o Supabase.')
    }
  }

  // Desarquivar rifa
  const unarchiveRifa = async (rifaId) => {
    if (!dataService.isSupabaseReady()) {
      alert('Supabase não configurado ou conectado. Não é possível desarquivar rifas.')
      return
    }

    const rifa = rifas.find(r => r.id === rifaId)
    const confirmUnarchive = window.confirm(
      `Tem certeza que deseja desarquivar a rifa "${rifa.name}"? Ela voltará para a lista principal.`
    )

    if (!confirmUnarchive) return

    const updatedRifas = rifas.map(r => 
      r.id === rifaId 
        ? { ...r, archived: false, unarchivedAt: new Date().toISOString() }
        : r
    )

    try {
      await dataService.saveRifa(updatedRifas.find(r => r.id === rifaId))
      setRifas(updatedRifas)
      alert('Rifa desarquivada com sucesso!')
    } catch (error) {
      console.error('Erro ao desarquivar rifa:', error)
      alert('Erro ao desarquivar rifa. Verifique sua conexão com o Supabase.')
    }
  }

  // Excluir rifa
  const deleteRifa = async (rifaId) => {
    if (!dataService.isSupabaseReady()) {
      alert('Supabase não configurado ou conectado. Não é possível excluir rifas.')
      return
    }

    const rifa = rifas.find(r => r.id === rifaId)
    const participantCount = Object.keys(rifa.participants).length
    
    // Verificar se a rifa pode ser excluída
    if (rifa.status === 'active' && participantCount > 0) {
      alert('Não é possível excluir uma rifa ativa com participantes. Finalize ou pause a rifa primeiro.')
      return
    }

    // Confirmação dupla para segurança
    const firstConfirm = window.confirm(
      `Tem certeza que deseja excluir a rifa "${rifa.name}"?${participantCount > 0 ? ` Esta rifa possui ${participantCount} participante(s).` : ''}`
    )

    if (!firstConfirm) return

    const secondConfirm = window.confirm(
      `ATENÇÃO: Esta ação não pode ser desfeita! Confirma a exclusão da rifa "${rifa.name}"?`
    )

    if (!secondConfirm) return

    try {
      await dataService.deleteRifa(rifaId)
      const updatedRifas = rifas.filter(r => r.id !== rifaId)
      setRifas(updatedRifas)
      alert('Rifa excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir rifa:', error)
      alert('Erro ao excluir rifa. Verifique sua conexão com o Supabase.')
    }
  }

  // Filtrar rifas baseado na visualização atual
  const getFilteredRifas = () => {
    if (showArchived) {
      return rifas.filter(rifa => rifa.archived === true)
    } else {
      return rifas.filter(rifa => rifa.archived !== true)
    }
  }

  // Obter estatísticas das rifas
  const getRifasStats = () => {
    const activeRifas = rifas.filter(r => r.status === 'active' && !r.archived).length
    const pausedRifas = rifas.filter(r => r.status === 'paused' && !r.archived).length
    const finishedRifas = rifas.filter(r => r.status === 'finished' && !r.archived).length
    const archivedRifas = rifas.filter(r => r.archived === true).length
    
    return { activeRifas, pausedRifas, finishedRifas, archivedRifas }
  }

  const handleSaveSupabaseConfig = () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      alert('Por favor, preencha ambos os campos de URL e Anon Key do Supabase.')
      return
    }
    localStorage.setItem('supabaseUrl', supabaseUrl)
    localStorage.setItem('supabaseAnonKey', supabaseAnonKey)
    dataService.initSupabase(supabaseUrl, supabaseAnonKey)
    setIsSupabaseConfigModalOpen(false)
    loadRifas() // Recarregar rifas após configurar o Supabase
    alert('Configurações do Supabase salvas e aplicadas!')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Painel Administrativo - EPAV</h1>
            <p className="text-gray-600 mt-2">Gerencie suas rifas e acompanhe os participantes</p>
          <div className="flex items-center space-x-4">
            <SystemStatus />
            <Button onClick={() => setShowConfig(true)} variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" /> Configurar
            </Button>
          </div>

          {showConfig && (
            <AlertDialog open={showConfig} onOpenChange={setShowConfig}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Configuração do Supabase e Senha Admin</AlertDialogTitle>
                  <AlertDialogDescription>
                    Insira suas credenciais do Supabase e defina a senha do painel administrativo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="supabaseUrl" className="text-right">URL Supabase</Label>
                    <Input id="supabaseUrl" value={supabaseUrl} onChange={(e) => setSupabaseUrl(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="supabaseAnonKey" className="text-right">Anon Key</Label>
                    <Input id="supabaseAnonKey" value={supabaseAnonKey} onChange={(e) => setSupabaseAnonKey(e.target.value)} className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="adminPassword" className="text-right">Nova Senha Admin</Label>
                    <Input id="adminPassword" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="col-span-3" placeholder="Deixe em branco para manter a atual" />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSaveConfig}>Salvar Configurações</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}   {/* Estatísticas rápidas */}
              {rifas.length > 0 && (
                <div className="flex gap-2">
                {(() => {
                  const stats = getRifasStats()
                  return (
                    <>
                      {stats.activeRifas > 0 && (
                        <Badge variant="default" className="bg-green-500">
                          {stats.activeRifas} Ativa{stats.activeRifas > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {stats.pausedRifas > 0 && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                          {stats.pausedRifas} Pausada{stats.pausedRifas > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {stats.finishedRifas > 0 && (
                        <Badge variant="outline" className="border-blue-500 text-blue-700">
                          {stats.finishedRifas} Finalizada{stats.finishedRifas > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {stats.archivedRifas > 0 && (
                        <Badge variant="outline" className="border-gray-500 text-gray-700">
                          {stats.archivedRifas} Arquivada{stats.archivedRifas > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </>
                  )
                })()}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Rifa
            </Button>
            {rifas.filter(r => r.archived === true).length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setShowArchived(!showArchived)}
                className={showArchived ? "bg-gray-100" : ""}
              >
                <Archive className="w-4 h-4 mr-2" />
                {showArchived ? 'Ver Rifas Ativas' : 'Ver Arquivadas'}
              </Button>
            )}
            <Button variant="outline" onClick={onBackToRifa}>
              Ver Página da Rifa
            </Button>
            <Button variant="outline" onClick={() => setIsSupabaseConfigModalOpen(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Configurar Supabase
            </Button>
            <Button variant="outline" onClick={onLogout} className="text-red-600 border-red-300 hover:bg-red-50">
              Sair
            </Button>
          </div>
        </div>

        {/* Título da Seção */}
        {rifas.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {showArchived ? 'Rifas Arquivadas' : 'Rifas Ativas'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {showArchived 
                ? 'Rifas que foram arquivadas para organização' 
                : 'Rifas em andamento, pausadas ou finalizadas recentemente'
              }
            </p>
          </div>
        )}

        {/* Lista de Rifas */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {getFilteredRifas().map((rifa) => {
            const stats = getRifaStats(rifa)
            return (
              <Card key={rifa.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg text-blue-900">{rifa.name}</CardTitle>
                    <div className="flex gap-2">
                      {rifa.archived && (
                        <Badge variant="outline" className="border-gray-500 text-gray-700">Arquivada</Badge>
                      )}
                      {rifa.status === 'active' && (
                        <Badge variant="default" className="bg-green-500">Ativa</Badge>
                      )}
                      {rifa.status === 'paused' && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pausada</Badge>
                      )}
                      {rifa.status === 'finished' && (
                        <Badge variant="outline" className="border-blue-500 text-blue-700">Finalizada</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Criada em: {new Date(rifa.createdAt).toLocaleDateString('pt-BR')}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Participantes:</span>
                      <span className="font-medium">{stats.totalParticipants}/{stats.totalNumbers} ({stats.percentage}%)</span>
                    </div>
                    {rifa.winner && (
                      <div className="flex items-center justify-between text-green-700 font-semibold">
                        <span>Vencedor:</span>
                        <span>{rifa.winner.participant.name} ({rifa.winner.number})</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => viewRifaDetails(rifa)}>
                      <Eye className="w-4 h-4 mr-1" /> Detalhes
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => copyRifaLink(rifa.id)}>
                      <Copy className="w-4 h-4 mr-1" /> Link
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openLinksModal(rifa)}>
                      <Link className="w-4 h-4 mr-1" /> Links Personalizados
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {rifa.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => pauseRifa(rifa.id)} className="text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                        Pausar
                      </Button>
                    )}
                    {rifa.status === 'paused' && (
                      <Button variant="outline" size="sm" onClick={() => resumeRifa(rifa.id)} className="text-green-600 border-green-300 hover:bg-green-50">
                        Reativar
                      </Button>
                    )}
                    {rifa.status !== 'finished' && rifa.status !== 'paused' && (
                      <Button variant="outline" size="sm" onClick={() => finishRifa(rifa.id)} className="text-blue-600 border-blue-300 hover:bg-blue-50">
                        Finalizar
                      </Button>
                    )}
                    {rifa.archived ? (
                      <Button variant="outline" size="sm" onClick={() => unarchiveRifa(rifa.id)} className="text-gray-600 border-gray-300 hover:bg-gray-50">
                        <ArchiveRestore className="w-4 h-4 mr-1" /> Desarquivar
                      </Button>
                    ) : (
                      rifa.status === 'finished' && (
                        <Button variant="outline" size="sm" onClick={() => archiveRifa(rifa.id)} className="text-gray-600 border-gray-300 hover:bg-gray-50">
                          <Archive className="w-4 h-4 mr-1" /> Arquivar
                        </Button>
                      )
                    )}
                    <Button variant="outline" size="sm" onClick={() => deleteRifa(rifa.id)} className="text-red-600 border-red-300 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-1" /> Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mensagem se não houver rifas */}
        {rifas.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhuma rifa encontrada</h3>
            <p className="text-gray-500 mb-4">Crie sua primeira rifa para começar a gerenciar!</p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Criar Nova Rifa
            </Button>
          </div>
        )}

        {/* Modal de Criação de Rifa */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Rifa</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rifaName">Nome da Rifa</Label>
                <Input
                  id="rifaName"
                  placeholder="Ex: Rifa de Natal"
                  value={newRifaName}
                  onChange={(e) => setNewRifaName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rifaSize">Quantidade de Números</Label>
                <Input
                  id="rifaSize"
                  type="number"
                  placeholder="Ex: 600"
                  value={newRifaSize}
                  onChange={(e) => setNewRifaSize(e.target.value)}
                  min="10"
                  max="10000"
                />
              </div>
            </div>
            <Button onClick={createNewRifa} className="w-full bg-blue-600 hover:bg-blue-700">
              Criar Rifa
            </Button>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes da Rifa (antigo, se onViewRifaDetails não for usado) */}
        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Rifa: {selectedRifa?.name}</DialogTitle>
            </DialogHeader>
            {selectedRifa && (
              <div className="grid gap-4 py-4">
                <p><strong>ID:</strong> {selectedRifa.id}</p>
                <p><strong>Tamanho:</strong> {selectedRifa.size}</p>
                <p><strong>Status:</strong> {selectedRifa.status}</p>
                <p><strong>Criada em:</strong> {new Date(selectedRifa.createdAt).toLocaleString('pt-BR')}</p>
                {selectedRifa.finishedAt && <p><strong>Finalizada em:</strong> {new Date(selectedRifa.finishedAt).toLocaleString('pt-BR')}</p>}
                {selectedRifa.winner && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">🎉 Vencedor</h3>
                    <div className="text-sm text-green-700">
                      <div><strong>Número:</strong> {selectedRifa.winner.number}</div>
                      <div><strong>Nome:</strong> {selectedRifa.winner.participant.name}</div>
                      <div><strong>Telefone:</strong> {selectedRifa.winner.participant.phone}</div>
                      <div><strong>Email:</strong> {selectedRifa.winner.participant.email || 'Não informado'}</div>
                    </div>
                  </div>
                )}
                <h3 className="text-lg font-semibold mt-4">Participantes ({Object.keys(selectedRifa.participants).length})</h3>
                {Object.keys(selectedRifa.participants).length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Data Reserva</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(selectedRifa.participants).map(([number, data]) => (
                          <TableRow key={number}>
                            <TableCell className="font-medium">{number}</TableCell>
                            <TableCell>{data.name}</TableCell>
                            <TableCell>{data.phone}</TableCell>
                            <TableCell>{data.email || 'N/A'}</TableCell>
                            <TableCell>{new Date(data.timestamp).toLocaleString('pt-BR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p>Nenhum participante ainda.</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Links Personalizados */}
        <Dialog open={isLinksModalOpen} onOpenChange={setIsLinksModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Links Personalizados para: {selectedRifa?.name}</DialogTitle>
            </DialogHeader>
            {selectedRifa && (
              <div className="grid gap-4 py-4">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Limite de números (1-100)"
                    value={customLinkLimit}
                    onChange={(e) => setCustomLinkLimit(e.target.value)}
                    min="1"
                    max="100"
                    className="w-48"
                  />
                  <Button onClick={createCustomLink} className="bg-blue-600 hover:bg-blue-700">
                    Gerar Novo Link
                  </Button>
                </div>
                <h3 className="text-lg font-semibold mt-4">Links Gerados ({customLinks.length})</h3>
                {customLinks.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Link</TableHead>
                          <TableHead>Limite</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customLinks.map((link) => (
                          <TableRow key={link.id}>
                            <TableCell className="font-medium break-all">
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                {link.url}
                              </a>
                            </TableCell>
                            <TableCell>{link.limit}</TableCell>
                            <TableCell>
                              {link.usado ? (
                                <Badge variant="destructive">Usado ({new Date(link.data_uso).toLocaleDateString('pt-BR')})</Badge>
                              ) : (
                                <Badge variant="secondary">Disponível</Badge>
                              )}
                            </TableCell>
                            <TableCell className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => copyCustomLink(link)}>
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => deleteCustomLink(link.id)} className="text-red-600 border-red-300 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p>Nenhum link personalizado gerado ainda.</p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Configuração do Supabase */}
        <Dialog open={isSupabaseConfigModalOpen} onOpenChange={setIsSupabaseConfigModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Supabase</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <p className="text-sm text-gray-600">Insira suas credenciais do Supabase. Elas serão salvas localmente no seu navegador e usadas para sincronizar os dados das rifas.</p>
              <div className="grid gap-2">
                <Label htmlFor="supabaseUrl">URL do Projeto Supabase</Label>
                <Input
                  id="supabaseUrl"
                  placeholder="https://seu-projeto.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="supabaseAnonKey">Chave Pública Anon (Anon Key)</Label>
                <Input
                  id="supabaseAnonKey"
                  placeholder="sua_chave_publica_anonima"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleSaveSupabaseConfig} className="w-full bg-blue-600 hover:bg-blue-700">
              Salvar e Conectar
            </Button>
          </DialogContent>
        </Dialog>

        {/* Modal de Notificações Persistentes */}
        <PersistentNotifications />

      </div>
    </div>
  )
}

export default AdminPanel

