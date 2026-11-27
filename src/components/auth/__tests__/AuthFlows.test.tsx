/// <reference types="jest" />
import React from 'react';
import { TextEncoder, TextDecoder } from 'util';
if (typeof (global as any).TextEncoder === 'undefined') {
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthProvider';
import ResetPassword from '../../../pages/ResetPassword';
import SystemOverlays from '../../ui/SystemOverlays';
import { supabase } from '../../../supabaseClient';

let authStateCallback: ((event: string, session: any) => void) | null = null;

jest.mock('../../../supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn((cb: any) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      }),
      updateUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../../../utils/AudioManager', () => ({
  audioManager: {
    cleanup: jest.fn(),
  },
}));

jest.mock('../../../utils/performance', () => ({
  isExtendedPerformanceMode: () => true,
  isPerformanceMode: () => false,
}));

function RecoveryProbe() {
  const { isPasswordRecovery, session } = useAuth();
  return (
    <div>
      <span data-testid="recovery-flag">{String(isPasswordRecovery)}</span>
      <span data-testid="session-flag">{session ? 'yes' : 'no'}</span>
    </div>
  );
}

describe('Auth flows (Recovery, ResetPassword, Logout)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authStateCallback = null;
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
  });

  test('AuthProvider sets isPasswordRecovery on PASSWORD_RECOVERY event', async () => {
    render(
      <AuthProvider>
        <RecoveryProbe />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('recovery-flag')).toHaveTextContent('false');
    });

    act(() => {
      authStateCallback?.('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'a@b.com' } });
    });

    expect(screen.getByTestId('recovery-flag')).toHaveTextContent('true');
    expect(screen.getByTestId('session-flag')).toHaveTextContent('yes');
  });

  test('ResetPassword renders new password form in recovery mode and calls updateUser', async () => {
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: { id: 'u1', email: 'agente@ordo.com' } } },
    });
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({ data: { user: {} }, error: null });

    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <AuthProvider>
          <ResetPassword />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    act(() => {
      authStateCallback?.('PASSWORD_RECOVERY', { user: { id: 'u1', email: 'agente@ordo.com' } });
    });

    const newInput = await screen.findByLabelText('NOVA SENHA');
    const confirmInput = screen.getByLabelText('CONFIRMAR SENHA');
    fireEvent.change(newInput, { target: { value: 'Ordo1234' } });
    fireEvent.change(confirmInput, { target: { value: 'Ordo1234' } });
    fireEvent.click(screen.getByRole('button', { name: /SALVAR NOVA SENHA/i }));

    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'Ordo1234' });
    });
  });

  test('SystemOverlays calls supabase.auth.signOut when clicking SAIR DO SISTEMA on Home', async () => {
    (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

    render(
      <MemoryRouter initialEntries={['/']}>
        <SystemOverlays />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByRole('button', { name: /SAIR DO SISTEMA/i });
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
    });
  });

  test('SystemOverlays does not render HUD on /login', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <SystemOverlays />
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});
