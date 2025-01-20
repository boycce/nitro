export function IsFirstRender(delay) {
  /*
   * Checks if the current render of a react component is the first
   * E.g. const isFirst = isFirstRender()
   * @param {boolean} delay
   * @link https://stackoverflow.com/a/56267719/1900648
   * @return boolean
   */
  const isMountRef = useRef(true)
  useEffect(() => {
    if (delay) setTimeout(() => isMountRef.current = false, delay)
    else isMountRef.current = false
  }, [])
  return isMountRef.current
}