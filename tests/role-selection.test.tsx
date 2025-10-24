import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import RoleChoosePage from '@/app/roles/choose/page';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockUpdateSession = jest.fn();

describe('Role Selection Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
      update: mockUpdateSession,
    });
  });

  it('shows loading state initially', () => {
    render(<RoleChoosePage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to signin', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdateSession,
    });

    render(<RoleChoosePage />);
    expect(mockPush).toHaveBeenCalledWith('/auth/signin');
  });

  it('redirects users with existing role to dashboard', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'jobseeker',
        },
      },
      status: 'authenticated',
      update: mockUpdateSession,
    });

    render(<RoleChoosePage />);
    expect(mockPush).toHaveBeenCalledWith('/dashboard/jobseeker');
  });

  it('shows role selection for users without role', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          role: null,
        },
      },
      status: 'authenticated',
      update: mockUpdateSession,
    });

    render(<RoleChoosePage />);
    expect(screen.getByText('Choose Your Role')).toBeInTheDocument();
    expect(screen.getByText('Job Seeker')).toBeInTheDocument();
    expect(screen.getByText('Employer')).toBeInTheDocument();
  });

  it('handles jobseeker role selection', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          role: null,
        },
      },
      status: 'authenticated',
      update: mockUpdateSession,
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(<RoleChoosePage />);
    
    // Click on jobseeker card
    fireEvent.click(screen.getByText('Job Seeker'));
    
    // Click the choose button
    fireEvent.click(screen.getByText('Choose Job Seeker'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'jobseeker' }),
      });
    });

    expect(mockUpdateSession).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/dashboard/jobseeker');
  });

  it('handles employer role selection', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          role: null,
        },
      },
      status: 'authenticated',
      update: mockUpdateSession,
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true }),
    });

    render(<RoleChoosePage />);
    
    // Click on employer card
    fireEvent.click(screen.getByText('Employer'));
    
    // Click the choose button
    fireEvent.click(screen.getByText('Choose Employer'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: 'employer' }),
      });
    });

    expect(mockUpdateSession).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/dashboard/company');
  });

  it('shows error when role selection fails', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'test@example.com',
          role: null,
        },
      },
      status: 'authenticated',
      update: mockUpdateSession,
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, error: 'Role already set' }),
    });

    render(<RoleChoosePage />);
    
    // Click on jobseeker card
    fireEvent.click(screen.getByText('Job Seeker'));
    
    // Click the choose button
    fireEvent.click(screen.getByText('Choose Job Seeker'));

    await waitFor(() => {
      expect(screen.getByText('Role already set')).toBeInTheDocument();
    });
  });
});
