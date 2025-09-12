import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import Modal from '@/components/Modal';

// Mock react-dom createPortal
jest.mock('react-dom', () => ({
  createPortal: (node: React.ReactNode) => node,
}));

describe('Modal Component', () => {
  it('renders modal content when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    // Check for close button by its SVG content or role
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const mockOnClose = jest.fn();
    const user = userEvent.setup();

    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /close modal/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom children correctly', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div>
          <h3>Custom Title</h3>
          <button>Custom Button</button>
          <input type="text" placeholder="Custom input" />
        </div>
      </Modal>
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom Button')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Custom input')).toBeInTheDocument();
  });
});
