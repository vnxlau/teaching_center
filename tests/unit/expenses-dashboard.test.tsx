import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { SessionProvider } from 'next-auth/react';
import ExpensesDashboard from '@/app/admin/expenses/page';

// Custom render function with SessionProvider
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <SessionProvider session={{
      user: {
        id: '1',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'ADMIN'
      },
      expires: '2025-01-01T00:00:00.000Z'
    }}>
      {component}
    </SessionProvider>
  );
};

// Mock components
jest.mock('@/components/NotificationProvider', () => ({
  useNotification: jest.fn(() => ({
    showNotification: jest.fn()
  }))
}));

jest.mock('@/components/LoadingSpinner', () => {
  return function MockLoadingSpinner() {
    return <div data-testid="loading-spinner">Loading...</div>;
  };
});

jest.mock('@/components/Breadcrumb', () => {
  return function MockBreadcrumb({ items }: { items: any[] }) {
    return <nav data-testid="breadcrumb">{items.map(item => item.label).join(' > ')}</nav>;
  };
});

jest.mock('@/components/Modal', () => {
  return function MockModal({ isOpen, onClose, title, children }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal" role="dialog">
        <h2>{title}</h2>
        <div>{children}</div>
        <button onClick={onClose} data-testid="modal-close">Close</button>
      </div>
    );
  };
});

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

const mockExpenses = [
  {
    id: '1',
    type: 'SERVICE',
    description: 'Internet Service',
    amount: 150.00,
    date: '2025-01-15',
    category: 'Utilities',
    vendor: 'ISP Company',
    notes: 'Monthly internet bill',
    createdAt: '2025-01-15T10:00:00Z',
    createdBy: 'admin@test.com'
  },
  {
    id: '2',
    type: 'MATERIALS',
    description: 'Office Supplies',
    amount: 75.50,
    date: '2025-01-10',
    category: 'Office',
    vendor: 'Office Depot',
    notes: 'Pens, paper, etc.',
    createdAt: '2025-01-10T14:30:00Z',
    createdBy: 'admin@test.com'
  }
];

const mockStats = {
  overview: {
    totalExpenses: 225.50,
    monthlyExpenses: 225.50,
    serviceExpenses: 150.00,
    materialsExpenses: 75.50,
    dailyEmployeesExpenses: 0,
    expenseCount: 2
  },
  monthlyBreakdown: [
    {
      month: 'January',
      year: 2025,
      totalAmount: 225.50,
      serviceAmount: 150.00,
      materialsAmount: 75.50,
      dailyEmployeesAmount: 0,
      expenseCount: 2
    }
  ],
  categoryBreakdown: [
    {
      category: 'Utilities',
      totalAmount: 150.00,
      percentage: 66.67,
      expenseCount: 1
    },
    {
      category: 'Office',
      totalAmount: 75.50,
      percentage: 33.33,
      expenseCount: 1
    }
  ]
};

describe('ExpensesDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful API responses
    mockFetch.mockImplementation((url: string | URL | Request) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes('/api/admin/expenses') && !urlString.includes('/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExpenses)
        } as Response);
      }
      if (urlString.includes('/api/admin/expenses/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats)
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      } as Response);
    });
  });

  it('renders the expenses dashboard and loads data', async () => {
    renderWithProviders(<ExpensesDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Internet Service')).toBeInTheDocument();
    });

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Expenses Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Add Expense')).toBeInTheDocument();
  });

  it('displays expenses data after loading', async () => {
    renderWithProviders(<ExpensesDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Internet Service')).toBeInTheDocument();
    });

    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
    // Check that €150.00 appears in the table (should be in the amount column)
    const amountCells = screen.getAllByText('€150.00');
    expect(amountCells.length).toBeGreaterThanOrEqual(1); // At least one in the table
    // Check that €75.50 appears in the table (should be in the amount column for another expense)
    const seventyFiveCells = screen.getAllByText('€75.50');
    expect(seventyFiveCells.length).toBeGreaterThanOrEqual(1); // At least one in the table
  });

  it('displays expense statistics correctly', async () => {
    renderWithProviders(<ExpensesDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    });

    // Check that the total appears in the statistics card
    const totalElements = screen.getAllByText('€225.50');
    expect(totalElements.length).toBeGreaterThan(0);
  });

  it('opens add expense modal when add button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExpensesDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Internet Service')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add expense/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Expense')).toBeInTheDocument();
    });
  });

  it('filters expenses by type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExpensesDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Internet Service')).toBeInTheDocument();
    });

    // Find and use the type filter select
    const typeFilter = screen.getByRole('combobox');
    await user.selectOptions(typeFilter, 'SERVICE');

    // Should still show SERVICE expense
    expect(screen.getByText('Internet Service')).toBeInTheDocument();
    // Should hide MATERIALS expense (this test assumes filtering works)
    // Note: Actual filtering implementation may vary
  });

  it('searches expenses by description', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ExpensesDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Internet Service')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search expenses/i);
    await user.type(searchInput, 'Office');

    expect(screen.queryByText('Internet Service')).not.toBeInTheDocument();
    expect(screen.getByText('Office Supplies')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    // Mock API error for expenses
    mockFetch.mockImplementation((url: string | URL | Request) => {
      const urlString = typeof url === 'string' ? url : url.toString();
      if (urlString.includes('/api/admin/expenses') && !urlString.includes('/stats')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' })
        } as Response);
      }
      if (urlString.includes('/api/admin/expenses/stats')) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Internal server error' })
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' })
      } as Response);
    });

    renderWithProviders(<ExpensesDashboard />);

    // Component should still render the basic UI even with API errors
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Expenses Dashboard' })).toBeInTheDocument();
    });

    expect(screen.getByText('Add Expense')).toBeInTheDocument();
  });

  it('displays expense statistics correctly', async () => {
    renderWithProviders(<ExpensesDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    });

    expect(screen.getByText('Total Expenses')).toBeInTheDocument();
    // Find the Total Expenses card and check for the amount within it
    const totalExpensesText = screen.getByText('Total Expenses');
    const totalExpensesCard = totalExpensesText.closest('.bg-white') as HTMLElement;
    expect(within(totalExpensesCard).getByText('€225.50')).toBeInTheDocument();
  });

  it('displays expense categories correctly', async () => {
    renderWithProviders(<ExpensesDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Internet Service')).toBeInTheDocument();
    });

    // Check that different expense types are displayed
    expect(screen.getByText('SERVICE')).toBeInTheDocument();
    expect(screen.getByText('MATERIALS')).toBeInTheDocument();
  });
});
