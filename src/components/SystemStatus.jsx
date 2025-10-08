import React, { useState, useEffect } from 'react'
import dataService from '../services/dataService.js'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Cloud, CloudOff, Database, Wifi, WifiOff, RefreshCw } from 'lucide-react'

const SystemStatus = ({ showDetails = false }) => {
  const [status, setStatus] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    updateStatus()
    
    // Atualizar status a cada 30 segundos
    const interval = setInterval(updateStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const updateStatus = () => {
    const systemStatus = dataService.getSystemStatus()
    setStatus(systemStatus)
  }

  const handleSync = async () => {
    setIsRefreshing(true)
    try {
      await dataService.syncLocalDataToSupabase()
      updateStatus()
    } catch (error) {
      console.error('Erro na sincronização:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!status) return null

  const getStatusColor = () => {
    if (status.usingSupabase) return 'bg-green-500'
    if (status.supabaseAvailable && !status.online) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getStatusIcon = () => {
    if (status.usingSupabase) return <Cloud className="h-4 w-4" />
    if (status.supabaseAvailable && !status.online) return <CloudOff className="h-4 w-4" />
    return <Database className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (status.usingSupabase) return 'Conectado à Nuvem'
    if (status.supabaseAvailable && !status.online) return 'Modo Offline'
    return 'Armazenamento Local'
  }

  if (!showDetails) {
    return (
      <Badge variant="outline" className={`${getStatusColor()} text-white border-0`}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Status do Sistema</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={isRefreshing || !status.supabaseAvailable}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {status.online ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">
              Conexão: {status.online ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {status.supabaseAvailable ? (
              <Cloud className="h-5 w-5 text-green-500" />
            ) : (
              <CloudOff className="h-5 w-5 text-gray-500" />
            )}
            <span className="font-medium">
              Supabase: {status.supabaseAvailable ? 'Configurado' : 'Não Configurado'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-500" />
            <span className="font-medium">
              Armazenamento: {status.storageMode}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className={`${getStatusColor()} text-white border-0 w-full justify-center py-2`}>
            {getStatusIcon()}
            <span className="ml-2 font-medium">{getStatusText()}</span>
          </Badge>
        </div>
      </div>

      {!status.supabaseAvailable && (
        <Alert>
          <AlertDescription>
            <strong>Modo Local:</strong> Os dados estão sendo salvos apenas no navegador. 
            Para sincronizar entre dispositivos, configure o Supabase no arquivo .env
          </AlertDescription>
        </Alert>
      )}

      {status.supabaseAvailable && !status.online && (
        <Alert>
          <AlertDescription>
            <strong>Modo Offline:</strong> Os dados estão sendo salvos localmente. 
            Quando a conexão for restaurada, os dados serão sincronizados automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {status.usingSupabase && (
        <Alert>
          <AlertDescription>
            <strong>Sincronizado:</strong> Os dados estão sendo salvos na nuvem e 
            sincronizados entre todos os dispositivos em tempo real.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default SystemStatus
