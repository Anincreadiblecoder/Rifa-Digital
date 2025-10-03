-- Script SQL para criar as tabelas do Sistema de Rifas EPAV no Supabase
-- Versão atualizada com persistência de notificações e alertas

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de rifas
CREATE TABLE IF NOT EXISTS rifas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  tamanho INTEGER NOT NULL CHECK (tamanho >= 50 AND tamanho <= 10000),
  status VARCHAR(50) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'finalizada', 'arquivada')),
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  vencedor_id UUID,
  vencedor_numero INTEGER,
  vencedor_nome VARCHAR(255),
  vencedor_telefone VARCHAR(20),
  data_sorteio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de participantes
CREATE TABLE IF NOT EXISTS participantes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rifa_id UUID NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  data_reserva TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'cancelado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Garantir que cada número seja único por rifa
  UNIQUE(rifa_id, numero)
);

-- Tabela de links personalizados
CREATE TABLE IF NOT EXISTS links_personalizados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rifa_id UUID NOT NULL REFERENCES rifas(id) ON DELETE CASCADE,
  limite_numeros INTEGER NOT NULL CHECK (limite_numeros >= 1 AND limite_numeros <= 100),
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_uso TIMESTAMP WITH TIME ZONE,
  usado_por JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações e alertas para o administrador
