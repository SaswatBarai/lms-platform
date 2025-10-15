import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";


const app:Application = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan("dev"));
app.use(helmet());
app.use(cors());





export default app;



