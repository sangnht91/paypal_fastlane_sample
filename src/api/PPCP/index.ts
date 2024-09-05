import express, { Request, Response } from "express"
import bodyParser from "body-parser"
import * as utils from "./../../common/utils/helpers"
import axios from "axios"
import { getAccessToken } from "../../common/utils/paypal_helpers"
import Fastlane from "../../models/Fastlane/Fastlane.mongoose"
import { ITransaction } from "../../models/Transaction/Transaction.yup"
import Transactions from "../../models/Transaction/Transaction.mongoose"

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
  } catch (e) {
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
  const { paymentToken, price, shippingAddress, checkout, refId } = req.body;

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

  // save log
  const rsCreate = await Fastlane.Create({
    fastlaneData: req.body,
    refId: refId || null,
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
  const orderNumber = Date.now().toString()

  // defined transaction
  const transaction: ITransaction = {
    refOrderNumber: checkout ? '' : refId,
    orderNumber: `${orderNumber}`,
    orderStatus: 'Paid',
    languageCode: 'EN',
    currencyCode: 'USD',
    currencySign: 'US$',
    orderPrice: price,
    orderPriceFormatted: `$${price}`,
    orderPriceUSD: `${price}`,
    orderPriceFormattedUSD: `${price}`,
    orderProductPrice: `${price}`,
    orderProductPriceFormatted: `${price}`,
    orderProductPriceUSD: `${price}`,
    orderProductPriceFormattedUSD: `${price}`,
    shippingPrice: '0',
    shippingPriceFormatted: '$0',
    shippingPriceUSD: '0',
    shippingPriceFormattedUSD: '$0',
    ip: '193.19.109.60',
    productName: 'Dr Goodrow Mini Home Garden',
    productDescription: '',
    orderType: 'Regular Order',
    campaignName: 'Dr Goodrow Mini EN UP (GetMhamo 49 UP)',
    sku: '30615_3',
    customerEmail: 'sangnht3005@yahoo.com',
    firstName: shippingAddress?.name?.firstName,
    middleName: '',
    lastName: shippingAddress?.name?.lastName,
    addressId: '10974605',
    orderBehaviorId: '2',
    orderBehaviorName: 'Test Order',
    shippingAddress: {
      firstName: shippingAddress?.name?.firstName,
      middleName: '',
      lastName: shippingAddress?.name?.lastName,
      address1: shippingAddress?.address?.addressLine1,
      address2: shippingAddress?.address?.addressLine2,
      city: shippingAddress?.address?.adminArea2,
      state: shippingAddress?.address?.adminArea1,
      countryCode: shippingAddress?.address?.countryCode,
      countryName: 'United States of America',
      zipCode: shippingAddress?.address?.postalCode,
      phoneNumber: shippingAddress?.phoneNumber?.nationalNumber.replace('-', ''),
      isVerified: '',
      suggestion: ''
    },
    billingAddress: {
      firstName: shippingAddress?.name?.firstName,
      middleName: '',
      lastName: shippingAddress?.name?.lastName,
      address1: shippingAddress?.address?.addressLine1,
      address2: shippingAddress?.address?.addressLine2,
      city: shippingAddress?.address?.adminArea2,
      state: shippingAddress?.address?.adminArea1,
      countryCode: shippingAddress?.address?.countryCode,
      countryName: 'United States of America',
      zipCode: shippingAddress?.address?.postalCode,
      phoneNumber: shippingAddress?.phoneNumber?.nationalNumber.replace('-', ''),
      isVerified: '',
      suggestion: ''
    },
    receipts: [
      {
        transactionId: 'D2030B14-3EF7-4D0B-928C-6B697DAAF70E',
        paymentStatus: 'Paid',
        paymentDescription: 'Product',
        paymentNumber: '2421144891',
        currencyCode: 'USD',
        amount: `${price}`,
        formattedAmount: `$${price}`,
        midDescriptor: 'TestDescriptor'
      }
    ],
    orderTaxes: '',
    productImageUrls: '',
    relatedOrders: []
  }
  const resTransaction = await Transactions.Create(transaction)
  
  // save log
  const resFastlane = rsCreate._id && await Fastlane.Update(rsCreate._id, {
    fastlaneData: req.body,
    refId: refId || null,
    apiData: {
      requestData: {
        url,
        headers,
        payload
      },
      responseData: result.data
    },
    siteData: {}
  })

  if (resFastlane && resTransaction) {
    res.status(result.status).json({
      success: true,
      data: result.data,
      orderInfo: resTransaction,
      message: null
    })
  } else {
    res.status(500).json({
      success: false,
      data: null,
      message: null
    })
  }
})

PPCP_Api.get('/relatedorders/:orderNumber', async (request: Request, response: Response) => {
  try {
    const orderNumber: string = request.params.orderNumber

    // orderNumber is null or empty
    if (!orderNumber && orderNumber === '') {
      response.status(500).json({
        success: false,
        data: null,
        message: null
      })
    }

    // const mainOrder = await Transaction.Get(orderNumber)
    // const upsells = await Transaction.GetRefTransaction(orderNumber)

    // const result = {
    //   ...mainOrder,
    //   relatedOrders: [...upsells]
    // }
    Transactions.Get(orderNumber)
      .then((rs: any) => {
        response.status(200).json({
          ...rs.main,
          relatedorder: rs.upsells
        })
      })
      .catch(e => {
        response.status(500).json({
          success: false,
          data: e,
          message: null
        })
      })
    
  } catch (e) {
    response.status(500).json({
      success: false,
      data: e,
      message: null
    })
  }

})

PPCP_Api.get('/:orderNumber/relatedorders', async (request: Request, response: Response) => {
  try {
    const orderNumber: string = request.params.orderNumber

    // orderNumber is null or empty
    if (!orderNumber && orderNumber === '') {
      response.status(500).json({
        success: false,
        data: null,
        message: null
      })
    }

    // const mainOrder = await Transaction.Get(orderNumber)
    // const upsells = await Transaction.GetRefTransaction(orderNumber)

    // const result = {
    //   ...mainOrder,
    //   relatedOrders: [...upsells]
    // }
    Transactions.Get(orderNumber)
      .then((rs: any) => {
        response.status(200).json({
          ...rs.main,
          relatedorder: rs.upsells
        })
      })
      .catch(e => {
        response.status(500).json({
          success: false,
          data: e,
          message: null
        })
      })
    
  } catch (e) {
    response.status(500).json({
      success: false,
      data: e,
      message: null
    })
  }

})
export default PPCP_Api