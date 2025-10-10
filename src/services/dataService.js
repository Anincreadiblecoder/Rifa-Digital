import { createClient } from '@supabase/supabase-js'

let supabase = null
let isSupabaseAvailable = false
let currentSupabaseUrl = null
let currentSupabaseAnonKey = null

// Chaves do localStorage
const STORAGE_KEYS = {
  RIFAS: 'epav-rifas',
  AUTH: 'epav-admin-auth',
  SUPABASE_CONFIG: 'epav-supabase-config'
}

class DataService {
  constructor() {
    this.isOnline = navigator.onLine
    this.setupOnlineListener()
    this.loadSupabaseConfig()
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

  loadSupabaseConfig() {
    const config = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONFIG)
    if (config) {
      const { url, anonKey } = JSON.parse(config)
      this.setSupabaseCredentials(url, anonKey)
    }
  }

  setSupabaseCredentials(url, anonKey) {
    if (url && anonKey && (url !== currentSupabaseUrl || anonKey !== currentSupabaseAnonKey)) {
      try {
        supabase = createClient(url, anonKey)
        isSupabaseAvailable = true
        currentSupabaseUrl = url
        currentSupabaseAnonKey = anonKey
        localStorage.setItem(STORAGE_KEYS.SUPABASE_CONFIG, JSON.stringify({ url, anonKey }))
        console.log('✅ Supabase conectado/reconfigurado - dados serão sincronizados na nuvem')
        this.syncLocalDataToSupabase() // Tentar sincronizar após a conexão
      } catch (error) {
        console.warn('⚠️ Erro ao conectar Supabase com credenciais fornecidas, usando apenas localStorage:', error)
        isSupabaseAvailable = false
      }
    } else if (!url || !anonKey) {
      console.warn('⚠️ Credenciais do Supabase incompletas, usando apenas localStorage')
      isSupabaseAvailable = false
      supabase = null
      currentSupabaseUrl = null
      currentSupabaseAnonKey = null
      localStorage.removeItem(STORAGE_KEYS.SUPABASE_CONFIG)
    }
  }

