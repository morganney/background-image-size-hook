import { useEffect, useState, useCallback, useRef } from 'react'

const urlRgx = /url\((['"`])?(.+?)\1\)/
const getImagePromise = src =>
  new Promise(resolve => {
    const img = new Image()

    img.onload = () =>
      resolve({
        src,
        width: img.width,
        height: img.height
      })
    img.src = src
  })
/**
 * Hook to get the size in pixels of a CSS background image.
 * You must assign the returned ref in all use cases to help prevent memory leaks,
 * i.e. prevent calling setState on an unmounted component since loading of
 * background images is asynchronous.
 *
 * @param {Boolean|String|Array<String>} asCallbackFlagOrUrls Controls behavior of hook
 * @returns {Array} Includes ref, images, and possibly a callback: [ref, images, <callback>]
 */
const useBackgroundImageSize = (asCallbackFlagOrUrls = false) => {
  const ref = useRef()
  const [images, setImages] = useState(null)
  const callback = useCallback(async () => {
    if (Array.isArray(asCallbackFlagOrUrls)) {
      const imgPromises = asCallbackFlagOrUrls.map(getImagePromise)
      const imgs = await Promise.all(imgPromises)

      if (ref.current) {
        setImages(imgs)
      }
    }

    if (typeof asCallbackFlagOrUrls === 'string') {
      const image = await getImagePromise(asCallbackFlagOrUrls)

      if (ref.current) {
        setImages(image)
      }
    }

    if (typeof asCallbackFlagOrUrls === 'boolean') {
      if (ref.current) {
        const matches = window
          .getComputedStyle(ref.current)
          .backgroundImage.match(new RegExp(urlRgx, 'g'))

        if (Array.isArray(matches)) {
          const imgPromises = matches.map(match =>
            getImagePromise(match.replace(new RegExp(urlRgx), '$2'))
          )
          const imgs = await Promise.all(imgPromises)

          if (ref.current) {
            setImages(imgs.length > 1 ? imgs : imgs[0])
          }
        }
      }
    }
  }, [ref, asCallbackFlagOrUrls])

  useEffect(() => {
    if (asCallbackFlagOrUrls !== true) {
      callback()
    }
  }, [asCallbackFlagOrUrls, callback])

  return asCallbackFlagOrUrls === true ? [ref, images, callback] : [ref, images]
}

export { useBackgroundImageSize }
