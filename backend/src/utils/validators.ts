/**
 * 数据验证工具库
 * 
 * 提供统一的验证方法，用于验证各种数据类型和格式
 * 所有验证方法如果验证失败都会抛出Error
 */

/**
 * 验证结果接口
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 验证工具类
 */
export class Validators {
  /**
   * 验证邮箱格式
   * 
   * @param email 邮箱地址
   * @returns 是否有效
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证邮箱
   * 
   * @param email 邮箱
   * @throws 如果邮箱格式不正确
   */
  static validateEmail(email: string): void {
    if (!email) {
      throw new Error('EMAIL_REQUIRED');
    }

    if (!this.isValidEmail(email)) {
      throw new Error('INVALID_EMAIL');
    }

    if (email.length > 100) {
      throw new Error('EMAIL_TOO_LONG');
    }
  }

  /**
   * 验证用户名
   * 
   * @param username 用户名
   * @throws 如果用户名格式不正确
   */
  static validateUsername(username: string): void {
    if (!username) {
      throw new Error('USERNAME_REQUIRED');
    }

    if (username.length < 2) {
      throw new Error('USERNAME_TOO_SHORT');
    }

    if (username.length > 50) {
      throw new Error('USERNAME_TOO_LONG');
    }

    // 允许字母、数字、下划线、中文
    const usernameRegex = /^[\w\u4e00-\u9fa5]+$/;
    if (!usernameRegex.test(username)) {
      throw new Error('INVALID_USERNAME_FORMAT');
    }
  }

  /**
   * 验证字符串长度
   * 
   * @param value 字符串
   * @param min 最小长度
   * @param max 最大长度
   * @param fieldName 字段名（用于错误消息）
   * @throws 如果长度不符
   */
  static validateStringLength(
    value: string,
    min: number,
    max: number,
    fieldName: string = 'String'
  ): void {
    if (!value) {
      throw new Error(`${fieldName}_REQUIRED`);
    }

    if (value.length < min) {
      throw new Error(`${fieldName}_TOO_SHORT`);
    }

    if (value.length > max) {
      throw new Error(`${fieldName}_TOO_LONG`);
    }
  }

  /**
   * 验证文章标题
   * 
   * @param title 标题
   * @throws 如果标题不符要求
   */
  static validateArticleTitle(title: string): void {
    if (!title) {
      throw new Error('TITLE_REQUIRED');
    }

    if (title.length < 3) {
      throw new Error('TITLE_TOO_SHORT');
    }

    if (title.length > 200) {
      throw new Error('TITLE_TOO_LONG');
    }
  }

