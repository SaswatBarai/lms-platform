import express,{Application} from "express"
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import organizationRoutes from "@routes/organization.route.js";
import errorHandler from "@middleware/errorHandler.js";
import { setupSwagger } from "@config/swagger.js";
import { globalLimiter } from "@middleware/rateLimiter.js";

const app:Application = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(morgan("dev"));

// Rate limiting middleware - applies to all routes
app.use(globalLimiter);

// CORS for Swagger UI
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  helmet({
    ...(process.env.NODE_ENV === "production" 
      ? {} 
      : {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'", "http://localhost:8000", "http://localhost:4001"],
              fontSrc: ["'self'", "data:"],
            },
          },
          crossOriginEmbedderPolicy: false,
          crossOriginOpenerPolicy: false,
          crossOriginResourcePolicy: { policy: "cross-origin" },
        }
    ),
  })
);

//routes
app.get("/",(req,res)=>{
    res.status(200).json({message:"Auth Service is up and running"});
})

// Setup Swagger BEFORE other routes
if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
}

//All routes
app.use("/auth/api",organizationRoutes)

//health check - support both paths for compatibility
app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});
})
app.get("/auth/api/health",(req,res)=>{
    res.status(200).json({status:"ok"});
})



// Error handling middleware must be last
app.use(errorHandler);

export default app;