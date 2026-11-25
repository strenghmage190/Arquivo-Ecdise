import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
jest.mock('../../../supabaseClient', () => ({ supabase: {} }));
import PhoneViewer from '../PhoneViewer';
import { ForensicDispatchProvider } from '../../../contexts/ForensicDispatchContext';
import { DeviceExtractionMetadata } from '../../../types/forensicPillars';

const MOCK_DEVICE: DeviceExtractionMetadata = {
  version: 2,
  ownerName: 'Arthur Cervero',
  lockScreen: {
    enabled: false,
    type: 'pin',
    code: '1234',
    smudgeHints: ['1', '2'],
  },
  enabledApps: {
    messages: true,
    gallery: true,
    notes: true,
    voicemails: true,
    trash: true,
  },
  threads: [
    {
      id: 't1',
      contactName: 'Joui',
      messages: [
        { id: 'm1', sender: 'them', type: 'text', text: 'Olhe a foto do galpão', time: '22:10' },
        {
          id: 'm2',
          sender: 'me',
          type: 'text',
          text: '',
          isDeleted: true,
          restorableText: 'Código do cofre: 9941',
          time: '22:11',
        },
      ],
    },
  ],
  gallery: [
    {
      id: 'g1',
      url: 'https://example.com/foto.jpg',
      caption: 'Galpão C',
      exif: { date: '2026-10-12', time: '23:40', gps: '-23.55, -46.63' },
    },
  ],
  notes: [
    {
      id: 'n1',
      title: 'Senha Cofre',
      body: 'Segredo revelado',
      isLocked: true,
      password: '1994',
      hint: 'Ano de nascimento',
    },
  ],
  voicemails: [
    {
      id: 'v1',
      caller: 'Desconhecido',
      duration: '0:18',
      date: 'Ontem',
      audioUrl: 'https://example.com/audio.wav',
    },
  ],
  trash: [
    {
      id: 'tr1',
      kind: 'note',
      label: 'rascunho.txt',
      preview: 'Texto recuperado da lixeira',
    },
  ],
};

describe('PhoneViewer (Device Extraction)', () => {
  it('navigates between apps, restores deleted message, unlocks note, and dispatches gallery photo', () => {
    const dispatchSpy = jest.fn();
    render(
      <ForensicDispatchProvider onDispatchToDecoder={dispatchSpy}>
        <PhoneViewer deviceData={MOCK_DEVICE} cardId="card-1" />
      </ForensicDispatchProvider>
    );

    expect(screen.getByText('Arthur Cervero')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Mensagens/i));

    expect(screen.getByText(/Mensagem apagada/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Restaurar/i));
    expect(screen.getByText('Código do cofre: 9941')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Voltar'));
    fireEvent.click(screen.getByText(/Notas/i));
    fireEvent.click(screen.getByText('Senha Cofre'));
    fireEvent.change(screen.getByPlaceholderText('Senha...'), { target: { value: '1994' } });
    fireEvent.click(screen.getByText('Desbloquear Nota'));
    expect(screen.getByText('Segredo revelado')).toBeInTheDocument();
  });
});
