import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import JoinCode from './JoinCode'

// Mock the data-fetching hook so the component never touches Supabase.

const joinRoomMock = vi.fn()

vi.mock('../../hooks/useJoinRoom', () => ({
  useJoinRoom: () => ({
    joinRoom: joinRoomMock,
    loading: false,
    error: '',
  }),
}))


const renderJoinCode = () =>
  render(
    <MemoryRouter>
      <JoinCode />
    </MemoryRouter>
  )

describe('JoinCode form', () => {
  beforeEach(() => {
    joinRoomMock.mockClear()
  })

  test('shows an error when submitting an empty code', () => {
    renderJoinCode()

    const button = screen.getByRole('button', { name: /join room/i })
    fireEvent.click(button)

    expect(screen.getByText(/please enter a room code/i)).toBeInTheDocument()
    expect(joinRoomMock).not.toHaveBeenCalled()
  })

  test('shows an error when the code is shorter than 6 characters', () => {
    renderJoinCode()

    const input = screen.getByLabelText(/room code/i)
    fireEvent.change(input, { target: { value: 'ABC' } })

    const button = screen.getByRole('button', { name: /join room/i })
    fireEvent.click(button)

    expect(screen.getByText(/must be 6 characters/i)).toBeInTheDocument()
    expect(joinRoomMock).not.toHaveBeenCalled()
  })

  test('input is automatically uppercased as the user types', () => {
    renderJoinCode()

    const input = screen.getByLabelText(/room code/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'abc123' } })

    expect(input.value).toBe('ABC123')
  })

  test('calls joinRoom with the trimmed code when input is valid', () => {
    renderJoinCode()

    const input = screen.getByLabelText(/room code/i)
    fireEvent.change(input, { target: { value: 'ABC123' } })

    const button = screen.getByRole('button', { name: /join room/i })
    fireEvent.click(button)

    expect(joinRoomMock).toHaveBeenCalledTimes(1)
    expect(joinRoomMock).toHaveBeenCalledWith('ABC123')
  })
})