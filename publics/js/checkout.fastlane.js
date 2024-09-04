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
    const URL = 'https://paypal-fastlane-sample.onrender.com/api/v1/ppcp/client-token'
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
            handleCreditCard(false)
            handleCheckoutWithCreditCard()
          }
        } else {
          console.log('No customerContextId')
          ctrwowUtils.hideGlobalLoading()
        }
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

      const URL = "https://paypal-fastlane-sample.onrender.com/api/v1/ppcp/create-order"
      const headers = new Headers()
      headers.append("Content-Type", "application/json")
      _paymentToken = await paymentComponent.getPaymentToken();
      
      console.log(`shippingAddress: ${JSON.stringify(_shippingAddress)} - paymentToken: ${JSON.stringify(_paymentToken)}`)
      localStorage.setItem("fastlane", JSON.stringify({ shippingAddress: _shippingAddress, paymentToken: _paymentToken}))
      localStorage.setItem("customerContextId", _customerContextId)
      
      const payload = {
        paymentToken: _paymentToken,
        shippingAddress: _shippingAddress,
        price: ctrwowCheckout?.checkoutData?.getProduct()?.productPrices?.DiscountedPrice?.Value || 0
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
            window.location = "special-offer-product1.html"
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