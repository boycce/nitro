import { Topbar, Input, Button, FormError, util } from 'nitro-web'
import { Config, Errors } from 'types'

export function Signin({ config }: { config: Config }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isSignout = location.pathname == '/signout'
  const isLoading = useState(isSignout ? 'is-loading' : '')
  const [, setStore] = useTracked()
  const [state, setState] = useState({
    email: config.env == 'development' ? config.placeholderEmail : '',
    password: config.env == 'development' ? '1234' : '',
    errors: [] as Errors,
  })

  useEffect(() => {
    // Autofill the email input from ?email=
    const query = util.queryObject(location.search, true)
    if (query.email) setState({ ...state, email: query.email })
  }, [location.search])

  useEffect(() => {
    if (isSignout) {
      setStore(() => ({ user: null }))
      util.axios().get('/api/signout')
        .then(() => isLoading[1](''))
        .then(() => navigate({ pathname: '/signin', search: location.search }, { replace: true }))
        .catch(err => (console.error(err), isLoading[1]('')))
    }
  }, [isSignout])

  async function onSubmit (e: React.FormEvent<HTMLFormElement>) {
    try {
      const data = await util.request(e, 'post /api/signin', state, isLoading)
      isLoading[1]('is-loading')
      setStore(() => data)
      setTimeout(() => { // wait for setStore
        if (location.search.includes('redirect')) navigate(location.search.replace('?redirect=', ''))
        else navigate('/')
      }, 100) 
    } catch (e) {
      return setState({ ...state, errors: e as Errors})
    }
  }

  return (
    <div>
      <Topbar title={<>Sign in to your Account</>} />

      <form onSubmit={onSubmit}>
        <div>
          <label for="email">Email Address</label>
          <Input name="email" type="email" state={state} onChange={onChange.bind(setState)} placeholder="Your email address..." />
        </div>
        <div>
          <div class="flex justify-between"> 
            <label for="password">Password</label>
            <Link to="/reset" class="label underline2">Forgot?</Link>
          </div>
          <Input name="password" type="password" state={state} onChange={onChange.bind(setState)}/>
        </div>
        
        <div class="mb-14">
          Don&apos;t have an account? You can <Link to="/signup" class="underline2 is-active">sign up here</Link>.
          <FormError state={state} className="pt-2" />
        </div>

        <Button class="w-full" isLoading={!!isLoading[0]} type="submit">Sign In</Button>
      </form>
    </div>
  )
}
