import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import ApiV1 from './routers/API/ApiV1'
import { mongoose_connection } from './common/config/mongoose.connection'
import * as utils from './common/utils/helpers'
import Web from './routers/Web/Web'
import ApiOrder from './routers/API/ApiOrder'

dotenv.config()
const app = express()
app.use(cors({ origin: '*'}))
app.use(express.static('publics'))
// app.engine('html', engines.mustache)
app.set('view engine', 'ejs') // view engine: ejs or html
app.set('views', './src/views')
const PORT = process.env.PORT || 3000

app.use('/api/v1', ApiV1)
app.use('/orders', ApiOrder)
app.use('/', Web)

mongoose_connection({ connectionString: utils.getMongoConnectionString(), dbName: utils.getMongoDatabaseName()}, () => {
  app.listen(PORT, () => {
    console.log('Server start !!!')
  })
})