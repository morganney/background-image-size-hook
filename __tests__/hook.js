import { renderHook, act } from '@testing-library/react-hooks'

import { useBackgroundImageSize } from '../src'

const src = 'https://test/file.png'
const mockElement = document.createElement('div')

mockElement.style.backgroundImage = `url(${src})`

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: jest.fn(() => ({
    current: mockElement
  }))
}))

describe('useBackgroundImageSize', () => {
  const width = 200
  const height = 100

  global.Image = class extends Image {
    constructor() {
      super()
      this.width = width
      this.height = height

      setTimeout(() => {
        this.onload()
      }, 25)
    }
  }

  it('gets the width and height of CSS background images', async () => {
    const { result, waitFor, rerender } = renderHook(
      ({ initialValue }) => useBackgroundImageSize(initialValue),
      {
        initialProps: { initialValue: undefined }
      }
    )

    // Should return the ref and null while the images are loading
    expect(result.current).toStrictEqual([{ current: mockElement }, null])

    // After the images load should return the width, height, and image src
    await waitFor(() => expect(result.current[1]).toStrictEqual({ width, height, src }))

    // Pass an image URL
    rerender({ initialValue: './foo/bar.png' })

    await waitFor(() =>
      expect(result.current[1]).toStrictEqual({
        width,
        height,
        src: './foo/bar.png'
      })
    )

    // Pass multiple image URLs
    rerender({ initialValue: ['./foo/bar.png', './one/two.svg'] })

    await waitFor(() =>
      expect(result.current[1]).toStrictEqual([
        { width, height, src: './foo/bar.png' },
        { width, height, src: './one/two.svg' }
      ])
    )

    // Pass true to get a reference to the callback
    rerender({ initialValue: true })

    expect(result.current[2]).toStrictEqual(expect.any(Function))

    act(() => {
      result.current[2]()
    })

    await waitFor(() => expect(result.current[1]).toStrictEqual({ width, height, src }))
  })
})
