import express, { ErrorRequestHandler, Request, Response } from "express"
import bodyParser from "body-parser"
import * as utils from "./../../common/utils/helpers"
import axios from "axios"
import { getAccessToken } from "../../common/utils/paypal_helpers"
import Transactions from "../../models/Transaction/Transaction.mongoose"
import Fastlane from "../../models/Fastlane/Fastlane.mongoose"
import { ITransaction } from "../../models/Transaction/Transaction.yup"

const wowpayApi = express.Router()
wowpayApi.use(bodyParser.json())
wowpayApi.use(bodyParser.urlencoded({ extended: true }))

wowpayApi.get("/campaigns/:webkey/:paymentProcessor/mid", async(request: Request, response: Response) => {
  try {
    const URL = `${utils.getPaypalBaseEndpoint()}/v1/oauth2/token`
    const AUTHORIZATION = Buffer.from(
      utils.getPaypalClientID() + ":" + utils.getPaypalSecretKey(),
    ).toString("base64")
    const HEADERS = {
      Authorization: `Basic ${AUTHORIZATION}`
    }
    const URL_ENCODE = new URLSearchParams()
    URL_ENCODE.append("grant_type", "client_credentials")
    URL_ENCODE.append("response_type", "client_token")
    URL_ENCODE.append("intent", "sdk_init")
    URL_ENCODE.append("domains[]", "storage.googleapis.com")

    const result: {
      data: any,
      message: string,
      status: number
    } = await axios.post(URL, URL_ENCODE, { headers: HEADERS})

    if (result.status === 200) {
      response.status(result.status).json({
        clientId: utils.getPaypalClientID(),
        clientToken: result.data.access_token
      })
    } else {
      response.status(400).json(result.message)
    }
  } catch(err) {
    response.status(500).json(err)
  }
})

wowpayApi.post("/orders/:webkey", getAccessToken, async (request: Request, response: Response) => {
  const {
    productName, // setValue temp
    productPrice, // setValue temp
    campaignUpsell,
    couponCode,
    shippingMethodId,
    comment,
    useShippingAddressForBilling,
    productId,
    customer,
    payment,
    shippingAddress,
    billingAddress,
    funnelBoxId
  } = request.body
  const TRANSATIONID = Date.now().toString()

  const PAYPAL__URL = `https://api-m.sandbox.paypal.com/v2/checkout/orders`
  const PAYPAL__HEADERS = {
    ...request.headers,
    "Content-Type": "application/json",
    "PayPal-Request-Id": TRANSATIONID
  }
  const PAYPAL__PAYLOAD = {
    "intent": "CAPTURE",
    "payment_source": {
      "card": {
        "single_use_token": payment.paymentToken,
        "attributes": {
          "vault": {
              "store_in_vault": "ON_SUCCESS"
          }
        }
      }
    },
    "purchase_units": [
      {
        "reference_id": `${TRANSATIONID}`,
        "amount": {
          "currency_code": "USD",
          "value": productPrice
        },
        "shipping": {
          "type": "SHIPPING",
          "name": {
            "full_name": `${customer.firstName} ${customer.lastName}`
          },
          "address": {
            "address_line_1": shippingAddress.address1,
            "address_line_2": shippingAddress.address2,
            "admin_area_1": shippingAddress.state,
            "admin_area_2": shippingAddress.city,
            "postal_code": shippingAddress.zipCode,
            "country_code": shippingAddress.countryCode
          },
          "phone_number": {
            "country_code": "1",
            "national_number": shippingAddress.phoneNumber.replace(/-/g, "").replace(/()/g, "")
          }
        }
      }
    ] 
  }

  // Save log Paypal information
  const rsCreate = await Fastlane.Create({
    PAYPAL: {
      payload: {
        url: PAYPAL__URL,
        headers: PAYPAL__HEADERS,
        payload: PAYPAL__PAYLOAD
      },
      response: {}
    }
  })

  const result = await axios.post(PAYPAL__URL, PAYPAL__PAYLOAD, { headers: PAYPAL__HEADERS })

  // Defined and Create Transaction
  const transaction: ITransaction = {
    paymentToken: result?.data.payment_source?.card?.attributes?.vault?.id,
    refOrderNumber: campaignUpsell ? '' : campaignUpsell.relatedOrderNumber,
    orderNumber: `${TRANSATIONID}`,
    orderStatus: 'Paid',
    languageCode: 'EN',
    currencyCode: 'USD',
    currencySign: 'US$',
    orderPrice: productPrice,
    orderPriceFormatted: `$${productPrice.toFixed(2)}`,
    orderPriceUSD: `${productPrice.toFixed(2)}`,
    orderPriceFormattedUSD: `${productPrice.toFixed(2)}`,
    orderProductPrice: `${productPrice.toFixed(2)}`,
    orderProductPriceFormatted: `${productPrice.toFixed(2)}`,
    orderProductPriceUSD: `${productPrice.toFixed(2)}`,
    orderProductPriceFormattedUSD: `${productPrice.toFixed(2)}`,
    shippingPrice: '0',
    shippingPriceFormatted: '$0.00',
    shippingPriceUSD: '0.00',
    shippingPriceFormattedUSD: '$0.00',
    ip: '193.19.109.60',
    productName,
    productDescription: '',
    orderType: 'Regular Order',
    campaignName: 'campaignName',
    sku: 'SKU',
    customerEmail: customer.email,
    firstName: shippingAddress?.name?.firstName,
    middleName: '',
    lastName: shippingAddress?.name?.lastName,
    addressId: '123456',
    orderBehaviorId: '2',
    orderBehaviorName: 'Test Order',
    shippingAddress: {
      firstName: shippingAddress.firstName,
      middleName: '',
      lastName: shippingAddress.lastName,
      address1: shippingAddress.address1,
      address2: shippingAddress.address2,
      city: shippingAddress.city,
      state: shippingAddress.state,
      countryCode: shippingAddress.countryCode,
      countryName: 'United States of America',
      zipCode: shippingAddress.zipCode,
      phoneNumber: shippingAddress.phoneNumber.replace(/-/g, "").replace(/()/g, ""),
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
        amount: `${productPrice}`,
        formattedAmount: `$${productPrice}`,
        midDescriptor: 'TestDescriptor'
      }
    ],
    orderTaxes: '',
    productImageUrls: '',
    relatedOrders: []
  }
  const resTransaction = await Transactions.Create(transaction)

  // Update log Paypal information
  const rsUpdate = rsCreate._id && await Fastlane.Update(rsCreate._id, {
    PAYPAL: {
      payload: {
        url: PAYPAL__URL,
        headers: PAYPAL__HEADERS,
        payload: PAYPAL__PAYLOAD
      },
      response: result
    }
  })

  if (rsUpdate && resTransaction) {
    response.status(result.status).json({
      success: true,
      data: result.data,
      orderInfo: resTransaction,
      message: null
    })
  } else {
    response.status(500).json({
      success: false,
      data: null,
      message: null
    })
  }
})

wowpayApi.get("/orders/:orderNumber/relatedorders", (request: Request, response: Response) => {
  try {
    const orderNumber: string = request.params.orderNumber

    if (!orderNumber && orderNumber === '') {
      response.status(400).json({
        message: "The orderNumber is null or empty."
      })
    }
    
    Transactions.Get(orderNumber)
      .then((rs: any) => {
        response.status(200).json({
          ...rs.main,
          relatedOrders: rs.upsells
        })
      })
      .catch(e => {
        response.status(500).json({
          success: false,
          data: e,
          message: null
        })
      })
    
  } catch (err) {
    response.status(500).json(err)
  }
})

export default wowpayApi