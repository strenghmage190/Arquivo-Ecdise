import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './AgentProfileConfig.css';

interface AgentProfile {
  id?: string;
  agent_name: string;
  codename: string;
  clearance_level: string;
  specialization: string;
  avatar_url?: string;
  user_id?: string;
  prestige?: number;
}

interface AgentProfileConfigProps {
  onClose: () => void;
}

export default function AgentProfileConfig({ onClose }: AgentProfileConfigProps) {
  const [profile, setProfile] = useState<AgentProfile>({
    agent_name: '',
    codename: '',
    clearance_level: 'BRANCO',
    specialization: 'Investigação de Campo',
    prestige: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const profileData = {
        agent_name: profile.agent_name,
        codename: profile.codename,
        clearance_level: profile.clearance_level,
        specialization: profile.specialization,
        avatar_url: profile.avatar_url,
        prestige: profile.prestige || 0
      };

      if (profile.id) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Criar novo perfil (upsert)
        const { error } = await supabase
          .from('profiles')
          .upsert([{ id: user.id, ...profileData }]);

        if (error) throw error;
      }

      alert('Perfil salvo com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="agent-profile-modal">
        <div className="agent-profile-content">
          <div className="loading-text">CARREGANDO...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="agent-profile-modal">
      <div className="agent-profile-content">
        <div className="profile-header">
          <div className="title-badge">PERFIL</div>
          <h2>CONFIGURAÇÃO DE AGENTE</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>NOME DO AGENTE</label>
            <input
              type="text"
              value={profile.agent_name}
              onChange={(e) => setProfile({ ...profile, agent_name: e.target.value })}
              placeholder="Digite seu nome"
              className="nexus-input"
            />
          </div>

          <div className="form-group">
            <label>CODINOME</label>
            <input
              type="text"
              value={profile.codename}
              onChange={(e) => setProfile({ ...profile, codename: e.target.value })}
              placeholder="Ex: ECLIPSE, PHANTOM, CIPHER..."
              className="nexus-input"
            />
          </div>

          <div className="form-group">
            <label>CREDENCIAL DE ACESSO</label>
            <select
              value={profile.clearance_level}
              onChange={(e) => setProfile({ ...profile, clearance_level: e.target.value })}
              className="nexus-select"
            >
              <option value="BRANCO">⚪ BRANCO - Recruta (0+ Prestígio)</option>
              <option value="AMARELO">🟡 AMARELO - Operador (20+ Prestígio)</option>
              <option value="LARANJA">🟠 LARANJA - Agente Especial (50+ Prestígio)</option>
              <option value="VERMELHO">🔴 VERMELHO - Oficial de Operações (100+ Prestígio)</option>
              <option value="PRETO">⚫ PRETO - Agente de Elite (150+ Prestígio)</option>
              <option value="ALFA">⚜️ ALFA - Líder de Célula</option>
              <option value="OMEGA">🧿 ÔMEGA - Comando Absoluto</option>
            </select>
          </div>

          <div className="form-group">
            <label>PRESTÍGIO ATUAL</label>
            <input
              type="number"
              value={profile.prestige || 0}
              onChange={(e) => setProfile({ ...profile, prestige: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min="0"
              className="nexus-input"
            />
          </div>

          <div className="form-group">
            <label>ESPECIALIZAÇÃO TÁTICA</label>
            <select
              value={profile.specialization}
              onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
              className="nexus-select"
            >
              <option value="Investigação de Campo">Investigação de Campo</option>
              <option value="Combate Tático">Combate Tático</option>
              <option value="Ocultismo e Ritual">Ocultismo e Ritual</option>
              <option value="Análise Forense">Análise Forense</option>
              <option value="Infiltração">Infiltração e Espionagem</option>
              <option value="Tecnologia e Hacking">Tecnologia e Hacking</option>
              <option value="Medicina de Campo">Medicina de Campo</option>
              <option value="Diplomacia">Diplomacia e Negociação</option>
            </select>
          </div>

          <div className="form-actions">
            <button 
              className="btn-cancel" 
              onClick={onClose}
              disabled={saving}
            >
              CANCELAR
            </button>
            <button 
              className="btn-save" 
              onClick={handleSave}
              disabled={saving || !profile.agent_name || !profile.codename}
            >
              {saving ? 'SALVANDO...' : 'SALVAR PERFIL'}
            </button>
          </div>
        </div>

        <div className="profile-preview">
          <div className="preview-label">C.I.D. - CARTÃO DE IDENTIFICAÇÃO DIGITAL</div>
          <div className="agent-card">
            <div className="agent-clearance">{profile.clearance_level || 'BRANCO'}</div>
            <div className="agent-name">{profile.agent_name || '[Nome do Agente]'}</div>
            <div className="agent-codename">&quot;{profile.codename || '[Codinome Operacional]'}&quot;</div>
            <div className="agent-spec">{profile.specialization || 'Investigação de Campo'}</div>
            <div className="agent-prestige">PRESTÍGIO: {profile.prestige || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
