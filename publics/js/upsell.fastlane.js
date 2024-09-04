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
    waterMark: ".watermark-container",
    arrElmFastlaneSB: document.querySelectorAll(".js-btn-place-upsell-order"),
    paymentInfo: ".fastlane-payment-info",
  };
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
  });
  let _shippingAddress = {};
  
  const paymentComponent = await FastlanePaymentComponent();

  const init = () => {
    const paymentMethod = localStorage.getItem("payment-method");
    if (paymentMethod === "fastlane") {
      renderWatermark();
      verfifytEmail();
    }
  };

  const getAddressSummary = ({
    address: {
      addressLine1,
      addressLine2,
      adminArea2,
      adminArea1,
      postalCode,
      countryCode,
    } = {},
    name: { firstName, lastName, fullName } = {},
    phoneNumber: { countryCode: telCountryCode, nationalNumber } = {},
  }) => {
    const isNotEmpty = (field) => !!field;
    const summary = [
      fullName || [firstName, lastName].filter(isNotEmpty).join(" "),
      [addressLine1, addressLine2].filter(isNotEmpty).join(", "),
      [
        adminArea2,
        [adminArea1, postalCode].filter(isNotEmpty).join(" "),
        countryCode,
      ]
        .filter(isNotEmpty)
        .join(", "),
      [telCountryCode, nationalNumber].filter(isNotEmpty).join(""),
    ];
    return summary.filter(isNotEmpty).join("\n");
  };

  const renderShippingAddress = (address) => {
    Array.prototype.slice
      .call(FastlaneElements.arrElmFastlaneSB)
      .forEach(async (item, index) => {
        document.querySelector(
          `.fastlane-shipping-address-${index} .summary`
        ).innerText = getAddressSummary(address);
      });
  };

  const renderWatermark = () => {
    Array.prototype.slice
      .call(FastlaneElements.arrElmFastlaneSB)
      .forEach(async (item, index) => {
        const elementWatermark = `
        <div class="fastlane-shipping-address-${index}" style="margin-top: 10px; width: 100%; display: flex; justify-content: space-between;">
          <div class="summary"></div>
          <button class="fastlane-edit-shipping-address-${index}" style="background: transparent; border: 0;">Edit</button>
        </div>
        <div class="fastlane-payment-info-${index}" style="width: 100%; margin-top: 10px"></div>
        <div class="watermark-container-${index}" style="margin: 0px 0px 0px auto;"></div>`;
        // const elementWatermark = `
        //   <div class="watermark-container-${index}" style="margin: 0px 0px 0px auto;"></div>
        //   <div class="fastlane-payment-info-${index}" style="margin-top: 10px"></div>`
        item.insertAdjacentHTML("beforebegin", elementWatermark);

        const waterMark = await FastlaneWatermarkComponent();
        waterMark.render(`.watermark-container-${index}`);
      });
  };

  const editShippingAddress = () => {
    Array.prototype.slice
      .call(FastlaneElements.arrElmFastlaneSB)
      .forEach(async (item, index) => {
        const btnEditShippingAddress = document.querySelector(
          `button.fastlane-edit-shipping-address-${index}`
        );
        btnEditShippingAddress.addEventListener("click", async () => {
          const { selectionChanged, selectedAddress } =
            await profile.showShippingAddressSelector();
          if (selectionChanged) {
            paymentComponent.setShippingAddress(selectedAddress);
            renderShippingAddress(selectedAddress);
          }
        });
      });
    FastlaneElements.elmButtonEditShippingAddress &&
      FastlaneElements.elmButtonEditShippingAddress.addEventListener(
        "click",
        async () => {
          if (_memberAuthenticatedSuccessfully) {
            const { selectionChanged, selectedAddress } =
              await profile.showShippingAddressSelector();
            if (selectionChanged) {
              paymentComponent.setShippingAddress(selectedAddress);
              _shippingAddress = selectedAddress;
              bindShippingAddress(_shippingAddress);
            }
          }
        }
      );
  };

  const verfifytEmail = async () => {
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
            authResponse.profileData;
          _shippingAddress = shippingAddress;
          renderPaymentInfo();
          renderShippingAddress(shippingAddress);
          editShippingAddress();
          placeUpsellOrder(paymentToken);
        } else {
          // window.location = "decline.html"
        }
      }
    } else {
      // window.location = "decline.html"
    }
  };

  // const bindShippingAddress = (shippingAddress) => {
  //   Object.keys(FastlaneElements.customerForm).forEach(item => {
  //     Object.keys(FastlaneElements.customerForm[item]).forEach(key => {
  //       FastlaneElements.customerForm[item][key].nextElementSibling.setAttribute('style', 'top: 5px; font-size: 0.8rem')
  //       FastlaneElements.customerForm[item][key].value = shippingAddress[item][key] || ''
  //     })
  //   })
  //   Object.keys(FastlaneElements.shippingForm).forEach(key => {
  //     if (key === 'adminArea1') {
  //       const event = new Event('change');
  //       FastlaneElements.shippingForm['countryCode'].dispatchEvent(event);
  //       setTimeout(() => {
  //         FastlaneElements.shippingForm[key].nextElementSibling.setAttribute('style', 'top: 5px; font-size: 0.8rem')
  //         FastlaneElements.shippingForm[key].value = shippingAddress.address[key]
  //       }, 800)
  //     } else if (shippingAddress.address[key]) {
  //       FastlaneElements.shippingForm[key].nextElementSibling.setAttribute('style', 'top: 5px; font-size: 0.8rem')
  //       FastlaneElements.shippingForm[key].value = shippingAddress.address[key]
  //     }
  //   })
  //   ctrwowUtils.hideGlobalLoading()
  // }

  // const editShippingAddress = () => {
  //   FastlaneElements.elmButtonEditShippingAddress && FastlaneElements.elmButtonEditShippingAddress.addEventListener('click', async () => {
  //     const { selectionChanged, selectedAddress } = await profile.showShippingAddressSelector()
  //     if (selectionChanged) {
  //       paymentComponent.setShippingAddress(selectedAddress)
  //       shippingAddress = selectedAddress
  //       bindShippingAddress(shippingAddress)
  //     }
  //   })
  // }

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
            console.log(payload)
            ctrwowUtils.hideGlobalLoading()
            // headers.append("Content-Type", "application/json");
            // const requestOptions = {
            //   headers: headers,
            //   method: "POST",
            //   body: JSON.stringify(payload),
            // };
            // fetch(URL, requestOptions)
            //   .then((result) => result.json())
            //   .then((rs) => {
            //     debugger;
            //     // handle next step
            //     if (rs.data.status.toString() === "COMPLETED") {
            //       window.location = "confirm.html";
            //     } else {
            //       window.location = "decline.html";
            //     }
            //   })
            //   .catch((err) => console.log(err));
          });
        });
  };

  init();
};

window.addEventListener("DOMContentLoaded", () => {
  PaypalSdk.initPaypalSdk();
});
