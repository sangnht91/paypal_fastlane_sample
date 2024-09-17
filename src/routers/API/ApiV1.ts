import express from "express"
import PPCP_Api from "../../api/PPCP"
import Braintree_Api from "../../api/Braintree"
import wowpayApi from "../../api/PPCP/wowpay"

const ApiV1 = express.Router()
ApiV1.use("/ppcp", PPCP_Api)
ApiV1.use("/braintree", Braintree_Api)

export default ApiV1