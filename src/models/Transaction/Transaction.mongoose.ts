import mongoose, { Model } from "mongoose"
import { ITransaction } from "./Transaction.yup"

interface ITransactionDocument extends ITransaction, Document { }
interface ITransactionModel extends Model<ITransactionDocument> {
  GetAll: () => Promise<ITransactionDocument>,
  Get: (orderNumber: string) => Promise<ITransactionDocument>,
  Create: (transaction: ITransaction) => Promise<ITransactionDocument>,
  Update: (id: String, transaction: ITransaction) => Promise<ITransactionDocument>,
}

const Schema = mongoose.Schema
const TransactionsSchema = new Schema(
  {
    refOrderNumber: {
      type: String
    },
    orderNumber: {
      type: String
    },
    orderStatus: {
      type: String
    },
    languageCode: {
      type: String
    },
    currencyCode: {
      type: String
    },
    currencySign: {
      type: String
    },
    orderPrice: {
      type: String
    },
    orderPriceFormatted: {
      type: String
    },
    orderPriceUSD: {
      type: String
    },
    orderPriceFormattedUSD: {
      type: String
    },
    orderProductPrice: {
      type: String
    },
    orderProductPriceFormatted: {
      type: String
    },
    orderProductPriceUSD: {
      type: String
    },
    orderProductPriceFormattedUSD: {
      type: String
    },
    shippingPrice: {
      type: String
    },
    shippingPriceFormatted: {
      type: String
    },
    shippingPriceUSD: {
      type: String
    },
    shippingPriceFormattedUSD: {
      type: String
    },
    ip: {
      type: String
    },
    productName: {
      type: String
    },
    productDescription: {
      type: String
    },
    orderType: {
      type: String
    },
    campaignName: {
      type: String
    },
    sku: {
      type: String
    },
    customerEmail: {
      type: String
    },
    firstName: {
      type: String
    },
    middleName: {
      type: String
    },
    lastName: {
      type: String
    },
    addressId: {
      type: String
    },
    orderBehaviorId: {
      type: String
    },
    orderBehaviorName: {
      type: String
    },
    shippingAddress: {
      type: Object(
        {
          shippingId: {
            type: String
          },
          firstName: {
            type: String
          },
          middleName: {
            type: String
          },
          lastName: {
            type: String
          },
          address1: {
            type: String
          },
          address2: {
            type: String
          },
          city: {
            type: String
          },
          state: {
            type: String
          },
          countryCode: {
            type: String
          },
          countryName: {
            type: String
          },
          zipCode: {
            type: String
          },
          phoneNumber: {
            type: String
          },
          isVerified: {
            type: String
          },
          suggestion: {
            type: String
          }
        }
      )
    },
    billingAddress: {
      type: Object({
        id: {
          type: String
        },
        firstName: {
          type: String
        },
        middleName: {
          type: String
        },
        lastName: {
          type: String
        },
        address1: {
          type: String
        },
        address2: {
          type: String
        },
        city: {
          type: String
        },
        state: {
          type: String
        },
        countryCode: {
          type: String
        },
        countryName: {
          type: String
        },
        zipCode: {
          type: String
        },
        phoneNumber: {
          type: String
        },
        isVerified: {
          type: String
        },
        suggestion: {
          type: String
        }
      })
    },
    receipts: {
      type: Array(
        Object(
          {
            transactionId: {
              type: String
            },
            paymentStatus: {
              type: String
            },
            paymentDescription: {
              type: String
            },
            paymentNumber: {
              type: String
            },
            currencyCode: {
              type: String
            },
            amount: {
              type: String
            },
            formattedAmount: {
              type: String
            },
            midDescriptor: {
              type: String
            },
            receiptDate: {
              type: String
            },
            Id: {
              type: String
            }
          }
        )
      )
    },
    orderTaxes: {
      type: String
    },
    productImageUrls: {
      type: String
    },
    relatedOrders: {
      type: Array()
    }
  },
  { timestamps: true }
)

TransactionsSchema.statics.GetAll = () => {
  return Transactions.find()
}
TransactionsSchema.statics.Get = (orderNumber) => {
  return Transactions.findOne({ orderNumber })
}

TransactionsSchema.statics.Create = (payload: ITransaction) => {
  const transaction = new Transactions(payload)
  return transaction.save()
}

TransactionsSchema.statics.Update = (orderNumber: String, payload: ITransaction) => {
  return Transactions.findOneAndUpdate({ orderNumber }, payload, { new: true })
}

const Transactions = mongoose.model<ITransactionDocument, ITransactionModel>(
  "Transactions",
  TransactionsSchema
)
export default Transactions