  // Verificar se Supabase está disponível e online
  isSupabaseReady() {
    return isSupabaseAvailable && this.isOnline && supabase !== null
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
          // Salvar no localStorage como backup (apenas para o admin)
          localStorage.setItem(STORAGE_KEYS.RIFAS, JSON.stringify(data))
          return data
        }
      }
    } catch (error) {
      console.warn('Erro ao carregar rifas do Supabase:', error)
    }

    // Fallback para localStorage (apenas para o admin, se Supabase não estiver pronto)
    const localData = localStorage.getItem(STORAGE_KEYS.RIFAS)
    return localData ? JSON.parse(localData) : []
  }

  // RIFAS - Salvar rifa
  async saveRifa(rifa) {
    const rifaToSave = {
      ...rifa,
      id: rifa.id || this.generateId(),
      data_criacao: rifa.data_criacao || new Date().toISOString(),
      created_at: rifa.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: rifa.archived !== undefined ? rifa.archived : false
    }

    if (!this.isSupabaseReady()) {
      console.error('❌ Supabase não conectado. Não é possível salvar rifa.')
      throw new Error('Supabase não conectado. Não é possível salvar rifa.')
    }

    try {
      const { data, error } = await supabase
        .from('rifas')
        .upsert(rifaToSave)
        .select()

      if (error) {
        console.error('Erro ao salvar rifa no Supabase:', error)
        throw error
      }
      // Atualizar localStorage (apenas para o admin)
      await this.updateLocalRifa(rifaToSave)
      return data[0]
    } catch (error) {
      console.error('Erro crítico ao salvar rifa no Supabase:', error)
      throw error
    }
  }

  // RIFAS - Atualizar rifa no localStorage (apenas para o admin)
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

  // RIFAS - Carregar apenas do localStorage (apenas para o admin)
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

    // Não há fallback para localStorage para participantes, pois o admin precisa receber a info
    return []
  }

  // PARTICIPANTES - Adicionar participante
  async addParticipante(rifaId, participante) {
    if (!this.isSupabaseReady()) {
      console.error('❌ Supabase não conectado. Não é possível adicionar participante.')
      throw new Error('Supabase não conectado. Não é possível adicionar participante.')
    }

    const participanteWithId = {
      ...participante,
      id: this.generateId(),
      rifa_id: rifaId,
      data_reserva: new Date().toISOString(),
      created_at: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('participantes')
        .insert(participanteWithId)
        .select()

      if (error) {
        console.error('Erro ao adicionar participante no Supabase:', error)
        throw error
      }
      
      // Notificar admin sobre nova participação
      this.notifyNewParticipant(rifaId, participanteWithId)
      
      return data[0]
    } catch (error) {
      console.error('Erro crítico ao adicionar participante no Supabase:', error)
      throw error
    }
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

    // Não há fallback para localStorage para links personalizados
    return []
  }

  // LINKS PERSONALIZADOS - Salvar link
  async saveLink(rifaId, link) {
    if (!this.isSupabaseReady()) {
      console.error('❌ Supabase não conectado. Não é possível salvar link personalizado.')
      throw new Error('Supabase não conectado. Não é possível salvar link personalizado.')
    }

    const linkWithId = {
      ...link,
      id: link.id || this.generateId(),
      rifa_id: rifaId,
      data_criacao: link.data_criacao || new Date().toISOString(),
      created_at: link.created_at || new Date().toISOString(),
      usado: false
    }

    try {
      const { data, error } = await supabase
        .from('links_personalizados')
        .upsert(linkWithId)
        .select()

      if (error) {
        console.error('Erro ao salvar link no Supabase:', error)
        throw error
      }
      return data[0]
    } catch (error) {
      console.error('Erro crítico ao salvar link no Supabase:', error)
      throw error
    }
  }

  // SINCRONIZAÇÃO - Sincronizar dados locais para Supabase
  async syncLocalDataToSupabase() {
    if (!this.isSupabaseReady()) return

    try {
      const localRifas = this.getRifasFromLocal()
      
      for (const rifa of localRifas) {
        // Sincronizar rifa
        try {
          await this.saveRifa(rifa)
        } catch (error) {
          console.warn('Erro ao sincronizar rifa:', error)
        }
        
        // Sincronizar participantes
        if (rifa.participantes) {
          for (const participante of rifa.participantes) {
            try {
              await supabase
                .from('participantes')
                .upsert({
                  ...participante,
                  rifa_id: rifa.id,
                  created_at: participante.created_at || new Date().toISOString()
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
                  rifa_id: rifa.id,
                  created_at: link.created_at || new Date().toISOString()
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

    // Não há fallback para localStorage para notificações
    return []
  }

  async criarNotificacao(notificacao) {
    if (!this.isSupabaseReady()) {
      console.error('❌ Supabase não conectado. Não é possível criar notificação.')
      throw new Error('Supabase não conectado. Não é possível criar notificação.')
    }

    const notificacaoCompleta = {
      ...notificacao,
      id: this.generateId(),
      data_criacao: new Date().toISOString(),
      created_at: new Date().toISOString(),
      lida: false
    }

    try {
      const { data, error } = await supabase
        .from('notificacoes_admin')
        .insert(notificacaoCompleta)
        .select()

      if (error) {
        console.error('Erro ao criar notificação no Supabase:', error)
        throw error
      }
      return data[0]
    } catch (error) {
      console.error('Erro crítico ao criar notificação no Supabase:', error)
      throw error
    }
  }

  async marcarNotificacaoComoLida(notificacaoId) {
    if (!this.isSupabaseReady()) {
      console.error('❌ Supabase não conectado. Não é possível marcar notificação como lida.')
      throw new Error('Supabase não conectado. Não é possível marcar notificação como lida.')
    }

    try {
      const { data, error } = await supabase
        .from('notificacoes_admin')
        .update({ 
            lida: true, 
            data_leitura: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        .eq('id', notificacaoId)
        .select()

      if (error) {
        console.error('Erro ao marcar notificação como lida no Supabase:', error)
        throw error
      }
      return data[0]
    } catch (error) {
      console.error('Erro crítico ao marcar notificação como lida no Supabase:', error)
      throw error
    }
  }

  async marcarTodasNotificacoesComoLidas() {
    if (!this.isSupabaseReady()) {
      console.error('❌ Supabase não conectado. Não é possível marcar todas as notificações como lidas.')
      throw new Error('Supabase não conectado. Não é possível marcar todas as notificações como lidas.')
    }

    try {
      const { data, error } = await supabase
        .from('notificacoes_admin')
        .update({ 
            lida: true, 
            data_leitura: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        .eq('lida', false)
        .select()

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas no Supabase:', error)
        throw error
      }
      return data
    } catch (error) {
      console.error('Erro crítico ao marcar todas as notificações como lidas no Supabase:', error)
      throw error
    }
  }

  async excluirNotificacao(notificacaoId) {
    if (!this.isSupabaseReady()) {
      console.error('❌ Supabase não conectado. Não é possível excluir notificação.')
      throw new Error('Supabase não conectado. Não é possível excluir notificação.')
    }

    try {
      const { error } = await supabase
        .from('notificacoes_admin')
        .delete()
        .eq('id', notificacaoId)

      if (error) {
        console.error('Erro ao excluir notificação no Supabase:', error)
        throw error
      }
      return true
    } catch (error) {
      console.error('Erro crítico ao excluir notificação no Supabase:', error)
      throw error
    }
  }

  // NOTIFICAÇÕES - Criar notificações específicas
  async notifyNewParticipant(rifaId, participante) {
    if (!this.isSupabaseReady()) return

    try {
      await this.criarNotificacao({
        tipo: 'nova_participacao',
        titulo: 'Nova Participação',
        mensagem: `Novo participante ${participante.nome} (${participante.telefone}) reservou o número ${participante.numero} na rifa.`,
        dados: { participante_nome: participante.nome, numero: participante.numero, telefone: participante.telefone },
        rifa_id: rifaId,
        participante_id: participante.id,
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro ao notificar nova participação:', error)
    }
  }

  async notifyConcurrency(rifaId, numerosIndisponiveis, participante) {
    if (!this.isSupabaseReady()) return

    try {
      await this.criarNotificacao({
        tipo: 'concorrencia',
        titulo: 'Concorrência de Números Detectada',
        mensagem: `O participante ${participante.nome} (${participante.telefone}) tentou reservar os números ${numerosIndisponiveis.join(', ')} na rifa, mas eles já estavam ocupados.`,
        dados: { participante_nome: participante.nome, numeros: numerosIndisponiveis, telefone: participante.telefone },
        rifa_id: rifaId,
        participante_id: participante.id,
        prioridade: 'alta'
      })
    } catch (error) {
      console.error('Erro ao notificar concorrência:', error)
    }
  }

  async notifyDuplicidade(rifaId, participante, totalNumeros) {
    if (!this.isSupabaseReady()) return

    try {
      await this.criarNotificacao({
        tipo: 'duplicidade',
        titulo: 'Possível Duplicidade Detectada',
        mensagem: `O participante ${participante.nome} (${participante.telefone}) pode ter reservado múltiplos números (${totalNumeros} no total) na rifa.`,
        dados: { participante_nome: participante.nome, total_numeros: totalNumeros, telefone: participante.telefone },
        rifa_id: rifaId,
        participante_id: participante.id,
        prioridade: 'normal'
      })
    } catch (error) {
      console.error('Erro ao notificar duplicidade:', error)
    }
  }

  // Status do sistema
  getSystemStatus() {
    return {
      isSupabaseReady: this.isSupabaseReady(),
      isOnline: this.isOnline,
      hasSupabaseConfig: !!(currentSupabaseUrl && currentSupabaseAnonKey),
      supabaseUrl: currentSupabaseUrl
    }
  }

  // Utilitários
  generateId() {
    return crypto.randomUUID()
  }
}

const dataService = new DataService()
export { dataService }

