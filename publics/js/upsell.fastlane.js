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
    const URL = `${link.getParams("isTest") === '1' ? 'http://localhost:3000' : 'https://paypal-fastlane-sample.onrender.com'}/api/v1/ppcp/client-token`
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
    ]
    return summary.filter(isNotEmpty).join("\n")
  }

  const renderShippingAddress = (address) => {
    Array.prototype.slice
      .call(FastlaneElements.arrElmFastlaneSB)
      .forEach(async (item, index) => {
        document.querySelector(
          `.fastlane-shipping-address-${index} .summary`
        ).innerText = getAddressSummary(address)
      })
  }

  const renderWatermark = () => {
    Array.prototype.slice
      .call(FastlaneElements.arrElmFastlaneSB)
      .forEach(async (item, index) => {
        const elementWatermark = `
        <div class="fastlane-shipping-address-${index}" style="display: none !important; margin-top: 10px; width: 100%; display: flex; justify-content: space-between;">
          <div class="summary"></div>
          <button class="fastlane-edit-shipping-address-${index}" style="background: transparent; border: 0;">Edit</button>
        </div>
        <div class="fastlane-payment-info-${index}" style="width: 100%; margin-top: 10px"></div>`
        item.insertAdjacentHTML("beforebegin", elementWatermark)

        const waterMark = await FastlaneWatermarkComponent()
        waterMark.render(`.watermark-container-${index}`)
      })
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
          // renderShippingAddress(shippingAddress);
          paymentComponent.setShippingAddress(shippingAddress)
          editShippingAddress();
          placeUpsellOrder(paymentToken);
        } else {
          window.location = "decline.html"
        }
      }
    } else {
      window.location = "decline.html"
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
            const URL = `${link.getParams("isTest") === '1' ? 'http://localhost:3000' : 'https://paypal-fastlane-sample.onrender.com'}/api/v1/ppcp/create-order`
            const headers = new Headers();
            const payload = {
              paymentToken: await paymentComponent.getPaymentToken(),
              shippingAddress: _shippingAddress,
              price:
                ctrwowUpsell?.productListData?.getProductList()?.prices[
                  upsell_productindex
                ].productPrices?.DiscountedPrice?.Value || 0,
              refId: localStorage.getItem("refId"),
              checkout: false
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
                // handle next step
                if (rs.data.status.toString() === "COMPLETED") {
                  const { orderInfo } = rs
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
                    "upsellIndex": 1,
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
                  window.location = "confirm-fastlane.html";
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
