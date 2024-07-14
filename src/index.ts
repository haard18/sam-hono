import axios from 'axios'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import processRouter from './routers/processRouter'
import messageRouter from './routers/messageRouter'
import featRouter from './routers/features'

const app = new Hono()

app.use(cors())

app.get('/', (c) => {
  return c.text('Welcome to SAM Onchain')
})
app.route('/api/process',processRouter)
app.route('/api/message',messageRouter)
app.route('/api/feat',featRouter)
// app.post('/getInfo',async(c)=>{
//   const {processId}=await c.req.json()
//   const response=await axios.post(
//     `https://cu32.ao-testnet.xyz/dry-run?process-id=${processId}`,
//     {
//       Owner: '123456789',
//       Target: processId,
//       Tags: [
//         {
//           name: 'Action',
//           value: 'Info'
//         }
//       ]
//     },
//     {
//       headers: {
//         'accept': '*/*',
//         'accept-language': 'en-US,en;q=0.9',
//         'content-type': 'application/json',
//         'origin': 'null',
//         'priority': 'u=1, i',
//         'referer': 'https://www.ao.link/',
//         'sec-ch-ua': '"Opera";v="111", "Chromium";v="125", "Not.A/Brand";v="24"',
//         'sec-ch-ua-mobile': '?0',
//         'sec-ch-ua-platform': '"Windows"',
//         'sec-fetch-dest': 'empty',
//         'sec-fetch-mode': 'cors',
//         'sec-fetch-site': 'cross-site',
//         'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 OPR/111.0.0.0'
//       }
//     }
//   );

//   return c.json(response.data)
// })
export default app
