// @ts-nocheck
import { isRegex, deepFind, s3Image } from 'nitro-web/util'
import { DropHandler } from 'nitro-web'
import noImage from 'nitro-web/client/imgs/no-image.svg'
import { Errors, MonasteryImage } from 'types'

type DropProps = {
  awsUrl?: string
  className?: string
  /** Optional ID for the input element. Defaults to name if not provided */
  id?: string
  /** Field name or path on state (used to match errors), e.g. 'avatar', 'company.avatar' */
  name: string
  /** Called when file is selected or dropped */
  onChange?: any // (event: { target: { id: string, value: File|FileList } }) => void
  /** Whether to allow multiple file selection */
  multiple?: boolean
  /** State object to get the value and check errors against */
  state?: {
    errors?: Errors
    [key: string]: unknown
  }
  /** Props to pass to the input element */
  [key: string]: unknown
}

type Image = File | FileList | MonasteryImage | null

export function Drop({ awsUrl, className, id, name, onChange, multiple, state, ...props }: DropProps) {
  if (!name) throw new Error('Drop component requires a `name` prop')
  let value: Image = null
  let error: Error | unknown
  const inputId = id ||name
  const [urls, setUrls] = useState([])
  const stateRef = useRef(state)
  stateRef.current = state

  // Input is always controlled if state is passed in
  if (props.value) value = props.value as Image
  else if (typeof state == 'object') value = deepFind(state, name) as Image
  if (typeof value == 'undefined') value = null

  // An error matches this input path
  for (const item of (state?.errors as Errors[] || [])) {
    if (isRegex(name) && (item.title||'').match(name)) error = item
    else if (item.title == name) error = item
  }

  useEffect(() => {
    (async () => setUrls(await getUrls(value as File | FileList | MonasteryImage | null)))()
  }, [value])

  function tryAgain (e: { preventDefault: Function }) {
    e.preventDefault()
    // clear file input to allow reupload
    const input = document.getElementById(name) as HTMLInputElement
    if (input) input.value = ''
    if (onChange) {
      const errors = (stateRef?.current?.errors || []).filter((e: Errors[]) => e?.title != name)
      onChange({
        // remove file from state
        target: { id: name, value: null },
        // reset (server) errors
        errors: errors.length ? errors : undefined,
      })
    }
  }

  async function onFileAttach (files: FileList) { 
    // files is a FileList object
    if (onChange) onChange({ target: { id: name, value: multiple ? files : files[0] } })
  }

  async function getUrls(objectOrFileListItem: File | FileList | MonasteryImage | null) {
    /**
     * @param {object|FileList} objectOrFileListItem - FileList object or monastery image object
     * @returns {Promise} - Resolves to an array of image URLs
     */
    // Make sure FileLists are converted to a real array
    if (!objectOrFileListItem) return []
    const array = 'length' in objectOrFileListItem ? Array.from(objectOrFileListItem) : [objectOrFileListItem]
    return Promise.all(array.map((item) => {
      return new Promise((resolve, reject) => {
        if ('lastModified' in item) {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(item)
        } else {
          resolve(s3Image(awsUrl, item))
        }
      })
    }))
  }

  // function getFilename (objectOrFile) {
  //   if (objectOrFile.lastModified) return objectOrFile.name
  //   else return 'avatar.jpg'
  // }

  return (
    <div class={`mt-input-before mb-input-after ${className || ''}`}>
      <input 
        {...props}
        id={inputId}
        type="file"
        onChange={(e) => onFileAttach(e.target.files as FileList)}
        hidden
      />
      <DropHandler 
        onDrop={onFileAttach} 
        className="flex flex-column justify-center items-center text-center gap-2 text-grey-300 text-sm px-8 min-h-[300px]"
      >
        {
          !value &&
          <>
            {/* {todo upload svg here} */}
            <div>
              Drag and drop your file here&nbsp;
              <label class="weight-500 inline-block text-sm text-primary" for={inputId}>or select a file</label>
            </div>
          </>
        }
        {
          !!value &&
          <>
            {
              urls.map((url, i) => (
                <div key={i} class="flex align-items-center gap-1">
                  <img src={url || noImage} width="100%" />
                </div>
              ))
            }
            <div>
              Your file has been added successfully.&nbsp; 
              <Link to="#" class="text-primary" onClick={tryAgain}>Use another file?</Link>
            </div>
          </>
        }
      </DropHandler>
      {error && <div class="form-error mt-0-5">{error.detail}</div>}
    </div>
  )
}