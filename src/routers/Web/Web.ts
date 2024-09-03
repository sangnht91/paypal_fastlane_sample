import express from "express"
import PPCP_Controller from "../../controllers/PPCP"

const Web = express.Router()

Web.use("/ppcp", PPCP_Controller)

export default Web