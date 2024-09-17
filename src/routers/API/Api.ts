import express from "express"
import wowpayApi from "../../api/PPCP/wowpay"

const Api = express.Router()
Api.use("/", wowpayApi)

export default Api