  /**
   * 验证文章slug
   * 
   * slug应该是URL友好的字符串
   * 只允许小写字母、数字和连字符
   * 
   * @param slug slug
   * @throws 如果slug格式不正确
   */
  static validateArticleSlug(slug: string): void {
    if (!slug) {
      throw new Error('SLUG_REQUIRED');
    }

    if (slug.length < 3) {
      throw new Error('SLUG_TOO_SHORT');
    }

    if (slug.length > 100) {
      throw new Error('SLUG_TOO_LONG');
    }

    // slug只允许小写字母、数字和连字符
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      throw new Error('INVALID_SLUG_FORMAT');
    }
  }

  /**
   * 验证文章内容
   * 
   * @param content 内容
   * @throws 如果内容不符要求
   */
  static validateArticleContent(content: string): void {
    if (!content) {
      throw new Error('CONTENT_REQUIRED');
    }

    if (content.length < 10) {
      throw new Error('CONTENT_TOO_SHORT');
    }

    if (content.length > 100000) {
      throw new Error('CONTENT_TOO_LONG');
    }
  }

  /**
   * 验证文章摘要
   * 
   * @param excerpt 摘要
   * @throws 如果摘要不符要求
   */
  static validateArticleExcerpt(excerpt: string): void {
    if (excerpt && excerpt.length > 500) {
      throw new Error('EXCERPT_TOO_LONG');
    }
  }

  /**
   * 验证URL
   * 
   * @param url URL
   * @throws 如果URL格式不正确
   */
  static validateURL(url: string): void {
    if (!url) return; // URL是可选的

    const urlRegex = /^https?:\/\/.+\..+/;
    if (!urlRegex.test(url)) {
      throw new Error('INVALID_URL_FORMAT');
    }
  }

  /**
   * 验证ID（UUID或MongoDB ObjectId）
   * 
   * @param id ID
   * @param fieldName 字段名
   * @throws 如果ID格式不正确
   */
  static validateId(id: string, fieldName: string = 'Id'): void {
    if (!id) {
      throw new Error(`${fieldName}_REQUIRED`);
    }

    if (typeof id !== 'string') {
      throw new Error(`INVALID_${fieldName}_TYPE`);
    }

    if (id.length === 0) {
      throw new Error(`${fieldName}_EMPTY`);
    }
  }

  /**
   * 验证ID数组
   * 
   * @param ids ID数组
   * @param fieldName 字段名
   * @throws 如果任何ID无效
   */
  static validateIdArray(ids: string[], fieldName: string = 'Id'): void {
    if (!Array.isArray(ids)) {
      throw new Error(`INVALID_${fieldName}_ARRAY_TYPE`);
    }

    if (ids.length === 0) {
      throw new Error(`${fieldName}_ARRAY_EMPTY`);
    }

    if (ids.length > 100) {
      throw new Error(`${fieldName}_ARRAY_TOO_LONG`);
    }

    ids.forEach((id, index) => {
      if (!id || typeof id !== 'string') {
        throw new Error(`INVALID_${fieldName}_AT_INDEX_${index}`);
      }
    });
  }

  /**
   * 验证分页参数
   * 
   * @param page 页码
   * @param limit 每页数量
   * @throws 如果参数不符要求
   */
  static validatePagination(page: any, limit: any): { page: number; limit: number } {
    let pageNum = parseInt(page) || 1;
    let limitNum = parseInt(limit) || 10;

    pageNum = Math.max(1, pageNum);
    limitNum = Math.max(1, Math.min(100, limitNum));

    return { page: pageNum, limit: limitNum };
  }

  /**
   * 验证排序参数
   * 
   * @param sortBy 排序字段
   * @param sortOrder 排序顺序
   * @param allowedFields 允许的字段列表
   * @throws 如果排序参数不有效
   */
  static validateSort(
    sortBy: string,
    sortOrder: string,
    allowedFields: string[]
  ): { sortBy: string; sortOrder: 'asc' | 'desc' } {
    // 验证sortBy
    if (!sortBy || !allowedFields.includes(sortBy)) {
      sortBy = 'createdAt'; // 使用默认值
    }

    // 验证sortOrder
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      sortOrder = 'desc'; // 使用默认值
    }

    return { sortBy, sortOrder: sortOrder as 'asc' | 'desc' };
  }

  /**
   * 验证评论内容
   * 
   * @param content 评论内容
   * @throws 如果内容不符要求
   */
  static validateCommentContent(content: string): void {
    if (!content) {
      throw new Error('COMMENT_CONTENT_REQUIRED');
    }

    if (content.length < 1) {
      throw new Error('COMMENT_CONTENT_TOO_SHORT');
    }

    if (content.length > 5000) {
      throw new Error('COMMENT_CONTENT_TOO_LONG');
    }
  }

  /**
   * 验证用户简介
   * 
   * @param bio 简介
   * @throws 如果简介不符要求
   */
  static validateBio(bio: string): void {
    if (bio && bio.length > 500) {
      throw new Error('BIO_TOO_LONG');
    }
  }

  /**
   * 验证分类名称
   * 
   * @param name 分类名称
   * @throws 如果名称不符要求
   */
  static validateCategoryName(name: string): void {
    if (!name) {
      throw new Error('CATEGORY_NAME_REQUIRED');
    }

    if (name.length < 1) {
      throw new Error('CATEGORY_NAME_TOO_SHORT');
    }

    if (name.length > 50) {
      throw new Error('CATEGORY_NAME_TOO_LONG');
    }
  }

  /**
   * 验证标签名称
   * 
   * @param name 标签名称
   * @throws 如果名称不符要求
   */
  static validateTagName(name: string): void {
    if (!name) {
      throw new Error('TAG_NAME_REQUIRED');
    }

    if (name.length < 1) {
      throw new Error('TAG_NAME_TOO_SHORT');
    }

    if (name.length > 30) {
      throw new Error('TAG_NAME_TOO_LONG');
    }
  }

  /**
   * 验证日期
   * 
   * @param date 日期字符串或Date对象
   * @throws 如果日期无效
   */
  static validateDate(date: any): Date {
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      throw new Error('INVALID_DATE_FORMAT');
    }

    return dateObj;
  }

  /**
   * 验证对象不为空
   * 
   * @param obj 对象
   * @param fieldName 字段名
   * @throws 如果对象为空或不是对象
   */
  static validateObject(obj: any, fieldName: string = 'Object'): void {
    if (!obj || typeof obj !== 'object') {
      throw new Error(`INVALID_${fieldName}_TYPE`);
    }
  }

  /**
   * 验证至少一个字段被提供
   * 
   * @param fields 字段对象
   * @param requiredCount 必需的字段数（默认1个）
   * @throws 如果未提供足够的字段
   */
  static validateAtLeastOneField(fields: { [key: string]: any }, requiredCount: number = 1): void {
    const providedFields = Object.values(fields).filter(v => v !== undefined && v !== null && v !== '');

    if (providedFields.length < requiredCount) {
      throw new Error('NO_FIELDS_PROVIDED');
    }
  }
}

