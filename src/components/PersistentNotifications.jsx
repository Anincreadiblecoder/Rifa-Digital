import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService.js'
import { Button } from './ui/button.jsx'
import { Badge } from './ui/badge.jsx'
import { Alert, AlertDescription } from './ui/alert.jsx'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx'
import { Bell, RefreshCw, AlertTriangle, CheckCircle, Users, Clock, X, Eye, EyeOff, Trash2 } from 'lucide-react'

const PersistentNotifications = ({ rifas, onRefresh }) => {
  const [notifications, setNotifications] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('unread')

  useEffect(() => {
    loadNotifications()
    
    // Auto-refresh a cada 30 segundos se habilitado
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        loadNotifications()
      }, 30000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, activeTab])

  const loadNotifications = async () => {
    try {
      const filtros = {
        limite: 100
      }
      
      if (activeTab === 'unread') {
        filtros.naoLidas = true
      }
      
      const notificacoes = await dataService.getNotificacoes(filtros)
      setNotifications(notificacoes)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadNotifications()
      if (onRefresh) {
        await onRefresh()
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      await dataService.marcarNotificacaoComoLida(notificationId)
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await dataService.marcarTodasNotificacoesComoLidas()
      await loadNotifications()
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error)
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    if (confirm('Tem certeza que deseja excluir esta notificação?')) {
      try {
        await dataService.excluirNotificacao(notificationId)
        await loadNotifications()
      } catch (error) {
        console.error('Erro ao excluir notificação:', error)
      }
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeSince = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'agora mesmo'
    if (minutes === 1) return '1 minuto atrás'
    if (minutes < 60) return `${minutes} minutos atrás`
    
    const hours = Math.floor(minutes / 60)
    if (hours === 1) return '1 hora atrás'
    if (hours < 24) return `${hours} horas atrás`
    
    return formatDate(dateString)
  }

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case 'nova_participacao':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'duplicidade':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'concorrencia':
        return <Users className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getNotificationColor = (tipo, prioridade) => {
    if (prioridade === 'critica') return 'border-red-500 bg-red-50'
    if (prioridade === 'alta') return 'border-orange-500 bg-orange-50'
    
    switch (tipo) {
      case 'nova_participacao':
        return 'border-green-500 bg-green-50'
      case 'duplicidade':
        return 'border-orange-500 bg-orange-50'
      case 'concorrencia':
        return 'border-blue-500 bg-blue-50'
      default:
        return 'border-gray-300 bg-gray-50'
    }
  }

  const getPriorityBadge = (prioridade) => {
    const colors = {
      baixa: 'bg-gray-500',
      normal: 'bg-blue-500',
      alta: 'bg-orange-500',
      critica: 'bg-red-500'
    }
    
    return (
      <Badge className={`${colors[prioridade]} text-white text-xs`}>
        {prioridade.toUpperCase()}
      </Badge>
    )
  }

  const unreadCount = notifications.filter(n => !n.lida).length

  return (
    <div className="space-y-4">
      {/* Cabeçalho com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Notificações</h3>
          {unreadCount > 0 && (
            <Badge variant="default" className="bg-red-500">
              {unreadCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500 flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Atualizado: {formatTime(lastUpdate.toISOString())}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <Eye className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Tabs para filtrar notificações */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="unread">
            Não Lidas {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="mt-4">
          <NotificationsList 
            notifications={notifications.filter(n => !n.lida)}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDeleteNotification}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
            getPriorityBadge={getPriorityBadge}
            getTimeSince={getTimeSince}
            emptyMessage="Nenhuma notificação não lida"
          />
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <NotificationsList 
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDeleteNotification}
            getNotificationIcon={getNotificationIcon}
            getNotificationColor={getNotificationColor}
            getPriorityBadge={getPriorityBadge}
            getTimeSince={getTimeSince}
            emptyMessage="Nenhuma notificação encontrada"
          />
        </TabsContent>
      </Tabs>

      {/* Status de Conexão */}
      <div className="text-xs text-gray-500 text-center">
        {autoRefresh ? (
          <span className="flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Monitoramento ativo - Atualizando a cada 30 segundos
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
            Monitoramento pausado - Clique em "Atualizar" para verificar novidades
          </span>
        )}
      </div>
    </div>
  )
}

const NotificationsList = ({ 
  notifications, 
  onMarkAsRead, 
  onDelete, 
  getNotificationIcon, 
  getNotificationColor, 
  getPriorityBadge, 
  getTimeSince,
  emptyMessage 
}) => {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Bell className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">{emptyMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`p-4 border rounded-lg ${getNotificationColor(notification.tipo, notification.prioridade)} ${
            !notification.lida ? 'border-l-4' : ''
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {getNotificationIcon(notification.tipo)}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">{notification.titulo}</h4>
                  {getPriorityBadge(notification.prioridade)}
                  {!notification.lida && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                      NOVA
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700 mb-2">{notification.mensagem}</p>
                
                {/* Dados adicionais */}
                {notification.dados && (
                  <div className="text-xs text-gray-600 space-y-1">
                    {notification.dados.participante_nome && (
                      <div>
                        <strong>Participante:</strong> {notification.dados.participante_nome}
                        {notification.dados.participante_telefone && ` - ${notification.dados.participante_telefone}`}
                      </div>
                    )}
                    {notification.dados.numero && (
                      <div><strong>Número:</strong> {notification.dados.numero}</div>
                    )}
                    {notification.dados.numeros_conflito && (
                      <div><strong>Números em conflito:</strong> {notification.dados.numeros_conflito.join(', ')}</div>
                    )}
                    {notification.dados.numeros_reservados && (
                      <div><strong>Números reservados:</strong> {notification.dados.numeros_reservados.join(', ')}</div>
                    )}
                    {notification.dados.rifa_nome && (
                      <div><strong>Rifa:</strong> {notification.dados.rifa_nome}</div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  {getTimeSince(notification.data_criacao)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 ml-2">
              {!notification.lida && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMarkAsRead(notification.id)}
                  title="Marcar como lida"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(notification.id)}
                title="Excluir notificação"
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PersistentNotifications
