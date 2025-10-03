import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService.js'
import SystemStatus from './SystemStatus.jsx'
import PersistentNotifications from './PersistentNotifications.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Plus, Eye, Download, Users, Trophy, Link, Copy, Archive, Trash2, ArchiveRestore } from 'lucide-react'

const AdminPanel = ({ onBackToRifa, onViewRifaDetails, onLogout }) => {
  const [rifas, setRifas] = useState([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false)
  const [selectedRifa, setSelectedRifa] = useState(null)
  const [newRifaName, setNewRifaName] = useState('')
  const [newRifaSize, setNewRifaSize] = useState('600')
  const [customLinkLimit, setCustomLinkLimit] = useState('1')
  const [customLinks, setCustomLinks] = useState([])
  const [showArchived, setShowArchived] = useState(false)

  // Carregar rifas usando dataService
  useEffect(() => {
    loadRifas()
  }, [])

  const loadRifas = async () => {
    try {
      const rifasData = await dataService.getRifas()
      setRifas(rifasData)
    } catch (error) {
      console.error('Erro ao carregar rifas:', error)
      // Fallback para localStorage direto em caso de erro
      const savedRifas = localStorage.getItem('epav-rifas')
      if (savedRifas) {
        setRifas(JSON.parse(savedRifas))
      }
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
      alert('Erro ao criar rifa. Tente novamente.')
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

  const createCustomLink = () => {
    const limitValue = parseInt(customLinkLimit)
    if (!customLinkLimit || limitValue < 1 || limitValue > 100) {
      alert('Por favor, digite um limite válido entre 1 e 100 números.')
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

    // Atualizar a rifa no localStorage
    const updatedRifas = rifas.map(rifa => 
      rifa.id === selectedRifa.id 
        ? { ...rifa, customLinks: updatedLinks }
        : rifa
    )
    saveRifas(updatedRifas)
    setSelectedRifa({ ...selectedRifa, customLinks: updatedLinks })
  }

  const copyCustomLink = (link) => {
    navigator.clipboard.writeText(link.url).then(() => {
      alert(`Link copiado! Permite selecionar até ${link.limit} número(s).`)
    })
  }

  const deleteCustomLink = (linkId) => {
    const updatedLinks = customLinks.filter(link => link.id !== linkId)
    setCustomLinks(updatedLinks)

    // Atualizar a rifa no localStorage
    const updatedRifas = rifas.map(rifa => 
      rifa.id === selectedRifa.id 
        ? { ...rifa, customLinks: updatedLinks }
        : rifa
    )
    saveRifas(updatedRifas)
    setSelectedRifa({ ...selectedRifa, customLinks: updatedLinks })
  }

  // Finalizar rifa e sortear vencedor
  const finishRifa = (rifaId) => {
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

    saveRifas(updatedRifas)
    alert(`Rifa finalizada! O número vencedor é ${winnerNumber}, pertencente a ${winnerParticipant.name}.`)
  }

  // Pausar rifa
  const pauseRifa = (rifaId) => {
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

    saveRifas(updatedRifas)
    alert('Rifa pausada com sucesso!')
  }

  // Reativar rifa
  const resumeRifa = (rifaId) => {
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

    saveRifas(updatedRifas)
    alert('Rifa reativada com sucesso!')
  }

  // Arquivar rifa finalizada
  const archiveRifa = (rifaId) => {
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

    saveRifas(updatedRifas)
    alert('Rifa arquivada com sucesso!')
  }

  // Desarquivar rifa
  const unarchiveRifa = (rifaId) => {
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

    saveRifas(updatedRifas)
    alert('Rifa desarquivada com sucesso!')
  }

  // Excluir rifa
  const deleteRifa = (rifaId) => {
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

    const updatedRifas = rifas.filter(r => r.id !== rifaId)
    saveRifas(updatedRifas)
    alert('Rifa excluída com sucesso!')
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Painel Administrativo - EPAV</h1>
            <p className="text-gray-600 mt-2">Gerencie suas rifas e acompanhe os participantes</p>
            <div className="flex items-center gap-4 mt-3">
              <SystemStatus />
              {/* Estatísticas rápidas */}
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
                        <Badge variant="outline" className="border-gray-400 text-gray-600">
                          <Archive className="w-3 h-3 mr-1" />
                          Arquivada
                        </Badge>
                      )}
                      <Badge variant={
                        rifa.status === 'active' ? 'default' : 
                        rifa.status === 'paused' ? 'outline' : 
                        'secondary'
                      } className={
                        rifa.status === 'active' ? 'bg-green-500' :
                        rifa.status === 'paused' ? 'border-yellow-500 text-yellow-700' :
                        'bg-blue-500'
                      }>
                        {rifa.status === 'active' ? 'Ativa' : 
                         rifa.status === 'paused' ? 'Pausada' : 
                         'Finalizada'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Participantes:</span>
                      <span className="font-semibold">{stats.totalParticipants}/{stats.totalNumbers}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stats.percentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-center text-sm text-gray-600">
                      {stats.percentage}% preenchido
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => viewRifaDetails(rifa)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => exportParticipants(rifa)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Exportar
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => copyRifaLink(rifa.id)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        Link Padrão
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openLinksModal(rifa)}
                        className="flex-1"
                      >
                        <Link className="w-4 h-4 mr-1" />
                        Links Personalizados
                      </Button>
                    </div>

                    {/* Botões de Ação da Rifa */}
                    {rifa.status === 'active' && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => pauseRifa(rifa.id)}
                          className="flex-1 text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                        >
                          Pausar Rifa
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => finishRifa(rifa.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={Object.keys(rifa.participants).length === 0}
                        >
                          <Trophy className="w-4 h-4 mr-1" />
                          Finalizar e Sortear
                        </Button>
                      </div>
                    )}

                    {rifa.status === 'paused' && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => resumeRifa(rifa.id)}
                          className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          Reativar Rifa
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => finishRifa(rifa.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          disabled={Object.keys(rifa.participants).length === 0}
                        >
                          <Trophy className="w-4 h-4 mr-1" />
                          Finalizar e Sortear
                        </Button>
                      </div>
                    )}

                    {rifa.status === 'finished' && rifa.winner && (
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-800">Vencedor</span>
                        </div>
                        <div className="text-sm text-green-700">
                          <div><strong>Número:</strong> {rifa.winner.number}</div>
                          <div><strong>Nome:</strong> {rifa.winner.participant.name}</div>
                          <div><strong>Telefone:</strong> {rifa.winner.participant.phone}</div>
                          <div><strong>Sorteado em:</strong> {new Date(rifa.finishedAt).toLocaleString('pt-BR')}</div>
                        </div>
                      </div>
                    )}

                    {/* Botões para rifas finalizadas não arquivadas */}
                    {rifa.status === 'finished' && !rifa.archived && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => archiveRifa(rifa.id)}
                          className="flex-1 text-gray-600 border-gray-300 hover:bg-gray-50"
                        >
                          <Archive className="w-4 h-4 mr-1" />
                          Arquivar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteRifa(rifa.id)}
                          className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    )}

                    {/* Botões para rifas arquivadas */}
                    {rifa.archived && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => unarchiveRifa(rifa.id)}
                          className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <ArchiveRestore className="w-4 h-4 mr-1" />
                          Desarquivar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteRifa(rifa.id)}
                          className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    )}

                    {/* Botão de excluir para rifas sem participantes */}
                    {!rifa.archived && rifa.status !== 'finished' && Object.keys(rifa.participants).length === 0 && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteRifa(rifa.id)}
                          className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Excluir Rifa
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {rifas.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Nenhuma rifa criada ainda</h3>
            <p className="text-gray-500 mb-6">Crie sua primeira rifa para começar a gerenciar os participantes.</p>
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Rifa
            </Button>
          </div>
        )}

        {rifas.length > 0 && getFilteredRifas().length === 0 && (
          <div className="text-center py-12">
            <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {showArchived ? 'Nenhuma rifa arquivada' : 'Nenhuma rifa ativa'}
            </h3>
            <p className="text-gray-500 mb-6">
              {showArchived 
                ? 'Você ainda não arquivou nenhuma rifa. Rifas finalizadas podem ser arquivadas para melhor organização.' 
                : 'Todas as suas rifas estão arquivadas. Clique no botão acima para ver as rifas arquivadas.'
              }
            </p>
            {!showArchived && (
              <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Nova Rifa
              </Button>
            )}
          </div>
        )}

        {/* Notificações em Tempo Real */}
        {rifas.length > 0 && !showArchived && (
          <div className="mt-8">
            <PersistentNotifications rifas={rifas} onRefresh={loadRifas} />
          </div>
        )}
      </div>

      {/* Modal Criar Nova Rifa */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Criar Nova Rifa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rifaName">Nome da Rifa</Label>
              <Input
                id="rifaName"
                placeholder="Ex: Rifa EPAV - Sorteio Especial"
                value={newRifaName}
                onChange={(e) => setNewRifaName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rifaSize">Quantidade de Números</Label>
              <Select value={newRifaSize} onValueChange={setNewRifaSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a quantidade de números" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 números</SelectItem>
                  <SelectItem value="100">100 números</SelectItem>
                  <SelectItem value="200">200 números</SelectItem>
                  <SelectItem value="300">300 números</SelectItem>
                  <SelectItem value="500">500 números</SelectItem>
                  <SelectItem value="600">600 números</SelectItem>
                  <SelectItem value="1000">1.000 números</SelectItem>
                  <SelectItem value="2000">2.000 números</SelectItem>
                  <SelectItem value="5000">5.000 números</SelectItem>
                  <SelectItem value="10000">10.000 números</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Escolha quantos números sua rifa terá (de 1 até {newRifaSize})
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button onClick={createNewRifa} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Criar Rifa
            </Button>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Ver Detalhes da Rifa */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900">
              {selectedRifa?.name} - Detalhes
            </DialogTitle>
          </DialogHeader>
          
          {selectedRifa && (
            <Tabs defaultValue="participants" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="participants">
                  <Users className="w-4 h-4 mr-2" />
                  Participantes ({Object.keys(selectedRifa.participants).length})
                </TabsTrigger>
                <TabsTrigger value="link">Link da Rifa</TabsTrigger>
              </TabsList>
              
              <TabsContent value="participants" className="mt-4">
                {Object.keys(selectedRifa.participants).length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Número</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(selectedRifa.participants)
                          .sort(([a], [b]) => parseInt(a) - parseInt(b))
                          .map(([number, data]) => (
                          <TableRow key={number}>
                            <TableCell className="font-medium">{number}</TableCell>
                            <TableCell>{data.name}</TableCell>
                            <TableCell>{data.phone}</TableCell>
                            <TableCell>{data.email}</TableCell>
                            <TableCell>
                              {new Date(data.timestamp).toLocaleString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum participante ainda.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="link" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <Label>Link para compartilhar com os participantes:</Label>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        value={getRifaLink(selectedRifa.id)} 
                        readOnly 
                        className="flex-1"
                      />
                      <Button onClick={() => copyRifaLink(selectedRifa.id)}>
                        Copiar
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Compartilhe este link com os participantes para que eles possam escolher seus números.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Links Personalizados */}
      <Dialog open={isLinksModalOpen} onOpenChange={setIsLinksModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-blue-900">
              Links Personalizados - {selectedRifa?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Criar Novo Link */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-800 mb-4">Criar Novo Link Personalizado</h3>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="linkLimit">Limite de números por participante</Label>
                  <Input
                    id="linkLimit"
                    type="number"
                    min="1"
                    max="100"
                    placeholder="Digite a quantidade (ex: 5)"
                    value={customLinkLimit}
                    onChange={(e) => setCustomLinkLimit(e.target.value)}
                    className="focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo de 100 números por participante
                  </p>
                </div>
                <Button onClick={createCustomLink} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Link
                </Button>
              </div>
            </div>

            {/* Lista de Links Criados */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Links Criados</h3>
              {customLinks.length > 0 ? (
                <div className="space-y-3">
                  {customLinks.map((link) => (
                    <div key={link.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <Badge variant="outline" className="mb-2">
                            Limite: {link.limit} número(s)
                          </Badge>
                          <p className="text-sm text-gray-600">
                            Criado em: {new Date(link.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteCustomLink(link.id)}
                        >
                          Excluir
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          value={link.url} 
                          readOnly 
                          className="flex-1 text-sm"
                        />
                        <Button 
                          size="sm"
                          onClick={() => copyCustomLink(link)}
                          className="bg-orange-500 hover:bg-orange-600"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Link className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Nenhum link personalizado criado ainda.</p>
                  <p className="text-sm">Crie links com diferentes limites de números para seus participantes.</p>
                </div>
              )}
            </div>

            {/* Informações */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Como funciona:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Cada link personalizado permite que o participante selecione uma quantidade específica de números</li>
                <li>• O participante só poderá confirmar a reserva após selecionar exatamente a quantidade permitida</li>
                <li>• Você pode criar quantos links diferentes quiser para a mesma rifa</li>
                <li>• Use links diferentes para diferentes grupos de participantes</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminPanel
