"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
// @ts-ignore - Type definitions issue in production build
const morgan_1 = __importDefault(require("morgan"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const dojoRoutes_1 = __importDefault(require("./routes/dojoRoutes"));
const beltRoutes_1 = __importDefault(require("./routes/beltRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const tournamentRoutes_1 = __importDefault(require("./routes/tournamentRoutes"));
const matchRoutes_1 = __importDefault(require("./routes/matchRoutes"));
const resultRoutes_1 = __importDefault(require("./routes/resultRoutes"));
const trainingRoutes_1 = __importDefault(require("./routes/trainingRoutes"));
const contentRoutes_1 = __importDefault(require("./routes/contentRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const recognitionRoutes_1 = __importDefault(require("./routes/recognitionRoutes"));
const setupRoutes_1 = __importDefault(require("./routes/setupRoutes"));
const errorHandler_1 = require("./utils/errorHandler");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// Routes
app.use('/api/setup', setupRoutes_1.default); // Admin setup (one-time use)
app.use('/api/auth', authRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/dojos', dojoRoutes_1.default);
app.use('/api/belts', beltRoutes_1.default);
app.use('/api/events', eventRoutes_1.default);
app.use('/api/tournaments', tournamentRoutes_1.default);
app.use('/api/matches', matchRoutes_1.default);
app.use('/api/results', resultRoutes_1.default);
app.use('/api/training', trainingRoutes_1.default);
app.use('/api/content', contentRoutes_1.default);
app.use('/api/upload', uploadRoutes_1.default);
app.use('/api/posts', postRoutes_1.default);
app.use('/api/recognitions', recognitionRoutes_1.default);
// Serve static files (uploads)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../src/uploads')));
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Global Error Handler
app.use(errorHandler_1.globalErrorHandler);
exports.default = app;
