import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => {
    return res.json({
        message: "Auth Service"
    });
});
//health check
app.get("/health", (req, res) => {
    return res.json({
        status: "Auth Service is healthy"
    });
});
app.listen(PORT, () => {
    console.log(`Auth Service is running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map