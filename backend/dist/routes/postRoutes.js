"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const postController_1 = require("../controllers/postController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public routes
router.get('/', postController_1.getAllPosts);
router.get('/slug/:slug', postController_1.getPostBySlug);
// Protected routes
router.use(authMiddleware_1.protect);
// Allow Students/Instructors to create posts
router.post('/', postController_1.createPost);
// Admin only routes
router.use((0, authMiddleware_1.restrictTo)('ADMIN'));
router.patch('/:id/approve', postController_1.approvePost);
router.route('/:id')
    .get(postController_1.getPost)
    .patch(postController_1.updatePost)
    .delete(postController_1.deletePost);
exports.default = router;
