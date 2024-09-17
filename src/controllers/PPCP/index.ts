import express, { Request, Response } from "express"
import { initFastLane } from "../../common/utils/paypal_helpers"

const PPCP_Controller = express.Router()

PPCP_Controller.get("/checkout", async (request: Request, response: Response) => {
  response.render("Checkout", {})
})

PPCP_Controller.get("/upsell", (request: Request, response: Response) => {
  response.render("Upsell", {})
})

PPCP_Controller.get("/confirm", (request: Request, response: Response) => {
  response.render("Confirm", {})
})

export default PPCP_Controller