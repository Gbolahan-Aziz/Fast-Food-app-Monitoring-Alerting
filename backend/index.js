import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { metricsMiddleware, metricsEndpoint } from './metrics.js';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/images", express.static(`${__dirname}/images`));

// Use the metrics middleware
app.use(metricsMiddleware);

app.get("/meals", async (req, res) => {
  const meals = await fs.readFile(`${__dirname}/data/available-meals.json`, 'utf8');
  res.json(JSON.parse(meals));
});

app.post("/orders", async (req, res) => {
  const orderData = req.body.order;
  if (orderData === null || orderData.items === null || orderData.items == []) {
    return res.status(400).json({ message: "Missing data." });
  }
  if (
    orderData.customer.email === null ||
    !orderData.customer.email.includes("@") ||
    orderData.customer.fullName === null ||
    orderData.customer.fullName.trim() === "" ||
    orderData.customer.number === null ||
    orderData.customer.number < 11 ||
    orderData.customer.address === null ||
    orderData.customer.address.trim() === ""
  ) {
    return res.status(400).json({
      message:
        "Missing data: Email, name, address, payMethod or city is missing.",
    });
  }

  const newOrder = {
    id: (Math.random() * 1000).toString(),
    ...orderData,
  };
  const orders = await fs.readFile(`${__dirname}/data/orders.json`, 'utf8');
  const allOrders = JSON.parse(orders);
  allOrders.push(newOrder);
  await fs.writeFile(`${__dirname}/data/orders.json`, JSON.stringify(allOrders));
  res.status(201).json({ message: "Order Successfully Created!" });
});

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

app.use((req, res) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  res.status(404).json({ message: "Not found" });
});

app.listen(5000, () => {
  console.log("Server is running at http://localhost:5000");
});
