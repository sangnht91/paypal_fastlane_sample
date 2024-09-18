const link = {
  getParams: (param) => {
    const _url = new URL(window.location.href)
    const queryString  = _url.search
    const urlParams = new URLSearchParams(queryString)
    return urlParams.get(param) || null
  }
}

const UpsellFastLane = async () => {
  const { ctrwowUtils } = window
  
  const FastlaneElements = {
    waterMark: ".watermark-container",
    arrElmFastlaneSB: document.querySelectorAll(".js-btn-place-upsell-order"),
    paymentInfo: ".fastlane-payment-info",
  }
  
  const init = () => {
    const paymentMethod = localStorage.getItem("payment-method");
    if (paymentMethod === "fastlane") {
      placeUpsellOrder()
    }
  }

  const placeUpsellOrder = async () => {
    FastlaneElements.arrElmFastlaneSB &&
      Array.prototype.slice
        .call(FastlaneElements.arrElmFastlaneSB)
        .forEach((item) => {
          item.addEventListener("click", async (e) => {
            e.preventDefault()
            ctrwowUtils.showGlobalLoading();
            const orderInfo = JSON.parse(localStorage.getItem("orderInfo"))
            const URL = `${link.getParams("isTest") === '1' ? 'http://localhost:3000' : 'https://paypal-fastlane-sample.onrender.com'}/api/orders/webkey`
            const headers = new Headers();
            const payload = {
              productName: "",
              productPrice: 29.99,
              campaignUpsell: {
                webKey: "webkey",
                relatedOrderNumber: orderInfo.orderNumber
              },
              shippingMethodId: 123,
              comment: "",
              useShippingAddressForBilling: true,
              productId: 1,
              customer: {
                email: orderInfo.cusEmail
              },
              payment: {
                paymentToken: orderInfo.cardId,
                callBackParam: ""
              },
              shippingAddress: null,
              funnelBoxId: 0,
              antiFraud: {
                sessionId: ""
              }
            }
            headers.append("Content-Type", "application/json")
            const requestOptions = {
              headers: headers,
              method: "POST",
              body: JSON.stringify(payload),
            }
            fetch(URL, requestOptions)
              .then((result) => result.json())
              .then((rs) => {
                // handle next step 
                if (rs.data.status.toString() === "COMPLETED") {
                  const orderInfo = JSON.parse(localStorage.getItem("orderInfo"))
                  const __orderInfo = {
                    ...orderInfo,
                    upsellIndex: 1
                  }
                  localStorage.setItem("orderInfo", JSON.stringify(__orderInfo))
                  ctrwowUtils.link.redirectPage("confirm-fastlane.html")
                } else {
                  ctrwowUtils.link.redirectPage("decline.html")
                }
              })
              .catch((err) => console.log(err));
          })
        })
  }

  init()
}

window.addEventListener("DOMContentLoaded", () => {
  UpsellFastLane()
})
