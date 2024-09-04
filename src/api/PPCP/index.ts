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
    URL_ENCODE.append("domains[]", "storage.googleapis.com");

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
    apiData: {
      requestData: {
        url,
        headers,
        payload
      },
      responseData: {}
    },
    siteData: {}
  })

  const result = await axios.post(url, payload, { headers });
  rsCreate._id && await Fastlane.Update(rsCreate._id, {
    fastlaneData: req.body,
    apiData: {
      requestData: {
        url,
        headers,
        payload
      },
      responseData: result.data
    },
    siteData: {
      "id": 21144891,
      "orderNumber": "2421144891",
      "orderStatus": "Paid",
      "languageCode": "EN",
      "currencyCode": "USD",
      "currencySign": "US$",
      orderPrice: price,
      "orderPriceFormatted": `$${price}`,
      "orderPriceUSD": price,
      "orderPriceFormattedUSD": `${price}`,
      "orderProductPrice": price,
      "orderProductPriceFormatted": `${price}`,
      "orderProductPriceUSD": price,
      "orderProductPriceFormattedUSD": `${price}`,
      "shippingPrice": 0,
      "shippingPriceFormatted": "$0",
      "shippingPriceUSD": 0,
      "shippingPriceFormattedUSD": "$0",
      "ip": "193.19.109.60",
      "productName": "Dr Goodrow Mini Home Garden",
      "productDescription": null,
      "orderType": "Regular Order",
      "campaignName": "Dr Goodrow Mini EN UP (GetMhamo 49 UP)",
      "createDate": "2024-09-04T03:43:12.183",
      "createDateOffset": "2024-09-04T03:43:13.0159043Z",
      "sku": "30615_3",
      "customerEmail": "sangnht3005@yahoo.com",
      "firstName": shippingAddress?.name?.firstName,
      "middleName": null,
      "lastName": shippingAddress?.name?.lastName,
      "addressId": 10974605,
      "orderBehaviorId": 2,
      "orderBehaviorName": "Test Order",
      "shippingAddress": {
          "id": 10974605,
          "firstName": shippingAddress?.name?.firstName,
          "middleName": null,
          "lastName": shippingAddress?.name?.lastName,
          "address1": shippingAddress?.address?.addressLine1,
          "address2": shippingAddress?.address?.addressLine2,
          "city": shippingAddress?.address?.adminArea2,
          "state": shippingAddress?.address?.adminArea1,
          "countryCode": shippingAddress?.address?.countryCode,
          "countryName": "United States of America",
          "zipCode": shippingAddress?.address?.postalCode,
          "phoneNumber": shippingAddress?.phoneNumber?.nationalNumber.replace("-", ""),
          "isVerified": null,
          "suggestion": null
      },
      "billingAddress": {
          "id": 10974605,
          "firstName": shippingAddress?.name?.firstName,
          "middleName": null,
          "lastName": shippingAddress?.name?.lastName,
          "address1": shippingAddress?.address?.addressLine1,
          "address2": shippingAddress?.address?.addressLine2,
          "city": shippingAddress?.address?.adminArea2,
          "state": shippingAddress?.address?.adminArea1,
          "countryCode": shippingAddress?.address?.countryCode,
          "countryName": "United States of America",
          "zipCode": shippingAddress?.address?.postalCode,
          "phoneNumber": shippingAddress?.phoneNumber?.nationalNumber.replace("-", ""),
          "isVerified": null,
          "suggestion": null
      },
      "receipts": [
          {
              "transactionId": "D2030B14-3EF7-4D0B-928C-6B697DAAF70E",
              "paymentStatus": "Paid",
              "paymentDescription": "Product",
              "paymentNumber": "2421144891",
              "currencyCode": "USD",
              "amount": price,
              "formattedAmount": `$${price}`,
              "midDescriptor": "TestDescriptor",
              "receiptDate": "2024-09-04T03:43:12.8",
              "Id": 24337975
          }
      ],
      "orderTaxes": null,
      "productImageUrls": null,
      "relatedOrders": []
    }
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