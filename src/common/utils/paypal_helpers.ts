import axios from 'axios'
import * as utils from './helpers'
import { AnyObject } from 'mongoose'
import { NextFunction, Request, Response } from 'express'

const getPaypalSDK = () => {
  const SDK_URL = new URL(`https://www.paypal.com/sdk/js`)
  const SDK_PARAMS = new URLSearchParams({
    'client-id': utils.getPaypalClientID(),
    components: 'buttons,fastlane'
  })
  SDK_URL.search = SDK_PARAMS.toString()
  return SDK_URL.toString()
}

const getClientToken = async () => {
  const URL = 'http://localhost:3005/api/v1/ppcp/client-token'
  const result: any = await axios.get(URL)
  if (result && result.status === 200) {
    return result.data.data.toString()
  } else {
    return null
  }
}

export const initFastLane = async () => {
  const SDK_URL = await getPaypalSDK()
  const clientToken = await getClientToken()

  return {
    prerequisiteScriptURL: SDK_URL,
    prerequisiteScriptClientToken: clientToken, 
    initScriptPath: 'app.js'
  }
}

export const getAccessToken = async(request: Request, response: Response, next: NextFunction) => {
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
    request.headers = {
      Authorization: `Bearer ${result.data.access_token}`
    }
    next()
  } else {
    response.status(400).json({
      success: false,
      data: null,
      message: result.message
    })
  }
}