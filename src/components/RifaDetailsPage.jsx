import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { 
  ArrowLeft, 
  Users, 
  Trophy, 
  Calendar, 
  Search, 
  Filter, 
  Download,
  Eye,
  EyeOff,
  Grid3X3,
  List,
  BarChart3,
  Clock,
  Phone,
  Mail,
  User
} from 'lucide-react'

const RifaDetailsPage = ({ rifa, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'occupied', 'available'
  const [viewMode, setViewMode] = useState('grid') // 'grid', 'list'
  const [showParticipantDetails, setShowParticipantDetails] = useState(true)
  const [selectedNumber, setSelectedNumber] = useState(null)

  if (!rifa) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Rifa não encontrada</h2>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Button>
        </div>
      </div>
    )
  }

  const totalNumbers = rifa.size || 600
  const participants = Object.entries(rifa.participants || {})
  const totalParticipants = participants.length
  const percentage = ((totalParticipants / totalNumbers) * 100).toFixed(1)
  const availableNumbers = totalNumbers - totalParticipants

  // Filtrar participantes baseado na busca
  const filteredParticipants = participants.filter(([number, participant]) => {
    const matchesSearch = 
      number.includes(searchTerm) ||
      participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.phone.includes(searchTerm) ||
      participant.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Gerar array de números para visualização em grade
  const generateNumbersGrid = () => {
    const numbers = []
    for (let i = 1; i <= totalNumbers; i++) {
      const isOccupied = rifa.participants[i]
      const matchesFilter = 
        filterStatus === 'all' ||
        (filterStatus === 'occupied' && isOccupied) ||
        (filterStatus === 'available' && !isOccupied)
      
      if (matchesFilter) {
        numbers.push({
          number: i,
          isOccupied,
          participant: isOccupied ? rifa.participants[i] : null
        })
      }
    }
    return numbers
  }

  const numbersGrid = generateNumbersGrid()

  const exportParticipants = () => {
    const participantsData = participants.map(([number, data]) => ({
      numero: number,
      nome: data.name,
      telefone: data.phone,
      email: data.email,
      dataReserva: new Date(data.timestamp).toLocaleString('pt-BR')
    }))

    const csvContent = [
      'Número,Nome,Telefone,Email,Data da Reserva',
      ...participantsData.map(p => `${p.numero},"${p.nome}","${p.telefone}","${p.email}","${p.dataReserva}"`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `participantes-${rifa.name.replace(/\s+/g, '-').toLowerCase()}.csv`
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">{rifa.name}</h1>
                <div className="flex items-center gap-3 mt-1">
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
                  {rifa.archived && (
                    <Badge variant="outline" className="border-gray-400 text-gray-600">
                      Arquivada
                    </Badge>
                  )}
                  <span className="text-sm text-gray-600">
                    Criada em {new Date(rifa.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={exportParticipants}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Números</p>
                  <p className="text-3xl font-bold text-blue-600 transition-colors duration-300">{totalNumbers}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Grid3X3 className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Participantes</p>
                  <p className="text-3xl font-bold text-green-600 transition-colors duration-300">{totalParticipants}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Disponíveis</p>
                  <p className="text-3xl font-bold text-orange-600 transition-colors duration-300">{availableNumbers}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progresso</p>
                  <p className="text-3xl font-bold text-purple-600 transition-colors duration-300">{percentage}%</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barra de Progresso */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Progresso da Rifa</h3>
              <span className="text-sm text-gray-600">{totalParticipants} de {totalNumbers} números</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Vencedor (se houver) */}
        {rifa.status === 'finished' && rifa.winner && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Trophy className="w-12 h-12 text-yellow-500" />
                <div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">🎉 Vencedor da Rifa!</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-green-700">Número Sorteado:</span>
                      <span className="ml-2 text-2xl font-bold text-green-800">{rifa.winner.number}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-700">Nome:</span>
                      <span className="ml-2 text-green-800">{rifa.winner.participant.name}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-700">Telefone:</span>
                      <span className="ml-2 text-green-800">{rifa.winner.participant.phone}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-green-700">Sorteado em:</span>
                      <span className="ml-2 text-green-800">{new Date(rifa.finishedAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controles de Visualização */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar por número, nome, telefone ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="all">Todos os números</option>
                    <option value="occupied">Apenas ocupados</option>
                    <option value="available">Apenas disponíveis</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4 mr-1" />
                  Grade
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4 mr-1" />
                  Lista
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowParticipantDetails(!showParticipantDetails)}
                >
                  {showParticipantDetails ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {showParticipantDetails ? 'Ocultar' : 'Mostrar'} Detalhes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualização em Grade */}
        {viewMode === 'grid' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="w-5 h-5" />
                Grade de Números
                <Badge variant="outline" className="ml-2">
                  {numbersGrid.length} números {filterStatus !== 'all' && `(${filterStatus === 'occupied' ? 'ocupados' : 'disponíveis'})`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 xl:grid-cols-25 gap-1 sm:gap-2">
                {numbersGrid.map(({ number, isOccupied, participant }) => (
                  <div
                    key={number}
                    className={`
                      relative aspect-square flex items-center justify-center text-xs font-semibold rounded-lg cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-md
                      ${isOccupied 
                        ? 'bg-gradient-to-br from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 shadow-sm' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border border-gray-300'
                      }
                      ${selectedNumber === number ? 'ring-2 ring-blue-500 ring-offset-2 scale-110 shadow-lg' : ''}
                    `}
                    onClick={() => setSelectedNumber(selectedNumber === number ? null : number)}
                    title={isOccupied ? `Número ${number} - ${participant.name}` : `Número ${number} - Disponível`}
                  >
                    <span className="relative z-10">{number}</span>
                    {isOccupied && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
                    )}
                    {selectedNumber === number && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
              
              {numbersGrid.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum número encontrado com os filtros aplicados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Visualização em Lista */}
        {viewMode === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5" />
                Lista de Participantes
                <Badge variant="outline" className="ml-2">
                  {filteredParticipants.length} participantes
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredParticipants.map(([number, participant]) => (
                  <div
                    key={number}
                    className={`
                      p-4 border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer
                      ${selectedNumber === parseInt(number) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                    `}
                    onClick={() => setSelectedNumber(selectedNumber === parseInt(number) ? null : parseInt(number))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                          {number}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {participant.name}
                          </h4>
                          {showParticipantDetails && (
                            <div className="text-sm text-gray-600 mt-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {participant.phone}
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {participant.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3" />
                                {new Date(participant.timestamp).toLocaleString('pt-BR')}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Confirmado
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredParticipants.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum participante encontrado com os critérios de busca.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Detalhes do Número Selecionado */}
        {selectedNumber && rifa.participants[selectedNumber] && (
          <Card className="mt-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">
                Detalhes do Número {selectedNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-800 mb-3">Informações do Participante</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Nome:</span>
                      <span>{rifa.participants[selectedNumber].name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Telefone:</span>
                      <span>{rifa.participants[selectedNumber].phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Email:</span>
                      <span>{rifa.participants[selectedNumber].email}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-3">Informações da Reserva</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Data da Reserva:</span>
                      <span>{new Date(rifa.participants[selectedNumber].timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Status:</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Confirmado
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default RifaDetailsPage
