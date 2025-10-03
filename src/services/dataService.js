import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null
let isSupabaseAvailable = false

// Inicializar Supabase se as credenciais estiverem disponíveis
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    isSupabaseAvailable = true
    console.log('✅ Supabase conectado - dados serão sincronizados na nuvem')
  } catch (error) {
    console.warn('⚠️ Erro ao conectar Supabase, usando apenas localStorage:', error)
    isSupabaseAvailable = false
  }
} else {
  console.warn('⚠️ Credenciais do Supabase não encontradas, usando apenas localStorage')
}

// Chaves do localStorage
const STORAGE_KEYS = {
  RIFAS: 'epav-rifas',
  AUTH: 'epav-admin-auth'
}

class DataService {
  constructor() {
    this.isOnline = navigator.onLine
    this.setupOnlineListener()
  }

  setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('🌐 Conexão restaurada - sincronizando dados...')
      this.syncLocalDataToSupabase()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('📱 Modo offline - usando localStorage')
    })
  }

  // Verificar se Supabase está disponível e online
  isSupabaseReady() {
    return isSupabaseAvailable && this.isOnline
  }

  // RIFAS - Carregar todas as rifas
  async getRifas() {
    try {
      if (this.isSupabaseReady()) {
        const { data, error } = await supabase
          .from('rifas')
          .select('*')
          .order('data_criacao', { ascending: false })

        if (!error && data) {
          // Salvar no localStorage como backup
          localStorage.setItem(STORAGE_KEYS.RIFAS, JSON.stringify(data))
          return data
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar rifas do Supabase:', error)
    }

    // Fallback para localStorage
    const localData = localStorage.getItem(STORAGE_KEYS.RIFAS)
    return localData ? JSON.parse(localData) : []
  }

  // RIFAS - Salvar rifa
  async saveRifa(rifa) {
    const rifaWithId = {
      ...rifa,
      id: rifa.id || this.generateId(),
      data_criacao: rifa.data_criacao || new Date().toISOString()
    }

    try {
      if (this.isSupabaseReady()) {
        const { data, error } = await supabase
          .from('rifas')
          .upsert(rifaWithId)
          .select()

        if (!error && data) {
          // Atualizar localStorage
          await this.updateLocalRifa(rifaWithId)
          return data[0]
        }
      }
    } catch (error) {
      console.warn('Erro ao salvar rifa no Supabase:', error)
    }

    // Fallback para localStorage
    return this.updateLocalRifa(rifaWithId)
  }

  // RIFAS - Atualizar rifa no localStorage
  async updateLocalRifa(rifa) {
    const rifas = await this.getRifasFromLocal()
    const index = rifas.findIndex(r => r.id === rifa.id)
    
    if (index >= 0) {
      rifas[index] = rifa
    } else {
      rifas.push(rifa)
    }
    
    localStorage.setItem(STORAGE_KEYS.RIFAS, JSON.stringify(rifas))
    return rifa
  }

  // RIFAS - Carregar apenas do localStorage
  getRifasFromLocal() {
    const localData = localStorage.getItem(STORAGE_KEYS.RIFAS)
    return localData ? JSON.parse(localData) : []
  }

  // PARTICIPANTES - Carregar participantes de uma rifa
  async getParticipantes(rifaId) {
    try {
      if (this.isSupabaseReady()) {
        const { data, error } = await supabase
          .from('participantes')
          .select('*')
          .eq('rifa_id', rifaId)
          .order('numero', { ascending: true })

        if (!error && data) {
          return data
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar participantes do Supabase:', error)
    }

    // Fallback para localStorage - buscar na rifa local
    const rifas = this.getRifasFromLocal()
    const rifa = rifas.find(r => r.id === rifaId)
    return rifa?.participantes || []
  }

  // PARTICIPANTES - Adicionar participante
  async addParticipante(rifaId, participante) {
    const participanteWithId = {
      ...participante,
      id: this.generateId(),
      rifa_id: rifaId,
      data_reserva: new Date().toISOString()
    }

    try {
      if (this.isSupabaseReady()) {
        const { data, error } = await supabase
          .from('participantes')
          .insert(participanteWithId)
          .select()

        if (!error && data) {
          // Também atualizar no localStorage
          await this.addParticipanteLocal(rifaId, participanteWithId)
          
          // Notificar admin sobre nova participação
          this.notifyNewParticipant(rifaId, participanteWithId)
          
          return data[0]
        }
      }
    } catch (error) {
      console.warn('Erro ao adicionar participante no Supabase:', error)
    }

    // Fallback para localStorage
    return this.addParticipanteLocal(rifaId, participanteWithId)
  }

  // PARTICIPANTES - Adicionar no localStorage
  async addParticipanteLocal(rifaId, participante) {
    const rifas = this.getRifasFromLocal()
    const rifaIndex = rifas.findIndex(r => r.id === rifaId)
    
    if (rifaIndex >= 0) {
      if (!rifas[rifaIndex].participantes) {
        rifas[rifaIndex].participantes = []
      }
      rifas[rifaIndex].participantes.push(participante)
      localStorage.setItem(STORAGE_KEYS.RIFAS, JSON.stringify(rifas))
    }
    
    return participante
  }

  // LINKS PERSONALIZADOS - Carregar links de uma rifa
  async getLinksPersonalizados(rifaId) {
    try {
      if (this.isSupabaseReady()) {
        const { data, error } = await supabase
          .from('links_personalizados')
          .select('*')
          .eq('rifa_id', rifaId)
          .order('data_criacao', { ascending: false })

        if (!error && data) {
          return data
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar links do Supabase:', error)
    }

    // Fallback para localStorage
    const rifas = this.getRifasFromLocal()
    const rifa = rifas.find(r => r.id === rifaId)
    return rifa?.linksPersonalizados || []
  }

  // LINKS PERSONALIZADOS - Salvar link
  async saveLink(rifaId, link) {
    const linkWithId = {
      ...link,
      id: link.id || this.generateId(),
      rifa_id: rifaId,
      data_criacao: link.data_criacao || new Date().toISOString(),
      usado: false
    }

    try {
      if (this.isSupabaseReady()) {
        const { data, error } = await supabase
          .from('links_personalizados')
          .upsert(linkWithId)
          .select()

        if (!error && data) {
          await this.saveLinkLocal(rifaId, linkWithId)
          return data[0]
        }
      }
    } catch (error) {
      console.warn('Erro ao salvar link no Supabase:', error)
    }

    // Fallback para localStorage
    return this.saveLinkLocal(rifaId, linkWithId)
  }

  // LINKS PERSONALIZADOS - Salvar no localStorage
  async saveLinkLocal(rifaId, link) {
    const rifas = this.getRifasFromLocal()
    const rifaIndex = rifas.findIndex(r => r.id === rifaId)
    
    if (rifaIndex >= 0) {
      if (!rifas[rifaIndex].linksPersonalizados) {
        rifas[rifaIndex].linksPersonalizados = []
      }
      
      const linkIndex = rifas[rifaIndex].linksPersonalizados.findIndex(l => l.id === link.id)
      if (linkIndex >= 0) {
        rifas[rifaIndex].linksPersonalizados[linkIndex] = link
      } else {
        rifas[rifaIndex].linksPersonalizados.push(link)
      }
      
      localStorage.setItem(STORAGE_KEYS.RIFAS, JSON.stringify(rifas))
    }
    
    return link
  }

  // SINCRONIZAÇÃO - Sincronizar dados locais para Supabase
  async syncLocalDataToSupabase() {
    if (!this.isSupabaseReady()) return

    try {
      const localRifas = this.getRifasFromLocal()
      
      for (const rifa of localRifas) {
        // Sincronizar rifa
        await this.saveRifa(rifa)
        
        // Sincronizar participantes
        if (rifa.participantes) {
          for (const participante of rifa.participantes) {
            try {
              await supabase
                .from('participantes')
                .upsert({
                  ...participante,
                  rifa_id: rifa.id
                })
            } catch (error) {
              console.warn('Erro ao sincronizar participante:', error)
            }
          }
        }
        
        // Sincronizar links personalizados
        if (rifa.linksPersonalizados) {
          for (const link of rifa.linksPersonalizados) {
            try {
              await supabase
                .from('links_personalizados')
                .upsert({
                  ...link,
                  rifa_id: rifa.id
                })
            } catch (error) {
              console.warn('Erro ao sincronizar link:', error)
            }
          }
        }
      }
      
      console.log('✅ Sincronização concluída')
    } catch (error) {
      console.warn('Erro na sincronização:', error)
    }
  }

  // NOTIFICAÇÕES - Gerenciar notificações persistentes
  async getNotificacoes(filtros = {}) {
    try {
      if (this.isSupabaseReady()) {
        let query = supabase
          .from('notificacoes_admin')
          .select('*')
          .order('data_criacao', { ascending: false })

        // Aplicar filtros
        if (filtros.naoLidas) {
          query = query.eq('lida', false)
        }
        if (filtros.tipo) {
          query = query.eq('tipo', filtros.tipo)
        }
        if (filtros.prioridade) {
          query = query.eq('prioridade', filtros.prioridade)
        }
        if (filtros.rifaId) {
          query = query.eq('rifa_id', filtros.rifaId)
        }
        if (filtros.limite) {
          query = query.limit(filtros.limite)
        }

        const { data, error } = await query

        if (!error && data) {
          return data
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar notificações do Supabase:', error)
    }

    // Fallback para localStorage (limitado)
    const localNotifications = localStorage.getItem('epav-notifications')
    return localNotifications ? JSON.parse(localNotifications) : []
  }

  async criarNotificacao(notificacao) {
    const notificacaoCompleta = {
      ...notificacao,
      id: this.generateId(),
      data_criacao: new Date().toISOString(),
      lida: false
    }

    try {
      if (this.isSupabaseReady()) {
        const { data, error } = await supabase
          .from('notificacoes_admin')
          .insert(notificacaoCompleta)
          .select()

        if (!error && data) {
          return data[0]
        }
      }
    } catch (error) {
      console.warn('Erro ao criar notificação no Supabase:', error)
    }

    // Fallback para localStorage
    const localNotifications = await this.getNotificacoes()
    localNotifications.unshift(notificacaoCompleta)
    
    // Manter apenas as últimas 100 notificações no localStorage
    if (localNotifications.length > 100) {
      localNotifications.splice(100)
    }
    
    localStorage.setItem('epav-notifications', JSON.stringify(localNotifications))
    return notificacaoCompleta
  }

  async marcarNotificacaoComoLida(notificacaoId) {
    try {
      if (this.isSupabaseReady()) {
        const { data, error } = await supabase
          .from('notificacoes_admin')
          .update({ 
            lida: true, 
            data_leitura: new Date().toISOString() 
          })
          .eq('id', notificacaoId)
          .select()

        if (!error && data) {
          return data[0]
        }
      }
    } catch (error) {
      console.warn('Erro ao marcar notificação como lida no Supabase:', error)
    }

    // Fallback para localStorage
    const localNotifications = await this.getNotificacoes()
    const index = localNotifications.findIndex(n => n.id === notificacaoId)
    if (index >= 0) {
      localNotifications[index].lida = true
      localNotifications[index].data_leitura = new Date().toISOString()
      localStorage.setItem('epav-notifications', JSON.stringify(localNotifications))
      return localNotifications[index]
    }
    
    return null
  }

  async marcarTodasNotificacoesComoLidas() {
    try {
      if (this.isSupabaseReady()) {
        const { data, error } = await supabase
          .from('notificacoes_admin')
          .update({ 
            lida: true, 
            data_leitura: new Date().toISOString() 
          })
          .eq('lida', false)
          .select()

        if (!error && data) {
          return data
        }
      }
    } catch (error) {
      console.warn('Erro ao marcar todas as notificações como lidas no Supabase:', error)
    }

    // Fallback para localStorage
    const localNotifications = await this.getNotificacoes()
    const dataLeitura = new Date().toISOString()
    localNotifications.forEach(n => {
      if (!n.lida) {
        n.lida = true
        n.data_leitura = dataLeitura
      }
    })
    localStorage.setItem('epav-notifications', JSON.stringify(localNotifications))
    return localNotifications.filter(n => n.data_leitura === dataLeitura)
  }

  async excluirNotificacao(notificacaoId) {
    try {
      if (this.isSupabaseReady()) {
        const { error } = await supabase
          .from('notificacoes_admin')
          .delete()
          .eq('id', notificacaoId)

        if (!error) {
          return true
        }
      }
    } catch (error) {
      console.warn('Erro ao excluir notificação no Supabase:', error)
    }

    // Fallback para localStorage
    const localNotifications = await this.getNotificacoes()
    const filteredNotifications = localNotifications.filter(n => n.id !== notificacaoId)
    localStorage.setItem('epav-notifications', JSON.stringify(filteredNotifications))
    return true
  }

  // NOTIFICAÇÕES - Criar notificações específicas
  async notifyNewParticipant(rifaId, participante) {
    console.log('🔔 Nova participação:', {
      rifa: rifaId,
      participante: participante.nome,
      numero: participante.numero
    })

    // Buscar nome da rifa
    const rifas = await this.getRifas()
    const rifa = rifas.find(r => r.id === rifaId)
    const rifaName = rifa ? rifa.name : 'Rifa não encontrada'

    // Criar notificação persistente
    await this.criarNotificacao({
      tipo: 'nova_participacao',
      titulo: 'Nova Participação',
      mensagem: `${participante.nome} reservou o número ${participante.numero}`,
      dados: {
        participante_nome: participante.nome,
        participante_telefone: participante.telefone,
        participante_email: participante.email,
        numero: participante.numero,
        rifa_nome: rifaName,
        rifa_id: rifaId
      },
      rifa_id: rifaId,
      participante_id: participante.id,
      prioridade: 'normal'
    })
  }

  async notifyConcurrency(rifaId, participante, numerosConflito, numerosReservados) {
    const rifas = await this.getRifas()
    const rifa = rifas.find(r => r.id === rifaId)
    const rifaName = rifa ? rifa.name : 'Rifa não encontrada'

    await this.criarNotificacao({
      tipo: 'concorrencia',
      titulo: 'Conflito de Números Resolvido',
      mensagem: `Concorrência detectada e resolvida para ${participante.nome}`,
      dados: {
        participante_nome: participante.nome,
        participante_telefone: participante.telefone,
        numeros_conflito: numerosConflito,
        numeros_reservados: numerosReservados,
        rifa_nome: rifaName,
        rifa_id: rifaId
      },
      rifa_id: rifaId,
      prioridade: 'alta'
    })
  }

  // UTILITÁRIOS
  generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
  }

  // AUTENTICAÇÃO
  getAuthToken() {
    const authData = localStorage.getItem(STORAGE_KEYS.AUTH)
    return authData ? JSON.parse(authData) : null
  }

  setAuthToken(authData) {
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authData))
  }

  removeAuthToken() {
    localStorage.removeItem(STORAGE_KEYS.AUTH)
  }

  // STATUS DO SISTEMA
  getSystemStatus() {
    return {
      supabaseAvailable: isSupabaseAvailable,
      online: this.isOnline,
      usingSupabase: this.isSupabaseReady(),
      storageMode: this.isSupabaseReady() ? 'Supabase + localStorage' : 'localStorage apenas'
    }
  }
}

// Exportar instância única
export const dataService = new DataService()
export default dataService
