import { date, InferType, object, string } from "yup"

const Yup_Fastlane = object({
  _id: string(),
  PAYPAL: object().optional(),
  fastlaneData: object().optional(),
  refId: string().optional(),
  apiData: object().optional(),
  siteData: object().optional(),
  cratedAt: date(),
  updatedAt: date()
})

export type IFastlane = InferType<typeof Yup_Fastlane>
export const validateCustomer = (fastlane: IFastlane) => Yup_Fastlane.validate(fastlane, { strict: true })