import express, { Request, Response } from "express"
import bodyParser from "body-parser"
import * as utils from "./../../common/utils/helpers"
import axios from "axios"
import { getAccessToken } from "../../common/utils/paypal_helpers"
import Fastlane from "../../models/Fastlane/Fastlane.mongoose"

const PPCP_Api = express.Router()
PPCP_Api.use(bodyParser.json())
PPCP_Api.use(bodyParser.urlencoded({ extended: true }))

PPCP_Api.get('/client-token', async (request: Request, response: Response) => {
  try {
    const URL = `${utils.getPaypalBaseEndpoint()}/v1/oauth2/token`
    const AUTHORIZATION = Buffer.from(
      utils.getPaypalClientID() + ":" + utils.getPaypalSecretKey(),
    ).toString("base64")
    const HEADERS = {
      Authorization: `Basic ${AUTHORIZATION}`
    }
    const URL_ENCODE = new URLSearchParams();
    URL_ENCODE.append("grant_type", "client_credentials");
    URL_ENCODE.append("response_type", "client_token");
    URL_ENCODE.append("intent", "sdk_init");
    // URL_ENCODE.append("domains[]", "example.com,example2.com");

    const result: {
      data: any,
      message: string,
      status: number
    } = await axios.post(URL, URL_ENCODE, { headers: HEADERS })

    if (result.status === 200) {
      response.status(result.status).json({
        success: true,
        data: result.data.access_token,
        message: null
      })
    } else {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message
      })
    }
  } catch(e) {
    response.status(400).json({
      success: false,
      data: null,
      message: e
    })
  }
})

PPCP_Api.get('/access-token', async (request: Request, response: Response) => {
  try {
    const URL = `${utils.getPaypalBaseEndpoint()}/v1/oauth2/token`
    const AUTHORIZATION = Buffer.from(
      utils.getPaypalClientID() + ":" + utils.getPaypalSecretKey(),
    ).toString("base64")
    const HEADERS = {
      Authorization: `Basic ${AUTHORIZATION}`
    }
    const URL_ENCODE = new URLSearchParams();
    URL_ENCODE.append("grant_type", "client_credentials");

    const result: {
      data: any,
      message: string,
      status: number
    } = await axios.post(URL, URL_ENCODE, { headers: HEADERS })

    if (result.status === 200) {
      response.status(result.status).json({
        success: true,
        data: result.data.access_token,
        message: null
      })
    } else {
      response.status(400).json({
        success: false,
        data: null,
        message: result.message
      })
    }
  } catch (e) {
    response.status(400).json({
      success: false,
      data: null,
      message: e
    })
  }
})

PPCP_Api.post('/create-order', getAccessToken, async (req: Request, res: Response) => {
  const { paymentToken, price, shippingAddress } = req.body;

  const url = 'https://api-m.sandbox.paypal.com/v2/checkout/orders'
  const headers = {
    ...req.headers,
    "Content-Type": "application/json",
    "PayPal-Request-Id": Date.now().toString()
  }
  const payload = {
    "intent": "CAPTURE",
    // "intent": "AUTHORIZE",
    "payment_source": {
      "card": {
        "single_use_token": paymentToken.id
      }
    },
    "purchase_units": [
      {
        "reference_id": `ABC-${Date.now().toString()}`,
        "amount": {
          "currency_code": "USD",
          "value": price
        },
        // "items": [
        //     {
        //       "name": "Coffee",
        //       "description": "1 lb Kona Island Beans",
        //       "sku": "sku03",
        //       "unit_amount": {
        //         "currency_code": "USD",
        //         "value": price
        //       },
        //       "quantity": "1",
        //       "category": "PHYSICAL_GOODS",
        //       "image_url": "https://example.com/static/images/items/1/kona_coffee_beans.jpg",
        //       "url": "https://example.com/items/1/kona_coffee_beans",
        //       "upc": {
        //         "type": "UPC-A",
        //         "code": "987654321015"
        //       }
        //     }
        //   ],
        "shipping": {
          "type": "SHIPPING",
          "name": {
            "full_name": shippingAddress?.name?.fullName
          },
          "address": {
            "address_line_1": shippingAddress?.address?.addressLine1,
            "admin_area_2": shippingAddress?.address?.adminArea2,
            "admin_area_1": shippingAddress?.address?.adminArea1,
            "postal_code": shippingAddress?.address?.postalCode,
            "country_code": shippingAddress?.address?.countryCode
          },
          "phone_number": {
            "country_code": shippingAddress?.phoneNumber?.countryCode,
            "national_number": shippingAddress?.phoneNumber?.nationalNumber.replace("-", "")
          }
        } 
      }
    ]
  }
  const rsCreate = await Fastlane.Create({
    fastlaneData: req.body,
    requestData: {
      url,
      headers,
      payload
    },
    responseData: {}
  })

  const result = await axios.post(url, payload, { headers });
  rsCreate._id && await Fastlane.Update(rsCreate._id, {
    fastlaneData: req.body,
    requestData: {
      url,
      headers,
      payload
    },
    responseData: result.data
  })
  .then(rs => {
    res.status(result.status).json({
      success: true,
      data: result.data,
      message: null
    })
  })
  .catch((err: Error) => {
    res.status(500).json({
      success: false,
      data: err,
      message: err.message
    })
  })

  // res.status(result.status).json({
  //   success: true,
  //   data: result.data,
  //   payload,
  //   message: null
  // })
})

export default PPCP_Api