import React, { useState, useMemo } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import PhoneViewer from '../../tools/PhoneViewer';
import { DeviceBuilderPanel } from '../DeviceBuilderModal';
import { DeviceExtractionMetadata } from '../../../types/forensicPillars';

export default function FakePhoneChatBuilder() {
  const {
    phoneState,
    setPhoneState,
    investigationId,
    deviceExtraction,
    setDeviceExtraction,
  } = useClueModal();

  const [previewLocked, setPreviewLocked] = useState<boolean>(false);

  const basePhoneState = useMemo(
    () => ({
      hasKeypad: phoneState.hasKeypad,
      lockType: phoneState.lockType,
      password: phoneState.password,
      contactName: phoneState.contactName,
      chatList: phoneState.chatList,
    }),
    [
      phoneState.hasKeypad,
      phoneState.lockType,
      phoneState.password,
      phoneState.contactName,
      phoneState.chatList,
    ]
  );

  const handleDeviceChange = (device: DeviceExtractionMetadata) => {
    setDeviceExtraction(device);
    const firstThread = device.threads?.[0];
    setPhoneState((s) => ({
      ...s,
      hasKeypad: device.lockScreen.enabled,
      lockType: device.lockScreen.type,
      password: device.lockScreen.code,
      contactName: firstThread?.contactName || s.contactName,
      chatList: firstThread
        ? firstThread.messages.map((m) => ({
            id: m.id,
            sender: m.sender === 'me' ? 'me' : m.sender === 'system' ? 'system' : 'them',
            type: m.type === 'image' ? 'image' : 'text',
            text: m.isDeleted ? '[Mensagem apagada]' : m.text,
            ...(m.mediaUrl && m.type === 'image' ? { image_url: m.mediaUrl } : {}),
            ...(m.time ? { time: m.time } : {}),
          }))
        : s.chatList,
    }));
  };

  return (
    <div className="ccm-section ccm-chat-builder">
      {/* LADO ESQUERDO: EDITOR UNIFICADO DO APARELHO */}
      <div className="ccm-chat-col">
        <DeviceBuilderPanel
          inline
          investigationId={investigationId}
          initialDevice={deviceExtraction}
          basePhoneState={basePhoneState}
          onChange={handleDeviceChange}
        />

        {deviceExtraction && (
          <div className="ccm-note" style={{ fontSize: 11 }}>
            Resumo: {deviceExtraction.threads?.length || 0} conversa(s) |{' '}
            {deviceExtraction.gallery?.length || 0} foto(s) |{' '}
            {deviceExtraction.notes?.length || 0} nota(s) |{' '}
            {deviceExtraction.voicemails?.length || 0} áudio(s) |{' '}
            {deviceExtraction.trash?.length || 0} lixeira
          </div>
        )}
      </div>

      {/* LADO DIREITO: PREVIEW INTERATIVO */}
      <div className="ccm-phone-col">
        <button
          type="button"
          className={`ccm-btn ccm-btn-sm ccm-btn-block ${previewLocked ? 'ccm-btn-primary' : ''}`}
          onClick={() => setPreviewLocked((prev) => !prev)}
        >
          {previewLocked ? (
            <>
              <Unlock size={14} /> Testar Desbloqueado
            </>
          ) : (
            <>
              <Lock size={14} /> Simular Tela de Bloqueio
            </>
          )}
        </button>

        <div className="ccm-phone-frame">
          <PhoneViewer
            chatData={phoneState.chatList}
            contactName={phoneState.contactName}
            isLocked={previewLocked || Boolean(deviceExtraction?.lockScreen?.enabled)}
            password={
              previewLocked
                ? deviceExtraction?.lockScreen?.code || phoneState.password || '0000'
                : deviceExtraction?.lockScreen?.enabled
                  ? deviceExtraction.lockScreen.code
                  : undefined
            }
            passwordType={deviceExtraction?.lockScreen?.type || phoneState.lockType}
            deviceData={deviceExtraction}
          />
        </div>

        <div className="ccm-note" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Preview ({previewLocked ? 'Bloqueado' : 'Celular Apreendido'})
        </div>
      </div>
    </div>
  );
}
