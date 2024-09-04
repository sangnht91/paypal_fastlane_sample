import { array, date, InferType, object, string } from 'yup'

const Yup_Transaction = object({
  _id: string(),
  refOrderNumber: string(),
  orderNumber: string(),
  orderStatus: string(),
  languageCode: string(),
  currencyCode: string(),
  currencySign: string(),
  orderPrice: string(),
  orderPriceFormatted: string(),
  orderPriceUSD: string(),
  orderPriceFormattedUSD: string(),
  orderProductPrice: string(),
  orderProductPriceFormatted: string(),
  orderProductPriceUSD: string(),
  orderProductPriceFormattedUSD: string(),
  shippingPrice: string(),
  shippingPriceFormatted: string(),
  shippingPriceUSD: string(),
  shippingPriceFormattedUSD: string(),
  ip: string(),
  productName: string(),
  productDescription: string(),
  orderType: string(),
  campaignName: string(),
  sku: string(),
  customerEmail: string(),
  firstName: string(),
  middleName:string(),
  lastName: string(),
  addressId: string(),
  orderBehaviorId: string(),
  orderBehaviorName: string(),
  shippingAddress: object(
    {
      shippingId: string(),
      firstName: string(),
      middleName: string(),
      lastName: string(),
      address1: string(),
      address2: string(),
      city: string(),
      state: string(),
      countryCode: string(),
      countryName: string(),
      zipCode: string(),
      phoneNumber: string(),
      isVerified: string(),
      suggestion: string()
    }
  ),
  billingAddress: object(
    {
      id: string(),
      firstName: string(),
      middleName: string(),
      lastName: string(),
      address1: string(),
      address2: string(),
      city: string(),
      state: string(),
      countryCode: string(),
      countryName: string(),
      zipCode: string(),
      phoneNumber: string(),
      isVerified: string(),
      suggestion: string()
    }
  ),
  receipts: array(
    object(
      {
        transactionId: string(),
        paymentStatus: string(),
        paymentDescription: string(),
        paymentNumber: string(),
        currencyCode: string(),
        amount: string(),
        formattedAmount: string(),
        midDescriptor: string(),
        receiptDate: string(),
        Id: string()
      }
    )
  ),
  orderTaxes: string(),
  productImageUrls: string(),
  relatedOrders: array(),
  cratedAt: date(),
  updatedAt: date()
})

export type ITransaction = InferType<typeof Yup_Transaction>
export const validateCustomer = (transaction: ITransaction) => Yup_Transaction.validate(transaction, { strict: true })