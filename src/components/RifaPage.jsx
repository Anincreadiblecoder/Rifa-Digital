import React, { useState, useEffect } from 'react'
import { dataService } from '../services/dataService.js'
import { Button } from '@/components/ui/button.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { AlertCircle, CheckCircle, X, Trophy } from 'lucide-react'
import epavLogo from '../assets/EPAV2025.jpg'

function RifaPage({ rifaId, onGoToAdmin }) {
  const [rifa, setRifa] = useState(null)
  const [selectedNumbers, setSelectedNumbers] = useState([]) // Mudança para array
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [participantData, setParticipantData] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [isLinkUsed, setIsLinkUsed] = useState(false) // Novo estado para links de uso único
  const [numberLimit, setNumberLimit] = useState(1) // Limite de números
  const [linkId, setLinkId] = useState(null) // ID do link personalizado

  // Gerar números baseado no tamanho da rifa
  const numbers = rifa ? Array.from({ length: rifa.size || 600 }, (_, i) => i + 1) : []

  // Carregar dados da rifa e detectar parâmetros de URL
  useEffect(() => {
    // Detectar parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search)
    const limitParam = urlParams.get('limit')
    const linkIdParam = urlParams.get('linkId')

    if (limitParam) {
      setNumberLimit(parseInt(limitParam))
    }
    if (linkIdParam) {
      setLinkId(linkIdParam)
    }

    const loadRifa = async () => {
      try {
        const rifas = await dataService.getRifas()
        const foundRifa = rifas.find(r => r.id === rifaId)
        
        if (foundRifa) {
          // Verificar se é um link personalizado e se já foi usado
          if (linkIdParam) {
            const customLinks = await dataService.getLinksPersonalizados(rifaId)
            const customLink = customLinks.find(link => link.id === linkIdParam)
            if (customLink && customLink.usado) {
              setError(`Este link já foi utilizado em ${new Date(customLink.data_uso).toLocaleString("pt-BR")} por ${customLink.usado_por?.nome || "um participante"}. Ele não pode ser usado novamente.`)
              setLoading(false)
              setIsLinkUsed(true) // Bloqueia a interação na página
              setRifa(foundRifa) // Carregar a rifa para exibir o cabeçalho e o erro
              return
            }
          }
          
          // Carregar participantes da rifa
          const participantes = await dataService.getParticipantes(rifaId)
          foundRifa.participants = {}
          participantes.forEach(p => {
            foundRifa.participants[p.numero] = {
              name: p.nome,
              phone: p.telefone,
              email: p.email
            }
          })
          
          setRifa(foundRifa)
        } else {
          setError('Rifa não encontrada.')
        }
      } catch (err) {
        console.error('Erro ao carregar rifa:', err)
        setError('Erro ao carregar a rifa.')
      } finally {
        setLoading(false)
      }
    }

    if (rifaId) {
      loadRifa()
    } else {
      setLoading(false)
    }
  }, [rifaId])

  const handleNumberClick = (number) => {
    // Bloquear qualquer interação se o link já foi usado
    if (isLinkUsed) {
      return
    }
    
    if (rifa?.status === 'paused' || rifa?.status === 'finished') {
      return
    }
    
    if (rifa?.participants[number]) return // Número já reservado
    
    if (selectedNumbers.includes(number)) {
      // Remover número se já estiver selecionado
      setSelectedNumbers(prev => prev.filter(n => n !== number))
    } else {
      // Adicionar número se ainda não atingiu o limite
      if (selectedNumbers.length < numberLimit) {
        setSelectedNumbers(prev => [...prev, number])
      } else {
        alert(`Você pode selecionar no máximo ${numberLimit} número(s).`)
        return
      }
    }

    // Abrir modal automaticamente quando atingir o limite
    if (selectedNumbers.length + 1 === numberLimit && !selectedNumbers.includes(number)) {
      setTimeout(() => setIsModalOpen(true), 100)
    }
  }

  const removeSelectedNumber = (number) => {
    // Bloquear remoção se o link já foi usado
    if (isLinkUsed) {
      return
    }
    setSelectedNumbers(prev => prev.filter(n => n !== number))
  }

  const openModal = () => {
    // Bloquear abertura do modal se o link já foi usado
    if (isLinkUsed) {
      return
    }
    
    if (selectedNumbers.length === 0) {
      alert('Selecione pelo menos um número primeiro.')
      return
    }
    setIsModalOpen(true)
  }

  const handleReserveNumber = async () => {
    if (!participantData.name.trim() || !participantData.phone.trim() || !participantData.email.trim()) {
      alert('Por favor, preencha todos os campos.')
      return
    }

    if (selectedNumbers.length === 0) {
      alert('Selecione pelo menos um número.')
      return
    }

    if (numberLimit > 1 && selectedNumbers.length !== numberLimit) {
      alert(`Você deve selecionar exatamente ${numberLimit} números.`)
      return
    }

    try {
      // Se for um link personalizado, bloquear imediatamente para evitar uso duplo
      if (linkId) {
        setIsLinkUsed(true)
        setError("Processando reserva... Este link será bloqueado após a confirmação.")
      }

      // Verificar se os números ainda estão disponíveis
      const participantesAtuais = await dataService.getParticipantes(rifaId)
      const numerosOcupados = participantesAtuais.map(p => p.numero)
      const unavailableNumbers = selectedNumbers.filter(number => numerosOcupados.includes(number))
      const availableNumbers = selectedNumbers.filter(number => !numerosOcupados.includes(number))
      
      // Se há números indisponíveis, verificar se podemos prosseguir com os disponíveis
      if (unavailableNumbers.length > 0) {
        if (availableNumbers.length === 0) {
          // Todos os números estão ocupados
          alert(`Todos os números selecionados (${unavailableNumbers.join(', ')}) já foram reservados por outros participantes. Por favor, selecione outros números.`)
          if (linkId) {
            setIsLinkUsed(false)
            setError(null)
          }
          return
        } else {
          // Alguns números estão disponíveis, perguntar se quer prosseguir
          const confirmMessage = `Os números ${unavailableNumbers.join(', ')} já foram reservados por outros participantes.\n\nDeseja prosseguir apenas com os números disponíveis: ${availableNumbers.join(', ')}?`
          
          if (!confirm(confirmMessage)) {
            if (linkId) {
              setIsLinkUsed(false)
              setError(null)
            }
            return
          }
          
          // Atualizar a seleção para apenas os números disponíveis
          setSelectedNumbers(availableNumbers)
          
          // Criar notificação de concorrência
          await dataService.notifyConcurrency(
            rifaId,
            {
              nome: participantData.name.trim(),
              telefone: participantData.phone.trim()
            },
            unavailableNumbers,
            availableNumbers
          )
        }
      }

      // Usar apenas os números disponíveis para a reserva
      const numerosParaReservar = availableNumbers.length > 0 ? availableNumbers : selectedNumbers
      
      // Adicionar cada número disponível como participante separado
      for (const numero of numerosParaReservar) {
        const participante = {
          nome: participantData.name.trim(),
          telefone: participantData.phone.trim(),
          email: participantData.email.trim(),
          numero: numero,
          link_id: linkId || null
        }

        await dataService.addParticipante(rifaId, participante)
      }

      // Se for um link personalizado, marcar como usado
      if (linkId) {
        const customLinks = await dataService.getLinksPersonalizados(rifaId)
        const customLink = customLinks.find(link => link.id === linkId)
        if (customLink) {
          const linkAtualizado = {
            ...customLink,
            usado: true,
            data_uso: new Date().toISOString(),
            usado_por: {
              nome: participantData.name.trim(),
              telefone: participantData.phone.trim(),
              email: participantData.email.trim(),
              numeros: numerosParaReservar
            }
          }
          await dataService.saveLink(rifaId, linkAtualizado)
        }
      }

      // Recarregar dados da rifa
      const rifasAtualizadas = await dataService.getRifas()
      const rifaAtualizada = rifasAtualizadas.find(r => r.id === rifaId)
      if (rifaAtualizada) {
        const participantes = await dataService.getParticipantes(rifaId)
        rifaAtualizada.participants = {}
        participantes.forEach(p => {
          rifaAtualizada.participants[p.numero] = {
            name: p.nome,
            phone: p.telefone,
            email: p.email
          }
        })
        setRifa(rifaAtualizada)
      }

      setIsModalOpen(false)
      setParticipantData({ name: '', phone: '', email: '' })
      
      const numbersText = numerosParaReservar.length === 1 
        ? `número ${numerosParaReservar[0]}` 
        : `números ${numerosParaReservar.sort((a, b) => a - b).join(', ')}`
      
      // Mostrar aviso se alguns números não foram reservados
      let successMessage = `${numbersText} reservado(s) com sucesso para ${participantData.name.trim()}!`
      if (unavailableNumbers.length > 0) {
        successMessage += ` (Números ${unavailableNumbers.join(', ')} não foram reservados pois já estavam ocupados)`
      }
      
      setSelectedNumbers([])

      if (linkId) {
        setSuccess(`${successMessage} Este link de uso único foi utilizado e não pode ser usado novamente.`)
        setError("Este link de uso único já foi utilizado. Para participar novamente, solicite um novo link ao organizador.")
        // Garantir que o estado permaneça bloqueado
        setIsLinkUsed(true)
      } else {
        setSuccess(successMessage)
        // Limpar mensagem de sucesso após 5 segundos apenas se não for link de uso único
        setTimeout(() => setSuccess(null), 5000)
      }
    } catch (err) {
      console.error("Erro ao reservar números:", err)
      // Se houve erro e era um link personalizado, reverter o bloqueio
      if (linkId) {
        setIsLinkUsed(false)
        setError(null)
      }
      alert("Erro ao reservar os números. Tente novamente.")
    }
  }

  // Adicionar useEffect para bloquear a interface quando isLinkUsed for true
  useEffect(() => {
    if (isLinkUsed) {
      // Bloquear interação com a grade de números e o botão de reserva
      // Isso já é feito pelas condições de `disabled` nos botões e `rifa.status !== 'active'`
      // e `!isLinkUsed` nas renderizações condicionais.
      // Apenas garantir que o modal de reserva não possa ser aberto.
      setIsModalOpen(false);
    }
  }, [isLinkUsed]);

  const handleInputChange = (field, value) => {
    setParticipantData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando rifa...</p>
        </div>
      </div>
    )
  }

  if (error && !rifa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <img src={epavLogo} alt="EPAV Logo" className="mx-auto mb-6 h-24 w-auto" />
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Rifa não encontrada</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {onGoToAdmin && (
            <Button onClick={onGoToAdmin} className="bg-blue-600 hover:bg-blue-700">
              Ir para o Painel Administrativo
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Se há erro mas a rifa existe (ex: link usado), mostrar a rifa com o erro
  if (error && rifa && isLinkUsed) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Cabeçalho */}
        <header className="bg-white shadow-sm py-6">
          <div className="container mx-auto px-4 text-center">
            <img 
              src={epavLogo} 
              alt="EPAV Logo" 
              className="mx-auto mb-4 h-24 w-auto"
            />
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              {rifa.name}
            </h1>
          </div>
        </header>
        
        {/* Mensagem de erro para link usado */}
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto p-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-800 mb-2">Link já utilizado</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              Para participar novamente, solicite um novo link ao organizador.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Verificar se a rifa está pausada ou finalizada
  if (rifa && rifa.status === 'paused') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <img src={epavLogo} alt="EPAV Logo" className="mx-auto mb-6 h-24 w-auto" />
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-yellow-800 mb-2">Rifa Temporariamente Pausada</h2>
          <p className="text-gray-600 mb-6">
            A rifa "{rifa.name}" está temporariamente pausada. Novas participações não estão sendo aceitas no momento.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o organizador para mais informações.
          </p>
        </div>
      </div>
    )
  }

  if (rifa && rifa.status === 'finished') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <img src={epavLogo} alt="EPAV Logo" className="mx-auto mb-6 h-24 w-auto" />
          <Trophy className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">Rifa Finalizada</h2>
          <p className="text-gray-600 mb-4">
            A rifa "{rifa.name}" já foi finalizada.
          </p>
          {rifa.winner && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-2">🎉 Vencedor</h3>
              <div className="text-sm text-green-700">
                <div><strong>Número:</strong> {rifa.winner.number}</div>
                <div><strong>Nome:</strong> {rifa.winner.participant.name}</div>
                <div><strong>Sorteado em:</strong> {new Date(rifa.finishedAt).toLocaleString('pt-BR')}</div>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Parabéns ao vencedor!
          </p>
        </div>
      </div>
    )
  }

  if (!rifa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <img src={epavLogo} alt="EPAV Logo" className="mx-auto mb-6 h-24 w-auto" />
          <h2 className="text-2xl font-bold text-blue-900 mb-2">Bem-vindo ao Sistema de Rifas EPAV</h2>
          <p className="text-gray-600 mb-6">
            Para acessar uma rifa específica, você precisa do link fornecido pelo organizador.
          </p>
          {onGoToAdmin && (
            <Button onClick={onGoToAdmin} className="bg-blue-600 hover:bg-blue-700">
              Acessar Painel Administrativo
            </Button>
          )}
        </div>
      </div>
    )
  }

  const reservedNumbers = new Set(Object.keys(rifa.participants).map(Number))
  const totalReserved = reservedNumbers.size
  const rifaSize = rifa.size || 600 // Usar tamanho dinâmico ou 600 como padrão
  const percentage = ((totalReserved / rifaSize) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <header className="bg-white shadow-sm py-6">
        <div className="container mx-auto px-4 text-center">
          <img 
            src={epavLogo} 
            alt="EPAV Logo" 
            className="mx-auto mb-4 h-24 w-auto"
          />
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            {rifa.name}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-4">
            {numberLimit === 1 
              ? 'Selecione um número disponível e preencha seus dados para participar.'
              : `Selecione exatamente ${numberLimit} números disponíveis e preencha seus dados para participar.`
            } Os números em cinza já foram escolhidos. Boa sorte!
          </p>
          
          {/* Informações do Link Personalizado */}
          {numberLimit > 1 && (
            <div className="max-w-md mx-auto mb-4">
              <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-800">
                Link Personalizado: {numberLimit} número(s) por participante
              </Badge>
            </div>
          )}
          
          {/* Barra de Progresso */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Números reservados: {totalReserved}/{rifaSize}</span>
              <span>{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Alertas */}
      {success && (
        <div className="container mx-auto px-4 py-4">
          <Alert className="max-w-2xl mx-auto border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Números Selecionados */}
      {selectedNumbers.length > 0 && !isLinkUsed && rifa?.status === 'active' && !error && (
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border p-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">
                Números selecionados ({selectedNumbers.length}/{numberLimit}):
              </span>
              {selectedNumbers.sort((a, b) => a - b).map((number) => (
                <Badge 
                  key={number} 
                  variant="default" 
                  className="bg-orange-500 hover:bg-orange-600 cursor-pointer"
                  onClick={() => removeSelectedNumber(number)}
                >
                  {number} <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            {selectedNumbers.length < numberLimit ? (
              <p className="text-sm text-gray-600">
                Selecione mais {numberLimit - selectedNumbers.length} número(s) para continuar.
              </p>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={openModal}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Preencher Dados e Reservar
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setSelectedNumbers([])}
                >
                  Limpar Seleção
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grade de Números */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 lg:grid-cols-25 gap-2 max-w-6xl mx-auto">
          {numbers.map((number) => {
            const isReserved = reservedNumbers.has(number)
            const isSelected = selectedNumbers.includes(number)
            const isDisabled = isReserved || isLinkUsed || rifa?.status !== 'active' || !!error
            return (
              <button
                key={number}
                onClick={() => handleNumberClick(number)}
                disabled={isDisabled}
                className={`
                  aspect-square flex items-center justify-center text-sm font-semibold rounded-md transition-all duration-200
                  ${isReserved 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : isSelected
                    ? 'bg-orange-500 text-white border-2 border-orange-600 scale-105'
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:border-orange-500 hover:border-2 active:scale-95'
                  }
                `}
                title={
                  isReserved 
                    ? `Número ${number} já foi escolhido` 
                    : isSelected
                    ? `Remover número ${number} da seleção`
                    : `Escolher número ${number}`
                }
              >
                {number}
              </button>
            )
          })}
        </div>
      </main>

      {/* Modal de Reserva */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-blue-900 text-xl">
              {selectedNumbers.length === 1 
                ? `Você escolheu o número ${selectedNumbers[0]}`
                : `Você escolheu ${selectedNumbers.length} números`
              }
            </DialogTitle>
          </DialogHeader>
          
          {/* Mostrar números selecionados */}
          {selectedNumbers.length > 1 && (
            <div className="py-2">
              <p className="text-sm text-gray-600 mb-2">Números selecionados:</p>
              <div className="flex flex-wrap gap-1">
                {selectedNumbers.sort((a, b) => a - b).map((number) => (
                  <Badge key={number} variant="outline" className="bg-orange-50 border-orange-200 text-orange-800">
                    {number}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700">Nome Completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite seu nome completo"
                value={participantData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-700">Telefone (WhatsApp)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={participantData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={participantData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleReserveNumber}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2"
            >
              {selectedNumbers.length === 1 
                ? 'Reservar Meu Número' 
                : `Reservar Meus ${selectedNumbers.length} Números`
              }
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-gray-600 border-gray-300"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rodapé */}
      <footer className="bg-blue-900 text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            © 2025 EPAV - Experiência Prática em Atividades no Varejo
          </p>
        </div>
      </footer>
    </div>
  )
}

export default RifaPage
