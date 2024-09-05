const link = {
  getParams: (param) => {
    const _url = new URL(window.location.href)
    const queryString  = _url.search
    const urlParams = new URLSearchParams(queryString)
    return urlParams.get(param) || null
  }
}

const PaypalSdk = {
  getClientId: () => {
    return 'ARdFH6JLgvNUCjpOfDFu37UI8IOzJtomuRB8otTYITxF56AuNfHYGb3uX1fvpqNneZjcSVjzTq1rYpWY'
  },
  getPaypalSDK: () => {
    const URL_SDK = new URL('https://www.paypal.com/sdk/js')
    const PARAMS_SDK = new URLSearchParams({
     'client-id': PaypalSdk.getClientId(),
     'components': 'buttons,fastlane',
     'enable-funding': 'venmo'
    })
    URL_SDK.search = PARAMS_SDK.toString()
    return URL_SDK.toString()
  },
  getClientToken: async() => {
    const URL = `${link.getParams("isTest") === '1' ? 'http://localhost:3000' : 'https://paypal-fastlane-sample.onrender.com'}/api/v1/ppcp/client-token`
    const result = await fetch(URL).then(res => res.json())
    return result.data || ''
  },
  initPaypalSdk: async() => {
    console.log("========= init paypal sdk")
    var script = document.createElement('script')
    script.type = 'text/javascript'
    script.setAttribute('data-sdk-client-token', await PaypalSdk.getClientToken())
    script.src = await PaypalSdk.getPaypalSDK()
    script.onload = () => {
      CheckoutFastLane()
    }
    document.head.appendChild(script)
  }
}

