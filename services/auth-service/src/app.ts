import express,{Application} from "express"
import morgan from "morgan";
import helmet from "helmet";
import organizationRoutes from "@routes/organization.route.js";
import errorHandler from "@middleware/errorHandler.js";

const app:Application = express();

//middlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(morgan("dev"));

// Set security HTTP headers
app.use(helmet());

//routes
app.get("/",(req,res)=>{
    res.status(200).json({message:"Auth Service is up and running"});
})

//All routes

app.use("/auth/api",organizationRoutes)

//health check
app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});
})



// Error handling middleware must be last
app.use(errorHandler);

export default app;