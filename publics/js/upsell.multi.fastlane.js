const PaypalSdk = {
  getClientId: () => {
    return "ARdFH6JLgvNUCjpOfDFu37UI8IOzJtomuRB8otTYITxF56AuNfHYGb3uX1fvpqNneZjcSVjzTq1rYpWY";
  },
  getPaypalSDK: () => {
    const URL_SDK = new URL("https://www.paypal.com/sdk/js");
    const PARAMS_SDK = new URLSearchParams({
      "client-id": PaypalSdk.getClientId(),
      components: "buttons,fastlane",
      "enable-funding": "venmo",
    });
    URL_SDK.search = PARAMS_SDK.toString();
    return URL_SDK.toString();
  },
  getClientToken: async () => {
    const URL = "https://paypal-fastlane-sample.onrender.com/api/v1/ppcp/client-token";
    const result = await fetch(URL).then((res) => res.json());
    return result.data || "";
  },
  initPaypalSdk: async () => {
    console.log("========= init paypal sdk");
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.setAttribute(
      "data-sdk-client-token",
      await PaypalSdk.getClientToken()
    );
    script.src = await PaypalSdk.getPaypalSDK();
    script.onload = () => {
      CheckoutFastLane();
    };
    document.head.appendChild(script);
  },
};

const CheckoutFastLane = async () => {
  const { paypal, ctrwowUtils } = window;
  if (!paypal?.Fastlane) {
    throw new Error("Paypal script loaded but no Fastlane module.");
  }
  const FastlaneElements = {
    arrElmFastlaneSB: document.querySelectorAll(".js-btn-place-upsell-order"),
    paymentInfo: ".fastlane-payment-info",
  }
  const {
    identity,
    profile,
    FastlanePaymentComponent,
    FastlaneWatermarkComponent,
  } = await paypal.Fastlane({
    shippingAddressOptions: {
      allowedLocations: [],
    },
    cardOptions: {
      allowedBrands: [],
    },
  })
  let _shippingAddress = {}
  
  const paymentComponent = await FastlanePaymentComponent()

  const init = () => {
    const paymentMethod = localStorage.getItem("payment-method")
    if (paymentMethod === "fastlane") {
      verfifytEmail()
    }
  };

  const verifyEmail = async () => {
    const email = localStorage.getItem("customer_email");
    const fastlaneInfo = localStorage.getItem("fastlane")
      ? JSON.parse(localStorage.getItem("fastlane"))
      : null;
    if (email !== "") {
      const { customerContextId } = await identity.lookupCustomerByEmail(email);
      if (customerContextId) {
        const authResponse = await identity.triggerAuthenticationFlow(
          customerContextId,
          {
            shippingAddress: {
              name: fastlaneInfo.shippingAddress.name.fullName,
              addressLine1: fastlaneInfo.shippingAddress.address.addressLine1,
              addressLine1: fastlaneInfo.shippingAddress.address.addressLine2,
              state: fastlaneInfo.shippingAddress.address.adminArea2,
              city: fastlaneInfo.shippingAddress.address.adminArea1,
              postalCode: fastlaneInfo.shippingAddress.address.postalCode,
              countryCode: fastlaneInfo.shippingAddress.address.countryCode,
              phone: `${fastlaneInfo.shippingAddress.phoneNumber.countryCode}${fastlaneInfo.shippingAddress.phoneNumber.nationalNumber}`
            },
            paymentToken: fastlaneInfo.paymentToken.id
          }
        )

        console.log(authResponse)
        if (authResponse?.authenticationState === "succeeded") {
          const { shippingAddress, card: paymentToken } =
            authResponse.profileData
          _shippingAddress = shippingAddress
          renderPaymentInfo()
          placeUpsellOrder()
        } else {
          window.location = "decline.html"
        }
      }
    } else {
      window.location = "decline.html"
    }
  };

  const renderPaymentInfo = () => {
    Array.prototype.slice
      .call(FastlaneElements.arrElmFastlaneSB)
      .forEach(async (item, index) => {
        paymentComponent.render(`.fastlane-payment-info-${index}`);
      });
  };

  const placeUpsellOrder = async () => {
    FastlaneElements.arrElmFastlaneSB &&
      Array.prototype.slice
        .call(FastlaneElements.arrElmFastlaneSB)
        .forEach((item) => {
          item.addEventListener("click", async (e) => {
            e.preventDefault();
            ctrwowUtils.showGlobalLoading();
            verifyEmail()
            const URL = "https://paypal-fastlane-sample.onrender.com/api/v1/ppcp/create-order";
            const headers = new Headers();
            const payload = {
              paymentToken: await paymentComponent.getPaymentToken(),
              shippingAddress: _shippingAddress,
              price:
                ctrwowUpsell?.productListData?.getProductList()?.prices[
                  upsell_productindex
                ].productPrices?.DiscountedPrice?.Value || 0,
            };
            headers.append("Content-Type", "application/json");
            const requestOptions = {
              headers: headers,
              method: "POST",
              body: JSON.stringify(payload),
            };
            fetch(URL, requestOptions)
              .then((result) => result.json())
              .then((rs) => {
                debugger;
                // handle next step
                if (rs.data.status.toString() === "COMPLETED") {
                  window.location = "confirm.html";
                } else {
                  window.location = "decline.html";
                }
              })
              .catch((err) => console.log(err));
          });
        });
  };

  init();
};

window.addEventListener("DOMContentLoaded", () => {
  PaypalSdk.initPaypalSdk();
});
