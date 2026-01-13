import { handle } from '@hono/node-server/vercel'
import app from '../src/index.tsx'

export default handle(app)