CREATE TABLE IF NOT EXISTS notificacoes_admin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('nova_participacao', 'duplicidade', 'concorrencia', 'sistema', 'erro')),
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  dados JSONB,
  rifa_id UUID REFERENCES rifas(id) ON DELETE CASCADE,
  participante_id UUID REFERENCES participantes(id) ON DELETE SET NULL,
  prioridade VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta', 'critica')),
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_leitura TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de usuários administrativos (opcional, pode usar Supabase Auth)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  nome VARCHAR(255),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_rifas_status ON rifas(status);
CREATE INDEX IF NOT EXISTS idx_rifas_data_criacao ON rifas(data_criacao);
CREATE INDEX IF NOT EXISTS idx_participantes_rifa_id ON participantes(rifa_id);
CREATE INDEX IF NOT EXISTS idx_participantes_numero ON participantes(rifa_id, numero);
CREATE INDEX IF NOT EXISTS idx_participantes_data_reserva ON participantes(data_reserva);
CREATE INDEX IF NOT EXISTS idx_links_rifa_id ON links_personalizados(rifa_id);
CREATE INDEX IF NOT EXISTS idx_links_usado ON links_personalizados(usado);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON notificacoes_admin(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes_admin(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data_criacao ON notificacoes_admin(data_criacao);
CREATE INDEX IF NOT EXISTS idx_notificacoes_rifa_id ON notificacoes_admin(rifa_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_prioridade ON notificacoes_admin(prioridade);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para criar notificação de nova participação
CREATE OR REPLACE FUNCTION criar_notificacao_nova_participacao()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notificacoes_admin (
        tipo,
        titulo,
        mensagem,
        dados,
        rifa_id,
        participante_id,
        prioridade
    ) VALUES (
        'nova_participacao',
        'Nova Participação',
        'Novo participante reservou número na rifa',
        jsonb_build_object(
            'participante_nome', NEW.nome,
            'participante_telefone', NEW.telefone,
            'participante_email', NEW.email,
            'numero', NEW.numero,
            'data_reserva', NEW.data_reserva
        ),
        NEW.rifa_id,
        NEW.id,
        'normal'
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para detectar e criar notificação de duplicidade
CREATE OR REPLACE FUNCTION detectar_duplicidade()
RETURNS TRIGGER AS $$
DECLARE
    duplicatas_count INTEGER;
    rifa_nome VARCHAR(255);
BEGIN
    -- Contar quantos participantes têm o mesmo nome e telefone nesta rifa
    SELECT COUNT(*) INTO duplicatas_count
    FROM participantes 
    WHERE rifa_id = NEW.rifa_id 
    AND LOWER(nome) = LOWER(NEW.nome) 
    AND telefone = NEW.telefone;
    
    -- Se há mais de 1 (incluindo o recém-inserido), é uma duplicidade
    IF duplicatas_count > 1 THEN
        -- Buscar nome da rifa
        SELECT nome INTO rifa_nome FROM rifas WHERE id = NEW.rifa_id;
        
        INSERT INTO notificacoes_admin (
            tipo,
            titulo,
            mensagem,
            dados,
            rifa_id,
            participante_id,
            prioridade
        ) VALUES (
            'duplicidade',
            'Possível Duplicidade Detectada',
            'Mesmo participante pode ter reservado múltiplos números',
            jsonb_build_object(
                'participante_nome', NEW.nome,
                'participante_telefone', NEW.telefone,
                'participante_email', NEW.email,
                'numero_atual', NEW.numero,
                'total_numeros', duplicatas_count,
                'rifa_nome', rifa_nome
            ),
            NEW.rifa_id,
            NEW.id,
            'alta'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_rifas_updated_at BEFORE UPDATE ON rifas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers para criar notificações automaticamente
CREATE TRIGGER trigger_notificacao_nova_participacao 
    AFTER INSERT ON participantes
    FOR EACH ROW EXECUTE FUNCTION criar_notificacao_nova_participacao();

CREATE TRIGGER trigger_detectar_duplicidade 
    AFTER INSERT ON participantes
    FOR EACH ROW EXECUTE FUNCTION detectar_duplicidade();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE rifas ENABLE ROW LEVEL SECURITY;
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE links_personalizados ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública das rifas ativas
CREATE POLICY "Rifas públicas podem ser lidas" ON rifas
    FOR SELECT USING (status IN ('ativa', 'pausada', 'finalizada'));

-- Política para permitir leitura pública dos participantes
CREATE POLICY "Participantes podem ser lidos publicamente" ON participantes
    FOR SELECT USING (true);

-- Política para permitir inserção de participantes
CREATE POLICY "Qualquer um pode inserir participantes" ON participantes
    FOR INSERT WITH CHECK (true);

-- Política para permitir leitura de links personalizados
CREATE POLICY "Links podem ser lidos publicamente" ON links_personalizados
    FOR SELECT USING (true);

-- Política para permitir atualização de links (marcar como usado)
CREATE POLICY "Links podem ser atualizados" ON links_personalizados
    FOR UPDATE USING (true);

-- Política para permitir leitura de notificações (público para simplicidade)
CREATE POLICY "Notificações podem ser lidas" ON notificacoes_admin
    FOR SELECT USING (true);

-- Política para permitir atualização de notificações (marcar como lida)
CREATE POLICY "Notificações podem ser atualizadas" ON notificacoes_admin
    FOR UPDATE USING (true);

-- Política para permitir inserção de notificações
CREATE POLICY "Notificações podem ser inseridas" ON notificacoes_admin
    FOR INSERT WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE rifas IS 'Tabela principal das rifas do sistema EPAV';
COMMENT ON TABLE participantes IS 'Participantes das rifas com seus números escolhidos';
COMMENT ON TABLE links_personalizados IS 'Links personalizados com limite de números por participante';
COMMENT ON TABLE notificacoes_admin IS 'Notificações e alertas persistentes para o administrador';
COMMENT ON TABLE admin_users IS 'Usuários administrativos do sistema (opcional)';

COMMENT ON COLUMN notificacoes_admin.tipo IS 'Tipo da notificação: nova_participacao, duplicidade, concorrencia, sistema, erro';
COMMENT ON COLUMN notificacoes_admin.prioridade IS 'Prioridade da notificação: baixa, normal, alta, critica';
COMMENT ON COLUMN notificacoes_admin.dados IS 'Dados adicionais da notificação em formato JSON';
COMMENT ON COLUMN notificacoes_admin.lida IS 'Indica se a notificação foi lida pelo administrador';

-- Verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('rifas', 'participantes', 'links_personalizados', 'notificacoes_admin', 'admin_users');

-- Exemplo de consulta para ver notificações não lidas
-- SELECT * FROM notificacoes_admin WHERE lida = false ORDER BY data_criacao DESC;

-- Exemplo de consulta para ver notificações por tipo
-- SELECT tipo, COUNT(*) as total FROM notificacoes_admin GROUP BY tipo;

-- Exemplo de consulta para ver notificações de alta prioridade
-- SELECT * FROM notificacoes_admin WHERE prioridade IN ('alta', 'critica') AND lida = false ORDER BY data_criacao DESC;