const CheckoutFastLane = async () => {
  const { paypal, ctrwowUtils } = window
  if (!paypal?.Fastlane) {
    throw new Error("Paypal script loaded but no Fastlane module.")
  }
  const FastlaneElements = {
    waterMark: '#watermark-container',
    elmInputEmail: document.querySelector("input[name=email]"),
    shippingForm: {
      addressLine1: document.querySelector('input[name=address1]'),
      addressLine2: document.querySelector('input[name=address2]'),
      adminArea2: document.querySelector('input[name=city]'),
      countryCode: document.querySelector('select[name=countryCode]'),
      adminArea1: document.querySelector('select[name=state]'),
      postalCode: document.querySelector('input[name=zipCode]'),
    },
    customerForm: {
      name: {
        firstName: document.querySelector('input[name=firstName]'),
        lastName: document.querySelector('input[name=lastName]'),
      },
      phoneNumber: {
        nationalNumber: document.querySelector('input[name=phoneNumber]')
      }
    },
    elmButtonEditShippingAddress: document.querySelector('#fastlane-shipping-edit-button'),
    paymentInfo: '#fastlane-payment-info',
    elmFormPayment: document.querySelector('form[name=payment]'),
    elmFastlaneSB: document.querySelector('#fastlane-button')
  }
  const {
    identity,
    profile,
    FastlanePaymentComponent,
    FastlaneWatermarkComponent
  } = await paypal.Fastlane({
    shippingAddressOptions: {
      allowedLocations: [],
    },
    cardOptions: {
      allowedBrands: [],
    },
  })
  let _shippingAddress,
  _memberAuthenticatedSuccessfully,
  _paymentToken,
  _customerContextId

  const paymentComponent = await FastlanePaymentComponent()

  const init = () => {
    renderWatermark()
    verifyEmail()
  }

  const renderWatermark = async () => {
    if (FastlaneElements.elmInputEmail) {
      const elementWatermark = `<div id="watermark-container" style="margin-top: 10px; display: flex; align-items: center; justify-content: end;"></div>`
      FastlaneElements.elmInputEmail.insertAdjacentHTML("afterend", elementWatermark)

      const waterMark = await FastlaneWatermarkComponent({
        includeAdditionalInfo: true
      })
      waterMark.render(FastlaneElements.waterMark)
    }
  }

  const verifyEmail = async () => {
    FastlaneElements.elmInputEmail && FastlaneElements.elmInputEmail.addEventListener('blur', async(e) => {
      ctrwowUtils.showGlobalLoading()
      
      _memberAuthenticatedSuccessfully = undefined
      _shippingAddress = undefined
      _paymentToken = undefined

      if (e.currentTarget.value !== '') {
        const { customerContextId } = await identity.lookupCustomerByEmail(FastlaneElements.elmInputEmail.value)
        console.log(`customerContextId: ${customerContextId}`)
        if (customerContextId) {
          _customerContextId = customerContextId
          const authResponse = await identity.triggerAuthenticationFlow(customerContextId)

          if (authResponse?.authenticationState === 'succeeded') {
            _memberAuthenticatedSuccessfully = true
            _shippingAddress = authResponse.profileData.shippingAddress
            _paymentToken = authResponse.profileData.card

            bindShippingAddress(_shippingAddress)
            editShippingAddress()
          }
        } else {
          console.log('No customerContextId')
          ctrwowUtils.hideGlobalLoading()
        }

        handleCreditCard(false)
        handleCheckoutWithCreditCard()
        renderPaymentInfo()
        placeOrder()
      } else {
        ctrwowUtils.hideGlobalLoading()
      }
    })
  }

  const handleCreditCard = (flag) => {
    const btnCheckoutWithCreditCardV1 = document.querySelector('.checkoutWithCreditCardV1')
    const btnCheckoutWithCreditCardV1SB = document.querySelector('button[name=checkoutWithCreditCardV1]')
    const btnCheckoutWithFastlane = document.querySelector('.btnCheckoutWithFastlane')
    const btnCheckoutWithFastlaneSB= document.querySelector('#fastlane-button')
    const creditcardForm = document.querySelector("form[name=payment]")
    const fastlanePaymentInfo = document.querySelector(FastlaneElements.paymentInfo)
    if (btnCheckoutWithCreditCardV1 && btnCheckoutWithCreditCardV1SB) {
      if (!flag) {
        btnCheckoutWithCreditCardV1.style.display = "block"
        btnCheckoutWithCreditCardV1SB.style.display = "none"
        btnCheckoutWithFastlane.style.display = "none"
        btnCheckoutWithFastlaneSB.style.display = "block"
        creditcardForm.style.display = "none"
        fastlanePaymentInfo.style.display = "block"
      } else {
        btnCheckoutWithCreditCardV1.style.display = "none"
        btnCheckoutWithCreditCardV1SB.style.display = "block"
        btnCheckoutWithFastlane.style.display = "block"
        btnCheckoutWithFastlaneSB.style.display = "none"
        creditcardForm.style.display = "block"
        fastlanePaymentInfo.style.display = "none"
      }
    }
  }

  const handleCheckoutWithCreditCard = () => {
    const btnCheckoutWithCreditCardV1 = document.querySelector('.checkoutWithCreditCardV1')
    btnCheckoutWithCreditCardV1 && btnCheckoutWithCreditCardV1.addEventListener('click', () => {
      handleCreditCard(true)
    })
    const btnCheckoutWithFastlane = document.querySelector('.btnCheckoutWithFastlane')
    btnCheckoutWithFastlane && btnCheckoutWithFastlane.addEventListener('click', () => {
      handleCreditCard(false)
    })
  }

  const bindShippingAddress = (shippingAddress) => {
    Object.keys(FastlaneElements.customerForm).forEach(item => {
      Object.keys(FastlaneElements.customerForm[item]).forEach(key => {
        FastlaneElements.customerForm[item][key].nextElementSibling.setAttribute('style', 'top: 5px; font-size: 0.8rem')
        FastlaneElements.customerForm[item][key].value = shippingAddress[item][key] || ''
      })
    })
    Object.keys(FastlaneElements.shippingForm).forEach(key => {
      if (key === 'adminArea1') {
        const event = new Event('change');
        FastlaneElements.shippingForm['countryCode'].dispatchEvent(event);
        setTimeout(() => {
          FastlaneElements.shippingForm[key].nextElementSibling.setAttribute('style', 'top: 5px; font-size: 0.8rem')
          FastlaneElements.shippingForm[key].value = shippingAddress.address[key]
        }, 800)
      } else if (shippingAddress.address[key]) {
        FastlaneElements.shippingForm[key].nextElementSibling.setAttribute('style', 'top: 5px; font-size: 0.8rem')
        FastlaneElements.shippingForm[key].value = shippingAddress.address[key]
      }
    })
    ctrwowUtils.hideGlobalLoading()
  }
  
  const editShippingAddress = () => {
    FastlaneElements.elmButtonEditShippingAddress && FastlaneElements.elmButtonEditShippingAddress.addEventListener('click', async () => {
      if (_memberAuthenticatedSuccessfully) {
        const { selectionChanged, selectedAddress } = await profile.showShippingAddressSelector()
        if (selectionChanged) {
          paymentComponent.setShippingAddress(selectedAddress)
          _shippingAddress = selectedAddress
          bindShippingAddress(_shippingAddress)
        }
      }
    })
  }

  const getShippingAddress = () => {
    return {
      address: {
        addressLine1: FastlaneElements.shippingForm.addressLine1.value,
        addressLine2: FastlaneElements.shippingForm.addressLine2.value,
        adminArea2: FastlaneElements.shippingForm.adminArea2.value,
        adminArea1: FastlaneElements.shippingForm.adminArea1.value,
        postalCode: FastlaneElements.shippingForm.postalCode.value,
        countryCode: FastlaneElements.shippingForm.countryCode.value
      },
      name: {
        firstName: FastlaneElements.customerForm.name.firstName.value,
        lastName: FastlaneElements.customerForm.name.lastName.value,
        fullName: [FastlaneElements.customerForm.name.firstName.value, FastlaneElements.customerForm.name.lastName.value]
          .filter((field) => !!field)
          .join(' '),
      },
      phoneNumber: {
        countryCode: '1',
        nationalNumber: FastlaneElements.customerForm.phoneNumber.nationalNumber.value,
      }
    }
  }

  const renderPaymentInfo = () => {
    paymentComponent.render(FastlaneElements.paymentInfo)
    // hidden payment form and creditcard submit button
    FastlaneElements.elmFormPayment && (FastlaneElements.elmFormPayment.style.display = 'none')
  }

  const placeOrder = () => {
    FastlaneElements.elmFastlaneSB && FastlaneElements.elmFastlaneSB.addEventListener('click', async() => {
      ctrwowUtils.showGlobalLoading()

      if (!_memberAuthenticatedSuccessfully) {
        _shippingAddress = getShippingAddress()
        paymentComponent.setShippingAddress(_shippingAddress)
      }

      const URL = `${link.getParams("isTest") === '1' ? 'http://localhost:3000' : 'https://paypal-fastlane-sample.onrender.com'}/api/v1/ppcp/create-order`
      const headers = new Headers()
      headers.append("Content-Type", "application/json")
      _paymentToken = await paymentComponent.getPaymentToken();
      
      console.log(`shippingAddress: ${JSON.stringify(_shippingAddress)} - paymentToken: ${JSON.stringify(_paymentToken)}`)
      localStorage.setItem("fastlane", JSON.stringify({ shippingAddress: _shippingAddress, paymentToken: _paymentToken}))
      localStorage.setItem("customerContextId", _customerContextId)
      
      const payload = {
        paymentToken: _paymentToken,
        shippingAddress: _shippingAddress,
        price: ctrwowCheckout?.checkoutData?.getProduct()?.productPrices?.DiscountedPrice?.Value || 0,
        checkout: true,
        refId: "",
        email: FastlaneElements.elmInputEmail.value
      }
      const requestOptions = {
        headers: headers,
        method: "POST",
        body: JSON.stringify(payload)
      };
      fetch(URL, requestOptions)
        .then(result => result.json())
        .then(rs => {
          // handle next step
          localStorage.setItem("payment-method", "fastlane")
          if (rs.data.status.toString() === 'COMPLETED') {
            const { orderInfo } = rs
            localStorage.setItem("refId", rs.orderInfo.orderNumber)
            const __orderInfo = {
              "orderParams": "",
              "upsells": [
                  {
                      "id": 0,
                      "linkedCampaignName": "(WIDGET) (MULTI-BANK) Mini Delayed EN UP (MyRangeXTD 49 EN)",
                      "linkedCampaignId": 9332,
                      "upsellUrl": "https://www.myrangextd.com/en/upsell-2-multi-bank.html",
                      "index": 1
                  }
              ],
              "upsellUrls": [
                {
                  "index": 1,
                  "price": 24.99,
                  "campaignWebKey": "8D9D0A8F-157E-4A8B-9FB4-51FB84F8C30F",
                  "campaignName": "(WIDGET) (MULTI-BANK) Mini Delayed EN UP (MyRangeXTD 49 EN)",
                  "orderNumber": "2421145985",
                  "customerId": 13259646,
                  "url": "https://storage.googleapis.com/ctrwowteststorage/sangnht/upsell-1-multi-bank.html?ctr_tracking__click_id=76fd5961-bf65-4ccd-bc51-eb4ff8697681&ctr_tracking__original_click_id=76fd5961-bf65-4ccd-bc51-eb4ff8697681&ctr_cssid=a10f8195a4de4967888e49f2a5a442cb&ctr_ppid=66d7a30015f06510c8b1d998&ctr_psid=5fa22d1e835ba6183c5abb39&ctr_ppu=https%3A%2F%2Fstorage.googleapis.com%2Fctrwowteststorage%2Fsangnht%2Forder-pp-fastlane.html&ctr_io=2&clickid=btncancel",
                  "orderedProducts": [
                      {
                          "sku": "30251",
                          "pid": 1322,
                          "name": "RangeXTD Router",
                          "quantity": 1
                      }
                  ]
                }
              ],
              "upsellIndex": 0,
              "campaignName": "(WIDGET) (MULTI-BANK) MyRangeXTD EN (AOV 49) (TrifiBoostUpg)",
              "campaignWebKey": "D3F04E92-A406-4DE6-BF43-12E1651F61DE",
              "orderNumber": orderInfo.orderNumber,
              "cusEmail": orderInfo.customerEmail,
              "cardId": "f74785ec-006d-49a3-96c4-f5e352082ad8",
              "paymentProcessorId": 0,
              "addressId": 10974605,
              "customerId": 13259646,
              "orderTotal": orderInfo.orderPriceUSD,
              "formattedNumber": orderInfo.orderPriceFormatted,
              "orderTotalFull": orderInfo.orderPriceUSD,
              "totalPriceMiniUpsell": 0,
              "savedTotal": 0,
              "quantity": 1,
              "orderedProducts": [
                  {
                      "sku": "30251_4a",
                      "pid": 2190,
                      "name": "RangeXTD Router 4"
                  }
              ],
              "useCreditCard": true,
              "activationCode": [],
              "cusPhone": orderInfo.shippingAddress.phoneNumber,
              "cusFirstName": orderInfo.firstName,
              "cusLastName": orderInfo.lastName,
              "cusCity": orderInfo.shippingAddress.city,
              "cusState": orderInfo.shippingAddress.state,
              "cusCountry": orderInfo.shippingAddress.countryCode,
              "cusZip": orderInfo.shippingAddress.zipCode
            }
            localStorage.setItem("orderInfo", JSON.stringify(__orderInfo))
            localStorage.setItem("user_firstname", orderInfo.firstName)
            localStorage.setItem("user_lastname", orderInfo.lastName)
            window.location = "upsell-1-multi-bank.html"
          } else {
            window.location = "decline.html"
          }
        })
        .catch(err => console.log(err))
    })
  }

  init()
}

window.addEventListener("DOMContentLoaded", () => {
  PaypalSdk.initPaypalSdk()
})