/// <reference types="jest" />
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FindingsDrawer from '../FindingsDrawer';
import TeamFindingsPopover from '../TeamFindingsPopover';

const mockRequestAnchorJump = jest.fn();
const mockSetDrawerOpen = jest.fn();

jest.mock('../../../contexts/CollaborationContext', () => ({
  useCollaboration: () => ({
    investigationId: 'inv-1',
    currentUserId: 'user-1',
    authorName: 'Lucas',
    isGameMaster: false,
    isDrawerOpen: true,
    setDrawerOpen: mockSetDrawerOpen,
    findings: [
      {
        id: 'f1',
        investigation_id: 'inv-1',
        category: 'code',
        label: '7492',
        details: 'Senha do cofre',
        source_card_id: 'card-1',
        source_tool: 'phone',
        source_anchor: { app: 'notes', itemId: 'n1' },
        created_by: 'user-1',
        author_name: 'Lucas',
        created_at: '2026-11-25T12:00:00Z',
      },
      {
        id: 'f2',
        investigation_id: 'inv-1',
        category: 'person',
        label: 'Dr. Arnaldo',
        details: null,
        source_card_id: null,
        source_tool: 'manual',
        source_anchor: {},
        created_by: 'user-2',
        author_name: 'Ana',
        created_at: '2026-11-25T12:05:00Z',
      },
    ],
    addFinding: jest.fn(),
    editFinding: jest.fn(),
    deleteFinding: jest.fn(),
    requestAnchorJump: mockRequestAnchorJump,
  }),
}));

describe('FindingsDrawer & TeamFindingsPopover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filtra achados por categoria e aciona jump clicável para origem', () => {
    render(<FindingsDrawer cardTitlesById={{ 'card-1': 'Celular do Suspeito' }} />);

    expect(screen.getByText('7492')).toBeInTheDocument();
    expect(screen.getByText('Dr. Arnaldo')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Código/i }));
    expect(screen.getByText('7492')).toBeInTheDocument();
    expect(screen.queryByText('Dr. Arnaldo')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Celular do Suspeito/i }));
    expect(mockRequestAnchorJump).toHaveBeenCalledWith(
      'card-1',
      'phone',
      { app: 'notes', itemId: 'n1' }
    );
  });

  it('TeamFindingsPopover aplica código selecionado via onSelectValue', () => {
    const onSelectValue = jest.fn();
    render(<TeamFindingsPopover onSelectValue={onSelectValue} />);

    fireEvent.click(screen.getByRole('button', { name: /Consultar Achados da Equipe/i }));
    fireEvent.click(screen.getByRole('button', { name: /Usar/i }));

    expect(onSelectValue).toHaveBeenCalledWith('7492');
  });
});
