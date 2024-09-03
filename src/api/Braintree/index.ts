import express from "express"
import bodyParser from "body-parser"

const Braintree_Api = express.Router()
Braintree_Api.use(bodyParser.json())
Braintree_Api.use(bodyParser.urlencoded({ extended: true }))

export default Braintree_Api