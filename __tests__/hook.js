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
  beforeAll(() => {
    jest.useFakeTimers()
  })
  afterAll(() => {
    jest.useRealTimers()
  })

  global.Image = class extends Image {
    constructor() {
      super()
      this.width = 200
      this.height = 200

      setTimeout(() => {
        this.onload()
      }, 25)
    }
  }

  it('gets the width and height of CSS background images', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useBackgroundImageSize())

    expect(result.current).toStrictEqual([{ current: mockElement }, null])
    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitForNextUpdate()

    //await waitForNextUpdate()
    expect(result.current).toStrictEqual([
      { current: mockElement },
      { width: 200, height: 200, src }
    ])
  })

  it('can be passed a url to use as the image src', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useBackgroundImageSize('./foo/bar')
    )

    act(() => {
      jest.advanceTimersByTime(1000)
    })
    await waitForNextUpdate()

    expect(result.current).toStrictEqual([
      { current: mockElement },
      { width: 200, height: 200, src: './foo/bar' }
    ])
  })

  it('can be passed an array of urls', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useBackgroundImageSize(['./foo/bar', './one/two'])
    )

    act(() => {
      jest.advanceTimersByTime(1000)
    })
    await waitForNextUpdate()

    expect(result.current).toStrictEqual([
      { current: mockElement },
      [
        { width: 200, height: 200, src: './foo/bar' },
        { width: 200, height: 200, src: './one/two' }
      ]
    ])
  })
})
