import { app } from "./src/app.js";
import { connectDb } from "./src/config/db.js";

const PORT = process.env.PORT || 8000;

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at port:${PORT}`);
    });
  })
  .catch((e) => {
    console.log("error: ", e);
    process.exit(-1);
  });
