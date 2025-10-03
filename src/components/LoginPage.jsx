import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { ArrowLeft, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import epavLogo from '../assets/EPAV2025.jpg'

function LoginPage({ onLogin, onBack }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Senha padrão (em produção, isso deveria vir de uma configuração segura)
  const ADMIN_PASSWORD = 'epav2025'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simular um pequeno delay para melhor UX
    await new Promise(resolve => setTimeout(resolve, 500))

    if (password === ADMIN_PASSWORD) {
      onLogin(true)
    } else {
      setError('Senha incorreta. Tente novamente.')
      setPassword('')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={epavLogo} 
            alt="EPAV Logo" 
            className="mx-auto mb-4 h-24 w-auto"
          />
          <h1 className="text-2xl font-bold text-blue-900">
            Sistema de Rifas EPAV
          </h1>
          <p className="text-gray-600 mt-2">
            Acesso ao Painel Administrativo
          </p>
        </div>

        {/* Card de Login */}
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-gray-800">
              Autenticação Necessária
            </CardTitle>
            <CardDescription>
              Digite a senha para acessar o painel administrativo
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">
                  Senha de Administrador
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite a senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  disabled={loading || !password.trim()}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verificando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="text-gray-600 border-gray-300"
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informações de Segurança */}
        <div className="mt-6 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <h3 className="font-semibold text-gray-800 mb-2">🔒 Segurança</h3>
            <p className="text-sm text-gray-600">
              O acesso ao painel administrativo é protegido por senha. 
              Sua sessão expira automaticamente em 24 horas.
            </p>
          </div>
        </div>

        {/* Informação da Senha (apenas para demonstração) */}
        <div className="mt-4 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Para demonstração:</strong> A senha padrão é "epav2025"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
