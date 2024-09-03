import mongoose from "mongoose"

const mongoose_connection = ({connectionString, dbName}: {connectionString: string, dbName: string}, callBack: Function ) => {
  if (connectionString === "") {
      throw new Error("The connection string is not empty!");
  }
  mongoose.set("strictQuery", false);
  mongoose.connect(connectionString, { dbName })
      .then(() => {
          console.info("The server is connected to database.");
          callBack();      
      })
      .catch((err: Error) => {
          console.warn("The server cannot connected to database.")
      });
}

export {
  mongoose_connection
}