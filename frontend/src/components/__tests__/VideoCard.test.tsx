import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VideoCard from '../VideoCard';
import { Video } from '../../services/api';

const mockVideo: Video = {
  _id: '1',
  title: 'Test Video',
  description: 'Test Description',
  category: 'Action',
  duration: 120,
  uploadDate: '2025-09-28',
  views: 100,
  tags: ['test']
};

describe('VideoCard', () => {
  test('renders video information', () => {
    const mockOnClick = jest.fn();
    
    render(<VideoCard video={mockVideo} onClick={mockOnClick} />);
    
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('100 views')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const mockOnClick = jest.fn();
    
    render(<VideoCard video={mockVideo} onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByText('Test Video'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
