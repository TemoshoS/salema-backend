const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
    try {
        const auth = req.headers.authorization;

        if (!auth)
            return res.status(401).json({
                message: "Unauthorized",
            });

        const token = auth.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid token",
        });
    }
};