/**
 * 错误消息映射
 * 将错误代码映射到用户友好的错误信息
 */
export const errorMessageMap: { [key: string]: string } = {
  // 邮箱相关
  'EMAIL_REQUIRED': '邮箱为必填项',
  'INVALID_EMAIL': '邮箱格式不正确',
  'EMAIL_TOO_LONG': '邮箱过长',

  // 用户名相关
  'USERNAME_REQUIRED': '用户名为必填项',
  'USERNAME_TOO_SHORT': '用户名至少2个字符',
  'USERNAME_TOO_LONG': '用户名最多50个字符',
  'INVALID_USERNAME_FORMAT': '用户名只能包含字母、数字、下划线和中文',

  // 文章相关
  'TITLE_REQUIRED': '文章标题为必填项',
  'TITLE_TOO_SHORT': '文章标题至少3个字符',
  'TITLE_TOO_LONG': '文章标题最多200个字符',

  'SLUG_REQUIRED': '文章slug为必填项',
  'SLUG_TOO_SHORT': 'slug至少3个字符',
  'SLUG_TOO_LONG': 'slug最多100个字符',
  'INVALID_SLUG_FORMAT': 'slug只能包含小写字母、数字和连字符',

  'CONTENT_REQUIRED': '文章内容为必填项',
  'CONTENT_TOO_SHORT': '文章内容至少10个字符',
  'CONTENT_TOO_LONG': '文章内容不能超过100000个字符',

  'EXCERPT_TOO_LONG': '文章摘要最多500个字符',

  'INVALID_URL_FORMAT': 'URL格式不正确',

  // ID相关
  'Id_REQUIRED': 'ID为必填项',
  'INVALID_Id_TYPE': 'ID类型不正确',

  // 分页相关
  'INVALID_PAGINATION': '分页参数不正确',

  // 评论相关
  'COMMENT_CONTENT_REQUIRED': '评论内容为必填项',
  'COMMENT_CONTENT_TOO_SHORT': '评论内容至少1个字符',
  'COMMENT_CONTENT_TOO_LONG': '评论内容最多5000个字符',

  // 简介相关
  'BIO_TOO_LONG': '个人简介最多500个字符',

  // 分类相关
  'CATEGORY_NAME_REQUIRED': '分类名称为必填项',
  'CATEGORY_NAME_TOO_SHORT': '分类名称至少1个字符',
  'CATEGORY_NAME_TOO_LONG': '分类名称最多50个字符',

  // 标签相关
  'TAG_NAME_REQUIRED': '标签名称为必填项',
  'TAG_NAME_TOO_SHORT': '标签名称至少1个字符',
  'TAG_NAME_TOO_LONG': '标签名称最多30个字符',

  // 日期相关
  'INVALID_DATE_FORMAT': '日期格式不正确',

  // 通用
  'NO_FIELDS_PROVIDED': '没有提供需要更新的字段',
};

/**
 * 获取用户友好的错误信息
 * 
 * @param errorCode 错误代码
 * @returns 用户友好的错误信息
 */
export function getUserFriendlyMessage(errorCode: string): string {
  return errorMessageMap[errorCode] || '数据验证失败';
}
