/**
 * 服务层导出
 * 
 * 统一导出所有服务，便于在控制器中使用
 */

export { ArticleService, articleService } from './articleService';
export { UserService, userService } from './userService';
export { CommentService, commentService } from './commentService';
export { LikeService, likeService } from './likeService';

// 导出类型
export type { RegisterInput, LoginInput, UpdateUserInput } from './userService';
export type { CreateCommentInput, UpdateCommentInput } from './commentService';
