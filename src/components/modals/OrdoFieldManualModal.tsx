import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Radio, FileSearch, Smartphone, Lock, X, Lightbulb } from 'lucide-react';
import './OrdoFieldManualModal.css';

export type ManualTabId = 'audio' | 'document' | 'device' | 'crypto';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: ManualTabId;
}

const TABS: { id: ManualTabId; label: string; icon: React.ComponentType<{ size?: number | string }> }[] = [
  { id: 'audio', label: 'Acústica Forense', icon: Radio },
  { id: 'document', label: 'Documentoscopia', icon: FileSearch },
  { id: 'device', label: 'Extração Móvel', icon: Smartphone },
  { id: 'crypto', label: 'Criptoanálise', icon: Lock },
];

export default function OrdoFieldManualModal({ isOpen, onClose, initialTab = 'audio' }: Props) {
  const [activeTab, setActiveTab] = useState<ManualTabId>(initialTab);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return createPortal(
    <div className="ordo-manual-backdrop" onClick={onClose}>
      <div className="ordo-manual-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Manual de Campo da Ordo">
        <header className="ordo-manual-header">
          <div className="ordo-manual-title-wrap">
            <BookOpen size={18} />
            <div>
              <h2>MANUAL DE CAMPO — C.R.I.S.</h2>
              <span>PROTOCOLOS DE PERÍCIA DA ORDO REALITAS</span>
            </div>
          </div>
          <button type="button" className="ordo-manual-close" onClick={onClose} aria-label="Fechar manual">
            <X size={18} />
          </button>
        </header>

        <nav className="ordo-manual-tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                className={`ordo-manual-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="ordo-manual-body">
          {activeTab === 'audio' && (
            <div className="ordo-manual-section">
              <h3>Como investigar gravações suspeitas</h3>
              <div className="ordo-manual-card">
                <strong>1. Observe o LED "Anomalia de Sinal"</strong>
                <p>Se o indicador piscar na Bancada Acústica, o arquivo contém energia fora do padrão de voz humana ou assimetria entre os canais estéreo.</p>
              </div>
              <div className="ordo-manual-card">
                <strong>2. Zona Fantasma (16.8 kHz – 20.5 kHz)</strong>
                <p>Mensagens ultrassônicas parecem uma linha fina no topo do espectrograma. Use a <b>Lupa de Banda Vertical</b> para esticar a faixa entre 16.8 kHz e 20.5 kHz e aumente o contraste.</p>
              </div>
              <div className="ordo-manual-card">
                <strong>3. Estéreo Oculto (Canal Diferença L − R)</strong>
                <p>Áudios aparentemente normais podem esconder desenhos gigantes em oposição de fase. Alterne o seletor de canais para <b>Diferença (L − R)</b> para cancelar a voz central e revelar o espectro oculto.</p>
              </div>
              <div className="ordo-manual-tip">
                <Lightbulb size={15} />
                <span>Dica: Gravações invertidas ou aceleradas ficam legíveis ajustando a Velocidade e ativando o modo Reverso.</span>
              </div>
            </div>
          )}

          {activeTab === 'document' && (
            <div className="ordo-manual-section">
              <h3>Inspeção física de papéis e fotografias</h3>
              <div className="ordo-manual-card">
                <strong>1. Lanterna UV &amp; Tinta Simpática (Térmica)</strong>
                <p>Nem toda marca oculta brilha no UV. Tintas orgânicas (como limão ou reagentes químicos) só escurecem quando você passa o <b>Aquecedor de Campo</b> devagar sobre o papel.</p>
              </div>
              <div className="ordo-manual-card">
                <strong>2. Camuflagem Cromática (Lentes R / G / B)</strong>
                <p>Rabiscos vermelhos ou azuis caóticos podem estar escondendo texto por baixo. Coloque a lente da mesma cor dos rabiscos para torná-los transparentes.</p>
              </div>
              <div className="ordo-manual-card">
                <strong>3. Frente, Verso e Fragmentos</strong>
                <p>Documentos triturados ou rasgados podem ter anotações importantes no verso. Sempre teste girar os pedaços e usar o botão <b>Virar Folha</b> na Mesa de Luz.</p>
              </div>
            </div>
          )}

          {activeTab === 'device' && (
            <div className="ordo-manual-section">
              <h3>Perícia em dispositivos móveis apreendidos</h3>
              <div className="ordo-manual-card">
                <strong>1. Marcas de Dedo no Vidro</strong>
                <p>Antes de chutar um PIN ou Padrão, observe se há teclas com marcas de gordura ou desgaste — elas reduzem drasticamente as combinações possíveis.</p>
              </div>
              <div className="ordo-manual-card">
                <strong>2. Cruzamento entre Apps</strong>
                <p>Datas de aniversário no Chat costumam abrir Notas trancadas. Fotos na Galeria carregam metadados EXIF (horário e GPS) e podem ser enviadas direto para a <b>Mesa de Luz</b>.</p>
              </div>
              <div className="ordo-manual-card">
                <strong>3. Caixa Postal &amp; Lixeira</strong>
                <p>Áudios do gravador podem ser enviados direto para a Bancada Acústica com um clique. Mensagens marcadas como apagadas às vezes mantêm fragmentos recuperáveis.</p>
              </div>
            </div>
          )}

          {activeTab === 'crypto' && (
            <div className="ordo-manual-section">
              <h3>Padrões rápidos de decodificação</h3>
              <div className="ordo-manual-card">
                <strong>1. Identificando a codificação</strong>
                <p><code>==</code> no final quase sempre indica <b>Base64</b>. Pares de <code>0-9</code> e <code>A-F</code> indicam <b>Hexadecimal</b>. Apenas <code>0</code> e <code>1</code> indicam <b>Binário</b>.</p>
              </div>
              <div className="ordo-manual-card">
                <strong>2. Cifras de Substituição (César / Atbash / Vigenère)</strong>
                <p>Em português, as letras mais frequentes são <b>A</b>, <b>E</b>, <b>O</b> e <b>S</b>. Se uma palavra de 1 ou 2 letras se repete muito, teste os deslocamentos de César procurando vogais e preposições (DE, DO, EM).</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
