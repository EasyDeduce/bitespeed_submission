import express, { Request, Response } from "express";
import sequelize from "./database";
import { identify } from "./services/identify";

const app = express();
app.use(express.json());

app.post("/identify", async (req: Request, res: Response) => {
  try {
    const result = await identify(req.body);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

export default app;
