# [`background-image-size-hook`](https://www.npmjs.com/package/background-image-size-hook)

React hook to get the size of CSS background images.

## Usage

First `npm i background-image-size-hook react react-dom`.

Then when you want to change the dimensions of an element based on the size of its loaded background image (`data:` urls are ok):

```js
import { useBackgroundImageSize } from 'background-image-size-hook'
import styled from 'styled-components'

const Box = styled.div`
  background-image: url('https://other-domain.com/images/cool.png');
  width: ${({ image }) => image.width}px;
  height: ${({ image }) => image.height}px;
`

const App = () => {
  const [ref, image] = useBackgroundImageSize()
  // Use a default while the background image is asynchronously re-loading
  const defaultSize = { width: 200, height: 200 }

  return <Box ref={ref} image={image ?? defaultSize} />
}
```

Alternatively, you can hide the element with CSS until the background-image size is known:

```js
const Box = styled.div`
  background-image: url('https://other-domain.com/images/cool.png');
  display: ${({ image }) => image ? 'block' : 'none'};
  width: ${({ image }) => image?.width ?? 200}px;
  height: ${({ image }) => image?.height ?? 200}px;
`

const App = () => {
  const [ref, image] = useBackgroundImageSize()

  return (
    <>
      <Box ref={ref} image={image} />
      {!image && <Skeleton width="200px" height="200px" />}
    </>
  )
}
```

## Advanced Usage

Beyond the simple use case of one static background image, more complex use cases require different hook behavior.

### Multiple Background Images

If the element has multiple background images then an array of objects will be returned instead of an object. Images not references by a `url` will be ignored:

```js
const Box = styled.div`
  background-image:
    linear-gradient(rgba(0, 0, 255, 0.5), rgba(255, 255, 0, 0.5)),
    url('https://other-domain.com/images/cool.png'),
    url('https://other-domain/images/rad.svg');
`
const App = () => {
  const [ref, images] = useBackgroundImageSize()

  console.log(images) // Array of two objects for each background image (once loaded)

  return <Box ref={ref} />
}
```

### Dynamic Background Images

If you use dynamic imports to load background images, for instance gravatars or tenant logos, and use a JavaScript bundler that supports loaders like [webpack](https://webpack.js.org/loaders/) or [esbuild](https://esbuild.github.io/api/#loader), then you can pass the resolved urls from the imports to the hook, so that the calculation of the background image size is dependent upon changes to the resolved url. This can also be achieved with the [mutliple dependencies](#multiple-dependencies) approach explained below by having the dynamic import state (`logo`) as a dependency.

```js
const Box = styled.div`
  display: ${({ image }) => (image ? 'block' : 'none')};
  background-image: url('${({ image }) => image?.src}');
  width: ${({ image }) => image?.width ?? 200}px;
  height: ${({ image }) => image?.height ?? 100}px;
`

const App = () => {
  const { tenantId } = useContext(Context)
  const [logo, setLogo] = useState('')
  const [ref, image] = useBackgroundImageSize(logo)

  useEffect(() => {
    const fetchTenantLogo = async () => {
      try {
        const logoImport = await import(`./assets/${tenantId}/logo.png`)

        setLogo(logoImport.default)
      } catch {
        setLogo('mickey-mouse.svg')
      }
    }

    fetchTenantLogo()
  }, [tenantId])

  return (
    <>
      <Box ref={ref} />
      {!image && <Skeleton width="200px" height="100px" />}
    </>
  )
}
```

If you want to pass urls from multiple dynamic background images, then use an array but make sure its reference does not change across renders, i.e. it is memoized:

```js
  const urls = useMemo(() => [urlA, urlB], [urlA, urlB])
  const [ref, images] = useBackgroundImageSize(urls)
```

### Multiple Dependencies

If you want to control when the background image size is computed based on other dependencies you can get a reference to the hooks callback by passing `true`. In this case the hook will include a callback to run when one of your dependencies changes.

```js
const App = () => {
  const [ref, images, getImageSizes] = useBackgroundImageSize(true)

  useEffect(() => {
    getImageSizes()
  }, [getImageSizes, dep1, dep2, etc])

  return <Box ref={ref} />
}
```

## About the Ref

To determine the exact width and height in pixels of the background image, it is reloaded into a dynamic image element (not attached to any DOM tree) which is an asynchronous process. Therefore, in all use cases you must attach the `ref` to the element with the background image to help prevent memory leaks, i.e. prevent the hook from potentially calling `setState` on an unmounted component. When no URLs are passed to the hook, the `ref` is used to get the URL of the background image, in addition to helping prevent a memory leaks.
