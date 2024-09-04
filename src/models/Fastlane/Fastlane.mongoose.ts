import mongoose, { Model } from "mongoose"
import { IFastlane } from "./Fastlane.yup"

interface IFastlaneDocument extends IFastlane, Document {}
interface IFastlaneModel extends Model<IFastlaneDocument>{
  GetAll: () => Promise<IFastlaneDocument>,
  Create: (fastlane: IFastlane) => Promise<IFastlaneDocument>,
  Update: (id: String, Fastlane: IFastlane) => Promise<IFastlaneDocument>,
}

const Schema = mongoose.Schema
const FastlaneSchema = new Schema({
  fastlaneData: {
    type: Object
  },
  refId: {
    type: String
  },
  apiData: {
    type: Object
  },
  siteData: {
    type: Object
  }
}, 
  { timestamps: true }
)

FastlaneSchema.statics.GetAll = () => {
  return Fastlane.find()
}

FastlaneSchema.statics.Create = async(fastlane: IFastlane) => {
  const __Fastlane = new Fastlane(fastlane)
  return __Fastlane.save() 
}

FastlaneSchema.statics.Update = async(id: String, fastlane: IFastlane) => {
  return Fastlane.findByIdAndUpdate(id, fastlane, { new: true })
}

const Fastlane = mongoose.model<IFastlaneDocument, IFastlaneModel>(
  "Fastlanes",
  FastlaneSchema
)
export default Fastlane

  