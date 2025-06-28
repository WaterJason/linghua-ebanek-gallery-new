/**
 * 数据验证工具
 *
 * 这个文件包含用于验证数据的工具函数
 * 确保传入的数据符合模型的要求
 */

import {
  CreateProductInput,
  UpdateProductInput,
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateOrderInput,
  UpdateOrderInput,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateRoleInput,
  UpdateRoleInput,
  CreateChannelInput,
  UpdateChannelInput,
  CreateWorkshopInput,
  UpdateWorkshopInput,
  CreateWorkshopActivityInput,
  UpdateWorkshopActivityInput
} from "@/types/prisma-models";

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 通用验证函数
 * @param data 要验证的数据
 * @param validations 验证规则数组
 * @returns 验证结果
 */
export function validate(data: any, validations: Array<(data: any) => string | null>): ValidationResult {
  const errors: string[] = [];

  for (const validation of validations) {
    const error = validation(data);
    if (error) {
      errors.push(error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 验证必填字段
 * @param fieldName 字段名
 * @param displayName 显示名称
 * @returns 验证函数
 */
export function required(fieldName: string, displayName: string) {
  return (data: any) => {
    if (data[fieldName] === undefined || data[fieldName] === null || data[fieldName] === '') {
      return `${displayName}为必填项`;
    }
    return null;
  };
}

/**
 * 验证数字字段
 * @param fieldName 字段名
 * @param displayName 显示名称
 * @param options 选项
 * @returns 验证函数
 */
export function number(fieldName: string, displayName: string, options: { min?: number; max?: number; required?: boolean } = {}) {
  return (data: any) => {
    if (data[fieldName] === undefined || data[fieldName] === null) {
      return options.required ? `${displayName}为必填项` : null;
    }

    const value = typeof data[fieldName] === 'string' ? parseFloat(data[fieldName]) : data[fieldName];

    if (isNaN(value)) {
      return `${displayName}必须是有效的数字`;
    }

    if (options.min !== undefined && value < options.min) {
      return `${displayName}不能小于${options.min}`;
    }

    if (options.max !== undefined && value > options.max) {
      return `${displayName}不能大于${options.max}`;
    }

    return null;
  };
}

/**
 * 验证整数字段
 * @param fieldName 字段名
 * @param displayName 显示名称
 * @param options 选项
 * @returns 验证函数
 */
export function integer(fieldName: string, displayName: string, options: { min?: number; max?: number; required?: boolean } = {}) {
  return (data: any) => {
    if (data[fieldName] === undefined || data[fieldName] === null) {
      return options.required ? `${displayName}为必填项` : null;
    }

    const value = typeof data[fieldName] === 'string' ? parseInt(data[fieldName]) : data[fieldName];

    if (isNaN(value) || !Number.isInteger(value)) {
      return `${displayName}必须是有效的整数`;
    }

    if (options.min !== undefined && value < options.min) {
      return `${displayName}不能小于${options.min}`;
    }

    if (options.max !== undefined && value > options.max) {
      return `${displayName}不能大于${options.max}`;
    }

    return null;
  };
}

/**
 * 验证字符串字段
 * @param fieldName 字段名
 * @param displayName 显示名称
 * @param options 选项
 * @returns 验证函数
 */
export function string(fieldName: string, displayName: string, options: { minLength?: number; maxLength?: number; required?: boolean; pattern?: RegExp } = {}) {
  return (data: any) => {
    if (data[fieldName] === undefined || data[fieldName] === null || data[fieldName] === '') {
      return options.required ? `${displayName}为必填项` : null;
    }

    const value = String(data[fieldName]);

    if (options.minLength !== undefined && value.length < options.minLength) {
      return `${displayName}长度不能小于${options.minLength}个字符`;
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      return `${displayName}长度不能超过${options.maxLength}个字符`;
    }

    if (options.pattern !== undefined && !options.pattern.test(value)) {
      return `${displayName}格式不正确`;
    }

    return null;
  };
}

/**
 * 验证日期字段
 * @param fieldName 字段名
 * @param displayName 显示名称
 * @param options 选项
 * @returns 验证函数
 */
export function date(fieldName: string, displayName: string, options: { min?: Date; max?: Date; required?: boolean } = {}) {
  return (data: any) => {
    if (data[fieldName] === undefined || data[fieldName] === null) {
      return options.required ? `${displayName}为必填项` : null;
    }

    const value = data[fieldName] instanceof Date ? data[fieldName] : new Date(data[fieldName]);

    if (isNaN(value.getTime())) {
      return `${displayName}必须是有效的日期`;
    }

    if (options.min !== undefined && value < options.min) {
      return `${displayName}不能早于${options.min.toLocaleDateString()}`;
    }

    if (options.max !== undefined && value > options.max) {
      return `${displayName}不能晚于${options.max.toLocaleDateString()}`;
    }

    return null;
  };
}

/**
 * 验证布尔字段
 * @param fieldName 字段名
 * @param displayName 显示名称
 * @param options 选项
 * @returns 验证函数
 */
export function boolean(fieldName: string, displayName: string, options: { required?: boolean } = {}) {
  return (data: any) => {
    if (data[fieldName] === undefined || data[fieldName] === null) {
      return options.required ? `${displayName}为必填项` : null;
    }

    if (typeof data[fieldName] !== 'boolean') {
      return `${displayName}必须是布尔值`;
    }

    return null;
  };
}

/**
 * 验证数组字段
 * @param fieldName 字段名
 * @param displayName 显示名称
 * @param options 选项
 * @returns 验证函数
 */
export function array(fieldName: string, displayName: string, options: { minLength?: number; maxLength?: number; required?: boolean } = {}) {
  return (data: any) => {
    if (data[fieldName] === undefined || data[fieldName] === null) {
      return options.required ? `${displayName}为必填项` : null;
    }

    if (!Array.isArray(data[fieldName])) {
      return `${displayName}必须是数组`;
    }

    if (options.minLength !== undefined && data[fieldName].length < options.minLength) {
      return `${displayName}长度不能小于${options.minLength}`;
    }

    if (options.maxLength !== undefined && data[fieldName].length > options.maxLength) {
      return `${displayName}长度不能超过${options.maxLength}`;
    }

    return null;
  };
}

/**
 * 验证邮箱字段
 * @param fieldName 字段名
 * @param displayName 显示名称
 * @param options 选项
 * @returns 验证函数
 */
export function email(fieldName: string, displayName: string, options: { required?: boolean } = {}) {
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return (data: any) => {
    if (data[fieldName] === undefined || data[fieldName] === null || data[fieldName] === '') {
      return options.required ? `${displayName}为必填项` : null;
    }

    const value = String(data[fieldName]);

    if (!emailPattern.test(value)) {
      return `${displayName}格式不正确`;
    }

    return null;
  };
}

/**
 * 验证手机号字段
 * @param fieldName 字段名
 * @param displayName 显示名称
 * @param options 选项
 * @returns 验证函数
 */
export function phone(fieldName: string, displayName: string, options: { required?: boolean } = {}) {
  const phonePattern = /^1[3-9]\d{9}$/;

  return (data: any) => {
    if (data[fieldName] === undefined || data[fieldName] === null || data[fieldName] === '') {
      return options.required ? `${displayName}为必填项` : null;
    }

    const value = String(data[fieldName]);

    if (!phonePattern.test(value)) {
      return `${displayName}格式不正确`;
    }

    return null;
  };
}

/**
 * 验证产品创建数据
 * @param data 产品创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateProduct(data: any): ValidationResult {
  return validate(data, [
    required('name', '产品名称'),
    number('price', '产品价格', { min: 0, required: false }), // 价格改为非必填
    number('commissionRate', '佣金率', { min: 0, max: 100 }),
    number('cost', '成本', { min: 0 }),
    integer('categoryId', '分类ID', { min: 1 }),
    integer('inventory', '库存', { min: 0 }),
    string('name', '产品名称', { maxLength: 100, required: true }),
    string('description', '产品描述', { maxLength: 1000 }),
    string('sku', 'SKU', { maxLength: 50 }),
    string('barcode', '艺术品序列号', { maxLength: 50 }), // 更新字段名称
    string('unit', '单位', { maxLength: 20 }),
    string('material', '材料', { maxLength: 50 }),
  ]);
}

/**
 * 验证产品更新数据
 * @param data 产品更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateProduct(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '产品名称', { maxLength: 100 }));
  if (data.price !== undefined) validations.push(number('price', '产品价格', { min: 0 }));
  if (data.commissionRate !== undefined) validations.push(number('commissionRate', '佣金率', { min: 0, max: 100 }));
  if (data.cost !== undefined) validations.push(number('cost', '成本', { min: 0 }));
  if (data.categoryId !== undefined) validations.push(integer('categoryId', '分类ID', { min: 1 }));
  if (data.inventory !== undefined) validations.push(integer('inventory', '库存', { min: 0 }));
  if (data.description !== undefined) validations.push(string('description', '产品描述', { maxLength: 1000 }));
  if (data.sku !== undefined) validations.push(string('sku', 'SKU', { maxLength: 50 }));
  if (data.barcode !== undefined) validations.push(string('barcode', '条形码', { maxLength: 50 }));
  if (data.unit !== undefined) validations.push(string('unit', '单位', { maxLength: 20 }));
  if (data.material !== undefined) validations.push(string('material', '材料', { maxLength: 50 }));

  return validate(data, validations);
}

/**
 * 验证产品分类创建数据
 * @param data 产品分类创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateProductCategory(data: any): ValidationResult {
  return validate(data, [
    required('name', '分类名称'),
    string('name', '分类名称', { maxLength: 100, required: true }),
    string('code', '分类代码', { maxLength: 50 }),
    string('description', '分类描述', { maxLength: 500 }),
    integer('parentId', '父分类ID', { min: 1 }),
    integer('sortOrder', '排序顺序', { min: 0 }),
  ]);
}

/**
 * 验证产品分类更新数据
 * @param data 产品分类更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateProductCategory(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '分类名称', { maxLength: 100 }));
  if (data.code !== undefined) validations.push(string('code', '分类代码', { maxLength: 50 }));
  if (data.description !== undefined) validations.push(string('description', '分类描述', { maxLength: 500 }));
  if (data.parentId !== undefined) validations.push(integer('parentId', '父分类ID', { min: 1 }));
  if (data.sortOrder !== undefined) validations.push(integer('sortOrder', '排序顺序', { min: 0 }));

  return validate(data, validations);
}

/**
 * 验证客户创建数据
 * @param data 客户创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateCustomer(data: any): ValidationResult {
  return validate(data, [
    required('name', '客户名称'),
    string('name', '客户名称', { maxLength: 100, required: true }),
    phone('phone', '手机号'),
    email('email', '邮箱'),
    string('address', '地址', { maxLength: 200 }),
    string('type', '客户类型', { maxLength: 50 }),
    string('notes', '备注', { maxLength: 500 }),
  ]);
}

/**
 * 验证员工创建数据
 * @param data 员工创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateEmployee(data: any): ValidationResult {
  return validate(data, [
    required('name', '员工姓名'),
    required('position', '职位'),
    required('dailySalary', '日薪'),
    string('name', '员工姓名', { maxLength: 100, required: true }),
    string('position', '职位', { maxLength: 100, required: true }),
    phone('phone', '手机号'),
    email('email', '邮箱'),
    number('dailySalary', '日薪', { min: 0, required: true }),
    string('status', '状态', { maxLength: 50 }),
    string('address', '地址', { maxLength: 200 }),
    string('emergencyContact', '紧急联系人', { maxLength: 100 }),
    string('emergencyPhone', '紧急联系电话', { maxLength: 20 }),
    string('idNumber', '身份证号', { maxLength: 18 }),
    string('bankAccount', '银行账号', { maxLength: 50 }),
    string('bankName', '银行名称', { maxLength: 100 }),
    number('salary', '薪资', { min: 0 }),
  ]);
}

/**
 * 验证员工更新数据
 * @param data 员工更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateEmployee(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '员工姓名', { maxLength: 100 }));
  if (data.position !== undefined) validations.push(string('position', '职位', { maxLength: 100 }));
  if (data.phone !== undefined) validations.push(phone('phone', '手机号'));
  if (data.email !== undefined) validations.push(email('email', '邮箱'));
  if (data.dailySalary !== undefined) validations.push(number('dailySalary', '日薪', { min: 0 }));
  if (data.status !== undefined) validations.push(string('status', '状态', { maxLength: 50 }));
  if (data.address !== undefined) validations.push(string('address', '地址', { maxLength: 200 }));
  if (data.emergencyContact !== undefined) validations.push(string('emergencyContact', '紧急联系人', { maxLength: 100 }));
  if (data.emergencyPhone !== undefined) validations.push(string('emergencyPhone', '紧急联系电话', { maxLength: 20 }));
  if (data.idNumber !== undefined) validations.push(string('idNumber', '身份证号', { maxLength: 18 }));
  if (data.bankAccount !== undefined) validations.push(string('bankAccount', '银行账号', { maxLength: 50 }));
  if (data.bankName !== undefined) validations.push(string('bankName', '银行名称', { maxLength: 100 }));
  if (data.salary !== undefined) validations.push(number('salary', '薪资', { min: 0 }));

  return validate(data, validations);
}

/**
 * 验证薪资记录创建数据
 * @param data 薪资记录创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateSalaryRecord(data: any): ValidationResult {
  return validate(data, [
    required('employeeId', '员工ID'),
    required('month', '月份'),
    integer('employeeId', '员工ID', { min: 1, required: true }),
    date('month', '月份', { required: true }),
    number('baseSalary', '基本工资', { min: 0 }),
    number('scheduleSalary', '排班工资', { min: 0 }),
    number('salesCommission', '销售提成', { min: 0 }),
    number('pieceWorkIncome', '计件收入', { min: 0 }),
    number('workshopIncome', '工作坊收入', { min: 0 }),
    number('coffeeShiftCommission', '咖啡厅班次提成', { min: 0 }),
    number('overtimePay', '加班费', { min: 0 }),
    number('bonus', '奖金', { min: 0 }),
    number('deductions', '扣款', { min: 0 }),
    number('socialInsurance', '社保', { min: 0 }),
    number('tax', '税费', { min: 0 }),
    number('totalIncome', '总收入', { min: 0 }),
    number('netIncome', '净收入', { min: 0 }),
    string('status', '状态', { maxLength: 50 }),
    date('paymentDate', '支付日期'),
    string('notes', '备注', { maxLength: 500 }),
  ]);
}

/**
 * 验证薪资记录更新数据
 * @param data 薪资记录更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateSalaryRecord(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.baseSalary !== undefined) validations.push(number('baseSalary', '基本工资', { min: 0 }));
  if (data.scheduleSalary !== undefined) validations.push(number('scheduleSalary', '排班工资', { min: 0 }));
  if (data.salesCommission !== undefined) validations.push(number('salesCommission', '销售提成', { min: 0 }));
  if (data.pieceWorkIncome !== undefined) validations.push(number('pieceWorkIncome', '计件收入', { min: 0 }));
  if (data.workshopIncome !== undefined) validations.push(number('workshopIncome', '工作坊收入', { min: 0 }));
  if (data.coffeeShiftCommission !== undefined) validations.push(number('coffeeShiftCommission', '咖啡厅班次提成', { min: 0 }));
  if (data.overtimePay !== undefined) validations.push(number('overtimePay', '加班费', { min: 0 }));
  if (data.bonus !== undefined) validations.push(number('bonus', '奖金', { min: 0 }));
  if (data.deductions !== undefined) validations.push(number('deductions', '扣款', { min: 0 }));
  if (data.socialInsurance !== undefined) validations.push(number('socialInsurance', '社保', { min: 0 }));
  if (data.tax !== undefined) validations.push(number('tax', '税费', { min: 0 }));
  if (data.totalIncome !== undefined) validations.push(number('totalIncome', '总收入', { min: 0 }));
  if (data.netIncome !== undefined) validations.push(number('netIncome', '净收入', { min: 0 }));
  if (data.status !== undefined) validations.push(string('status', '状态', { maxLength: 50 }));
  if (data.paymentDate !== undefined) validations.push(date('paymentDate', '支付日期'));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));

  return validate(data, validations);
}

/**
 * 验证库存项创建数据
 * @param data 库存项创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateInventoryItem(data: any): ValidationResult {
  return validate(data, [
    required('productId', '产品ID'),
    integer('productId', '产品ID', { min: 1, required: true }),
    integer('quantity', '数量', { min: 0, required: true }),
    integer('warehouseId', '仓库ID', { min: 1 }),
  ]);
}

/**
 * 验证库存项更新数据
 * @param data 库存项更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateInventoryItem(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.quantity !== undefined) validations.push(integer('quantity', '数量', { min: 0 }));
  if (data.warehouseId !== undefined) validations.push(integer('warehouseId', '仓库ID', { min: 1 }));

  return validate(data, validations);
}

/**
 * 验证仓库创建数据
 * @param data 仓库创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateWarehouse(data: any): ValidationResult {
  return validate(data, [
    required('name', '仓库名称'),
    required('location', '仓库位置'),
    string('name', '仓库名称', { maxLength: 100, required: true }),
    string('location', '仓库位置', { maxLength: 200, required: true }),
    string('description', '仓库描述', { maxLength: 500 }),
  ]);
}

/**
 * 验证仓库更新数据
 * @param data 仓库更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateWarehouse(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '仓库名称', { maxLength: 100 }));
  if (data.location !== undefined) validations.push(string('location', '仓库位置', { maxLength: 200 }));
  if (data.description !== undefined) validations.push(string('description', '仓库描述', { maxLength: 500 }));
  if (data.isActive !== undefined) validations.push(string('isActive', '是否启用'));

  return validate(data, validations);
}

/**
 * 验证库存转移数据
 * @param data 库存转移数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateInventoryTransfer(data: any): ValidationResult {
  return validate(data, [
    required('productId', '产品ID'),
    required('quantity', '数量'),
    required('fromLocationId', '源仓库ID'),
    integer('productId', '产品ID', { min: 1, required: true }),
    integer('quantity', '数量', { min: 1, required: true }),
    integer('fromLocationId', '源仓库ID', { min: 1, required: true }),
    integer('toLocationId', '目标仓库ID', { min: 1 }),
    string('notes', '备注', { maxLength: 500 }),
  ]);
}

/**
 * 验证工作坊活动创建数据
 * @param data 工作坊活动创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateWorkshopActivity(data: any): ValidationResult {
  return validate(data, [
    required('title', '活动标题'),
    required('date', '活动日期'),
    string('title', '活动标题', { maxLength: 100, required: true }),
    date('date', '活动日期', { required: true }),
    string('startTime', '开始时间', { maxLength: 50 }),
    string('endTime', '结束时间', { maxLength: 50 }),
    string('location', '活动地点', { maxLength: 200 }),
    string('description', '活动描述', { maxLength: 1000 }),
    integer('channelId', '渠道ID', { min: 1 }),
    integer('instructorId', '讲师ID', { min: 1 }),
    integer('assistantId', '助理ID', { min: 1 }),
    integer('participantCount', '参与人数', { min: 0 }),
    number('fee', '费用', { min: 0 }),
    string('status', '状态', { maxLength: 50 }),
    string('notes', '备注', { maxLength: 500 }),
    string('createdById', '创建人ID', { maxLength: 100 }),
  ]);
}

/**
 * 验证工作坊活动更新数据
 * @param data 工作坊活动更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateWorkshopActivity(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.title !== undefined) validations.push(string('title', '活动标题', { maxLength: 100 }));
  if (data.date !== undefined) validations.push(date('date', '活动日期'));
  if (data.startTime !== undefined) validations.push(string('startTime', '开始时间', { maxLength: 50 }));
  if (data.endTime !== undefined) validations.push(string('endTime', '结束时间', { maxLength: 50 }));
  if (data.location !== undefined) validations.push(string('location', '活动地点', { maxLength: 200 }));
  if (data.description !== undefined) validations.push(string('description', '活动描述', { maxLength: 1000 }));
  if (data.channelId !== undefined) validations.push(integer('channelId', '渠道ID', { min: 1 }));
  if (data.instructorId !== undefined) validations.push(integer('instructorId', '讲师ID', { min: 1 }));
  if (data.assistantId !== undefined) validations.push(integer('assistantId', '助理ID', { min: 1 }));
  if (data.participantCount !== undefined) validations.push(integer('participantCount', '参与人数', { min: 0 }));
  if (data.fee !== undefined) validations.push(number('fee', '费用', { min: 0 }));
  if (data.status !== undefined) validations.push(string('status', '状态', { maxLength: 50 }));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));

  return validate(data, validations);
}

/**
 * 验证工作坊渠道创建数据
 * @param data 工作坊渠道创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateWorkshopChannel(data: any): ValidationResult {
  return validate(data, [
    required('name', '渠道名称'),
    string('name', '渠道名称', { maxLength: 100, required: true }),
    string('contactPerson', '联系人', { maxLength: 100 }),
    string('phone', '电话', { maxLength: 50 }),
    string('email', '邮箱', { maxLength: 100 }),
    string('address', '地址', { maxLength: 200 }),
    string('notes', '备注', { maxLength: 500 }),
  ]);
}

/**
 * 验证工作坊渠道更新数据
 * @param data 工作坊渠道更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateWorkshopChannel(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '渠道名称', { maxLength: 100 }));
  if (data.contactPerson !== undefined) validations.push(string('contactPerson', '联系人', { maxLength: 100 }));
  if (data.phone !== undefined) validations.push(string('phone', '电话', { maxLength: 50 }));
  if (data.email !== undefined) validations.push(string('email', '邮箱', { maxLength: 100 }));
  if (data.address !== undefined) validations.push(string('address', '地址', { maxLength: 200 }));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));
  if (data.isActive !== undefined) validations.push(boolean('isActive', '是否启用'));

  return validate(data, validations);
}

/**
 * 验证工作坊讲师创建数据
 * @param data 工作坊讲师创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateWorkshopInstructor(data: any): ValidationResult {
  return validate(data, [
    required('name', '讲师姓名'),
    string('name', '讲师姓名', { maxLength: 100, required: true }),
    string('phone', '电话', { maxLength: 50 }),
    string('email', '邮箱', { maxLength: 100 }),
    string('specialty', '专长', { maxLength: 200 }),
    string('bio', '简介', { maxLength: 1000 }),
    number('fee', '费用', { min: 0 }),
  ]);
}

/**
 * 验证工作坊讲师更新数据
 * @param data 工作坊讲师更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateWorkshopInstructor(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '讲师姓名', { maxLength: 100 }));
  if (data.phone !== undefined) validations.push(string('phone', '电话', { maxLength: 50 }));
  if (data.email !== undefined) validations.push(string('email', '邮箱', { maxLength: 100 }));
  if (data.specialty !== undefined) validations.push(string('specialty', '专长', { maxLength: 200 }));
  if (data.bio !== undefined) validations.push(string('bio', '简介', { maxLength: 1000 }));
  if (data.fee !== undefined) validations.push(number('fee', '费用', { min: 0 }));
  if (data.isActive !== undefined) validations.push(boolean('isActive', '是否启用'));

  return validate(data, validations);
}

/**
 * 注意：validateCreateCustomer 函数已在第337行定义，此处为重复定义，已移除
 */

/**
 * 验证客户更新数据
 * @param data 客户更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateCustomer(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '客户名称', { maxLength: 100 }));
  if (data.phone !== undefined) validations.push(string('phone', '电话', { maxLength: 50 }));
  if (data.email !== undefined) validations.push(string('email', '邮箱', { maxLength: 100 }));
  if (data.address !== undefined) validations.push(string('address', '地址', { maxLength: 200 }));
  if (data.type !== undefined) validations.push(string('type', '客户类型', { maxLength: 50 }));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));
  if (data.isActive !== undefined) validations.push(boolean('isActive', '是否启用'));

  return validate(data, validations);
}

/**
 * 验证珐琅馆销售创建数据
 * @param data 珐琅馆销售创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateGallerySale(data: any): ValidationResult {
  const validations = [
    required('date', '销售日期'),
    date('date', '销售日期', { required: true }),
    string('paymentMethod', '支付方式', { maxLength: 50 }),
    string('notes', '备注', { maxLength: 500 }),
    string('createdById', '创建人ID', { maxLength: 100 }),
  ];

  // 验证销售项
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    return { isValid: false, errors: ['销售项不能为空'] };
  }

  for (const item of data.items) {
    if (!item.productId || !item.quantity || !item.price) {
      return { isValid: false, errors: ['销售项缺少必要信息'] };
    }
  }

  return validate(data, validations);
}

/**
 * 验证珐琅馆销售更新数据
 * @param data 珐琅馆销售更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateGallerySale(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.date !== undefined) validations.push(date('date', '销售日期'));
  if (data.paymentMethod !== undefined) validations.push(string('paymentMethod', '支付方式', { maxLength: 50 }));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));

  // 验证销售项
  if (data.items && Array.isArray(data.items)) {
    for (const item of data.items) {
      if (!item.productId || !item.quantity || !item.price) {
        return { isValid: false, errors: ['销售项缺少必要信息'] };
      }
    }
  }

  return validate(data, validations);
}

/**
 * 验证咖啡厅销售创建数据
 * @param data 咖啡厅销售创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateCoffeeShopSale(data: any): ValidationResult {
  return validate(data, [
    required('date', '销售日期'),
    required('totalSales', '销售金额'),
    date('date', '销售日期', { required: true }),
    number('totalSales', '销售金额', { min: 0, required: true }),
    integer('customerCount', '客户数量', { min: 0 }),
    string('paymentMethod', '支付方式', { maxLength: 50 }),
    string('notes', '备注', { maxLength: 500 }),
    string('createdById', '创建人ID', { maxLength: 100 }),
  ]);
}

/**
 * 验证咖啡厅销售更新数据
 * @param data 咖啡厅销售更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateCoffeeShopSale(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.date !== undefined) validations.push(date('date', '销售日期'));
  if (data.totalSales !== undefined) validations.push(number('totalSales', '销售金额', { min: 0 }));
  if (data.customerCount !== undefined) validations.push(integer('customerCount', '客户数量', { min: 0 }));
  if (data.paymentMethod !== undefined) validations.push(string('paymentMethod', '支付方式', { maxLength: 50 }));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));

  return validate(data, validations);
}

/**
 * 验证渠道创建数据
 * @param data 渠道创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateChannel(data: any): ValidationResult {
  return validate(data, [
    required('name', '渠道名称'),
    string('name', '渠道名称', { maxLength: 100, required: true }),
    string('type', '渠道类型', { maxLength: 50 }),
    string('contactPerson', '联系人', { maxLength: 100 }),
    string('phone', '电话', { maxLength: 50 }),
    string('email', '邮箱', { maxLength: 100 }),
    string('address', '地址', { maxLength: 200 }),
    number('commission', '佣金比例', { min: 0, max: 100 }),
    string('notes', '备注', { maxLength: 500 }),
  ]);
}

/**
 * 验证渠道更新数据
 * @param data 渠道更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateChannel(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '渠道名称', { maxLength: 100 }));
  if (data.type !== undefined) validations.push(string('type', '渠道类型', { maxLength: 50 }));
  if (data.contactPerson !== undefined) validations.push(string('contactPerson', '联系人', { maxLength: 100 }));
  if (data.phone !== undefined) validations.push(string('phone', '电话', { maxLength: 50 }));
  if (data.email !== undefined) validations.push(string('email', '邮箱', { maxLength: 100 }));
  if (data.address !== undefined) validations.push(string('address', '地址', { maxLength: 200 }));
  if (data.commission !== undefined) validations.push(number('commission', '佣金比例', { min: 0, max: 100 }));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));
  if (data.isActive !== undefined) validations.push(boolean('isActive', '是否启用'));

  return validate(data, validations);
}

/**
 * 验证渠道佣金更新数据
 * @param data 渠道佣金更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateChannelCommission(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.commissionAmount !== undefined) validations.push(number('commissionAmount', '佣金金额', { min: 0 }));
  if (data.status !== undefined) validations.push(string('status', '状态', { maxLength: 50 }));
  if (data.paymentDate !== undefined) validations.push(date('paymentDate', '支付日期'));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));

  return validate(data, validations);
}

/**
 * 验证采购订单创建数据
 * @param data 采购订单创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreatePurchaseOrder(data: any): ValidationResult {
  const validations = [
    required('supplierId', '供应商ID'),
    required('employeeId', '员工ID'),
    required('orderDate', '订单日期'),
    integer('supplierId', '供应商ID', { min: 1, required: true }),
    integer('employeeId', '员工ID', { min: 1, required: true }),
    date('orderDate', '订单日期', { required: true }),
    date('expectedDate', '预计到货日期'),
    string('status', '订单状态', { maxLength: 50 }),
    string('paymentStatus', '付款状态', { maxLength: 50 }),
    string('paymentMethod', '付款方式', { maxLength: 50 }),
    number('totalAmount', '订单总金额', { min: 0 }),
    number('paidAmount', '已付金额', { min: 0 }),
    string('notes', '备注', { maxLength: 500 }),
  ];

  // 验证订单项
  if (data.items && Array.isArray(data.items)) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.productId) {
        return { isValid: false, errors: [`订单项 #${i+1} 缺少产品ID`] };
      }
      if (!item.quantity || item.quantity <= 0) {
        return { isValid: false, errors: [`订单项 #${i+1} 数量必须大于0`] };
      }
      if (item.price === undefined || item.price < 0) {
        return { isValid: false, errors: [`订单项 #${i+1} 价格必须是非负数`] };
      }
    }
  } else {
    return { isValid: false, errors: ['订单项必须是数组'] };
  }

  return validate(data, validations);
}

/**
 * 验证采购订单更新数据
 * @param data 采购订单更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdatePurchaseOrder(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.supplierId !== undefined) validations.push(integer('supplierId', '供应商ID', { min: 1 }));
  if (data.employeeId !== undefined) validations.push(integer('employeeId', '员工ID', { min: 1 }));
  if (data.orderDate !== undefined) validations.push(date('orderDate', '订单日期'));
  if (data.expectedDate !== undefined) validations.push(date('expectedDate', '预计到货日期'));
  if (data.status !== undefined) validations.push(string('status', '订单状态', { maxLength: 50 }));
  if (data.paymentStatus !== undefined) validations.push(string('paymentStatus', '付款状态', { maxLength: 50 }));
  if (data.paymentMethod !== undefined) validations.push(string('paymentMethod', '付款方式', { maxLength: 50 }));
  if (data.totalAmount !== undefined) validations.push(number('totalAmount', '订单总金额', { min: 0 }));
  if (data.paidAmount !== undefined) validations.push(number('paidAmount', '已付金额', { min: 0 }));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));

  // 验证订单项
  if (data.items && Array.isArray(data.items)) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (item.productId !== undefined && (typeof item.productId !== 'number' || item.productId <= 0)) {
        return { isValid: false, errors: [`订单项 #${i+1} 产品ID必须是正整数`] };
      }
      if (item.quantity !== undefined && (typeof item.quantity !== 'number' || item.quantity <= 0)) {
        return { isValid: false, errors: [`订单项 #${i+1} 数量必须大于0`] };
      }
      if (item.price !== undefined && (typeof item.price !== 'number' || item.price < 0)) {
        return { isValid: false, errors: [`订单项 #${i+1} 价格必须是非负数`] };
      }
    }
  }

  return validate(data, validations);
}

/**
 * 验证供应商创建数据
 * @param data 供应商创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateSupplier(data: any): ValidationResult {
  return validate(data, [
    required('name', '供应商名称'),
    string('name', '供应商名称', { maxLength: 100, required: true }),
    string('contactPerson', '联系人', { maxLength: 100 }),
    string('phone', '电话', { maxLength: 50 }),
    string('email', '邮箱', { maxLength: 100 }),
    string('address', '地址', { maxLength: 200 }),
    string('description', '描述', { maxLength: 500 }),
    boolean('isActive', '是否启用'),
  ]);
}

/**
 * 验证供应商更新数据
 * @param data 供应商更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateSupplier(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '供应商名称', { maxLength: 100 }));
  if (data.contactPerson !== undefined) validations.push(string('contactPerson', '联系人', { maxLength: 100 }));
  if (data.phone !== undefined) validations.push(string('phone', '电话', { maxLength: 50 }));
  if (data.email !== undefined) validations.push(string('email', '邮箱', { maxLength: 100 }));
  if (data.address !== undefined) validations.push(string('address', '地址', { maxLength: 200 }));
  if (data.description !== undefined) validations.push(string('description', '描述', { maxLength: 500 }));
  if (data.isActive !== undefined) validations.push(boolean('isActive', '是否启用'));

  return validate(data, validations);
}

/**
 * 验证角色创建数据
 * @param data 角色创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateRole(data: any): ValidationResult {
  return validate(data, [
    required('name', '角色名称'),
    required('code', '角色代码'),
    string('name', '角色名称', { maxLength: 100, required: true }),
    string('code', '角色代码', { maxLength: 50, required: true }),
    string('description', '角色描述', { maxLength: 500 }),
  ]);
}

/**
 * 验证角色更新数据
 * @param data 角色更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateRole(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '角色名称', { maxLength: 100 }));
  if (data.code !== undefined) validations.push(string('code', '角色代码', { maxLength: 50 }));
  if (data.description !== undefined) validations.push(string('description', '角色描述', { maxLength: 500 }));

  return validate(data, validations);
}

/**
 * 验证用户创建数据
 * @param data 用户创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateUser(data: any): ValidationResult {
  return validate(data, [
    required('name', '用户名'),
    required('email', '邮箱'),
    required('password', '密码'),
    string('name', '用户名', { maxLength: 100, required: true }),
    string('email', '邮箱', { maxLength: 100, required: true }),
    string('password', '密码', { minLength: 6, maxLength: 100, required: true }),
    string('role', '角色', { maxLength: 50 }),
  ]);
}

/**
 * 验证用户更新数据
 * @param data 用户更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateUser(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '用户名', { maxLength: 100 }));
  if (data.email !== undefined) validations.push(string('email', '邮箱', { maxLength: 100 }));
  if (data.password !== undefined) validations.push(string('password', '密码', { minLength: 6, maxLength: 100 }));
  if (data.role !== undefined) validations.push(string('role', '角色', { maxLength: 50 }));

  return validate(data, validations);
}

/**
 * 验证用户角色更新数据
 * @param data 用户角色更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateUserRoles(data: any): ValidationResult {
  return validate(data, [
    required('roleIds', '角色ID列表'),
    array('roleIds', '角色ID列表', { required: true }),
  ]);
}

/**
 * 验证用户个人资料更新数据
 * @param data 用户个人资料更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateUserProfile(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '用户名', { maxLength: 100 }));
  if (data.email !== undefined) validations.push(string('email', '邮箱', { maxLength: 100 }));

  return validate(data, validations);
}

/**
 * 验证用户密码更新数据
 * @param data 用户密码更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateUserPassword(data: any): ValidationResult {
  return validate(data, [
    required('currentPassword', '当前密码'),
    required('newPassword', '新密码'),
    required('confirmPassword', '确认密码'),
    string('currentPassword', '当前密码', { minLength: 6, maxLength: 100, required: true }),
    string('newPassword', '新密码', { minLength: 6, maxLength: 100, required: true }),
    string('confirmPassword', '确认密码', { minLength: 6, maxLength: 100, required: true }),
  ]);
}

/**
 * 验证系统设置更新数据
 * @param data 系统设置更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateSystemSettings(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.companyName !== undefined) validations.push(string('companyName', '公司名称', { maxLength: 100 }));
  if (data.coffeeSalesCommissionRate !== undefined) validations.push(number('coffeeSalesCommissionRate', '咖啡厅销售提成比例', { min: 0, max: 100 }));
  if (data.gallerySalesCommissionRate !== undefined) validations.push(number('gallerySalesCommissionRate', '珐琅馆销售提成比例', { min: 0, max: 100 }));
  if (data.teacherWorkshopFee !== undefined) validations.push(number('teacherWorkshopFee', '讲师工作坊费用', { min: 0 }));
  if (data.assistantWorkshopFee !== undefined) validations.push(number('assistantWorkshopFee', '助理工作坊费用', { min: 0 }));
  if (data.teacherWorkshopFeeOutside !== undefined) validations.push(number('teacherWorkshopFeeOutside', '讲师工作坊费用（外部）', { min: 0 }));
  if (data.assistantWorkshopFeeOutside !== undefined) validations.push(number('assistantWorkshopFeeOutside', '助理工作坊费用（外部）', { min: 0 }));
  if (data.teacherWorkshopFeeInside !== undefined) validations.push(number('teacherWorkshopFeeInside', '讲师工作坊费用（内部）', { min: 0 }));
  if (data.assistantWorkshopFeeInside !== undefined) validations.push(number('assistantWorkshopFeeInside', '助理工作坊费用（内部）', { min: 0 }));
  if (data.enableImageUpload !== undefined) validations.push(boolean('enableImageUpload', '启用图片上传'));
  if (data.enableNotifications !== undefined) validations.push(boolean('enableNotifications', '启用通知'));
  if (data.basicWorkingHours !== undefined) validations.push(number('basicWorkingHours', '基本工作时间', { min: 0 }));
  if (data.basicWorkingDays !== undefined) validations.push(integer('basicWorkingDays', '基本工作天数', { min: 0 }));
  if (data.overtimeRate !== undefined) validations.push(number('overtimeRate', '加班费率', { min: 0 }));
  if (data.weekendOvertimeRate !== undefined) validations.push(number('weekendOvertimeRate', '周末加班费率', { min: 0 }));
  if (data.holidayOvertimeRate !== undefined) validations.push(number('holidayOvertimeRate', '节假日加班费率', { min: 0 }));
  if (data.socialInsuranceRate !== undefined) validations.push(number('socialInsuranceRate', '社保费率', { min: 0, max: 100 }));
  if (data.taxRate !== undefined) validations.push(number('taxRate', '税率', { min: 0, max: 100 }));

  return validate(data, validations);
}

/**
 * 验证系统日志创建数据
 * @param data 系统日志创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateSystemLog(data: any): ValidationResult {
  return validate(data, [
    required('level', '日志级别'),
    required('module', '模块'),
    required('message', '消息'),
    string('level', '日志级别', { maxLength: 50, required: true }),
    string('module', '模块', { maxLength: 50, required: true }),
    string('message', '消息', { maxLength: 500, required: true }),
    string('details', '详情', { maxLength: 5000 }),
    string('userId', '用户ID', { maxLength: 100 }),
  ]);
}

/**
 * 验证用户登录记录创建数据
 * @param data 用户登录记录创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUserLoginRecord(data: any): ValidationResult {
  return validate(data, [
    required('userId', '用户ID'),
    required('ipAddress', 'IP地址'),
    required('userAgent', '用户代理'),
    string('userId', '用户ID', { maxLength: 100, required: true }),
    string('ipAddress', 'IP地址', { maxLength: 100, required: true }),
    string('userAgent', '用户代理', { maxLength: 500, required: true }),
  ]);
}

/**
 * 验证日程创建数据
 * @param data 日程创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateSchedule(data: any): ValidationResult {
  return validate(data, [
    required('employeeId', '员工ID'),
    required('date', '日期'),
    string('employeeId', '员工ID', { required: true }),
    date('date', '日期', { required: true }),
    string('startTime', '开始时间', { maxLength: 50 }),
    string('endTime', '结束时间', { maxLength: 50 }),
    boolean('checkConflict', '检查冲突'),
  ]);
}

/**
 * 验证日程更新数据
 * @param data 日程更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateSchedule(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.employeeId !== undefined) validations.push(string('employeeId', '员工ID'));
  if (data.date !== undefined) validations.push(date('date', '日期'));
  if (data.startTime !== undefined) validations.push(string('startTime', '开始时间', { maxLength: 50 }));
  if (data.endTime !== undefined) validations.push(string('endTime', '结束时间', { maxLength: 50 }));
  if (data.checkConflict !== undefined) validations.push(boolean('checkConflict', '检查冲突'));

  return validate(data, validations);
}

/**
 * 验证批量创建日程数据
 * @param data 批量创建日程数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateBatchCreateSchedules(data: any): ValidationResult {
  return validate(data, [
    required('employeeIds', '员工ID列表'),
    required('dates', '日期列表'),
    array('employeeIds', '员工ID列表', { required: true }),
    array('dates', '日期列表', { required: true }),
    string('startTime', '开始时间', { maxLength: 50 }),
    string('endTime', '结束时间', { maxLength: 50 }),
    boolean('checkConflict', '检查冲突'),
  ]);
}

/**
 * 注意：validateUpdateCustomer 函数已在第674行定义，此处为重复定义，已移除
 */

/**
 * 验证订单创建数据
 * @param data 订单创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateOrder(data: any): ValidationResult {
  const validations = [
    required('customerId', '客户ID'),
    required('employeeId', '员工ID'),
    required('orderDate', '订单日期'),
    required('totalAmount', '订单总金额'),
    required('items', '订单项'),
    integer('customerId', '客户ID', { min: 1, required: true }),
    integer('employeeId', '员工ID', { min: 1, required: true }),
    date('orderDate', '订单日期', { required: true }),
    number('totalAmount', '订单总金额', { min: 0, required: true }),
    number('paidAmount', '已付金额', { min: 0 }),
    string('paymentStatus', '支付状态', { maxLength: 50 }),
    string('paymentMethod', '支付方式', { maxLength: 50 }),
    string('notes', '备注', { maxLength: 500 }),
  ];

  // 验证订单项
  if (data.items && Array.isArray(data.items)) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.productId) {
        return { isValid: false, errors: [`订单项 #${i+1} 缺少产品ID`] };
      }
      if (!item.quantity || item.quantity <= 0) {
        return { isValid: false, errors: [`订单项 #${i+1} 数量必须大于0`] };
      }
      if (item.price === undefined || item.price < 0) {
        return { isValid: false, errors: [`订单项 #${i+1} 价格必须是非负数`] };
      }
    }
  } else {
    return { isValid: false, errors: ['订单项必须是数组'] };
  }

  return validate(data, validations);
}

/**
 * 验证订单更新数据
 * @param data 订单更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateOrder(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.customerId !== undefined) validations.push(integer('customerId', '客户ID', { min: 1 }));
  if (data.employeeId !== undefined) validations.push(integer('employeeId', '员工ID', { min: 1 }));
  if (data.orderDate !== undefined) validations.push(date('orderDate', '订单日期'));
  if (data.totalAmount !== undefined) validations.push(number('totalAmount', '订单总金额', { min: 0 }));
  if (data.paidAmount !== undefined) validations.push(number('paidAmount', '已付金额', { min: 0 }));
  if (data.paymentStatus !== undefined) validations.push(string('paymentStatus', '支付状态', { maxLength: 50 }));
  if (data.paymentMethod !== undefined) validations.push(string('paymentMethod', '支付方式', { maxLength: 50 }));
  if (data.notes !== undefined) validations.push(string('notes', '备注', { maxLength: 500 }));

  // 验证订单项
  if (data.items && Array.isArray(data.items)) {
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (item.productId !== undefined && (typeof item.productId !== 'number' || item.productId <= 0)) {
        return { isValid: false, errors: [`订单项 #${i+1} 产品ID必须是正整数`] };
      }
      if (item.quantity !== undefined && (typeof item.quantity !== 'number' || item.quantity <= 0)) {
        return { isValid: false, errors: [`订单项 #${i+1} 数量必须大于0`] };
      }
      if (item.price !== undefined && (typeof item.price !== 'number' || item.price < 0)) {
        return { isValid: false, errors: [`订单项 #${i+1} 价格必须是非负数`] };
      }
    }
  }

  return validate(data, validations);
}

/**
 * 验证作品创建数据
 * @param data 作品创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateArtwork(data: any): ValidationResult {
  return validate(data, [
    required('name', '作品名称'),
    number('price', '作品价格', { min: 0, required: true }),
    number('commissionRate', '佣金率', { min: 0, max: 100 }),
    number('cost', '成本', { min: 0 }),
    integer('categoryId', '分类ID', { min: 1 }),
    integer('inventory', '库存', { min: 0 }),
    string('name', '作品名称', { maxLength: 100, required: true }),
    string('description', '作品描述', { maxLength: 1000 }),
    string('sku', 'SKU', { maxLength: 50 }),
    string('barcode', '条形码', { maxLength: 50 }),
    string('unit', '单位', { maxLength: 20 }),
    string('material', '材料', { maxLength: 50 }),
  ]);
}

/**
 * 验证作品更新数据
 * @param data 作品更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateArtwork(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '作品名称', { maxLength: 100 }));
  if (data.price !== undefined) validations.push(number('price', '作品价格', { min: 0 }));
  if (data.commissionRate !== undefined) validations.push(number('commissionRate', '佣金率', { min: 0, max: 100 }));
  if (data.cost !== undefined) validations.push(number('cost', '成本', { min: 0 }));
  if (data.categoryId !== undefined) validations.push(integer('categoryId', '分类ID', { min: 1 }));
  if (data.inventory !== undefined) validations.push(integer('inventory', '库存', { min: 0 }));
  if (data.description !== undefined) validations.push(string('description', '作品描述', { maxLength: 1000 }));
  if (data.sku !== undefined) validations.push(string('sku', 'SKU', { maxLength: 50 }));
  if (data.barcode !== undefined) validations.push(string('barcode', '条形码', { maxLength: 50 }));
  if (data.unit !== undefined) validations.push(string('unit', '单位', { maxLength: 20 }));
  if (data.material !== undefined) validations.push(string('material', '材料', { maxLength: 50 }));

  return validate(data, validations);
}

/**
 * 验证作品分类创建数据
 * @param data 作品分类创建数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateCreateArtworkCategory(data: any): ValidationResult {
  return validate(data, [
    required('name', '分类名称'),
    string('name', '分类名称', { maxLength: 50, required: true }),
    string('code', '分类代码', { maxLength: 20 }),
    string('description', '分类描述', { maxLength: 500 }),
    integer('parentId', '父分类ID', { min: 1 }),
    integer('sortOrder', '排序', { min: 0 }),
    boolean('isActive', '是否启用'),
  ]);
}

/**
 * 验证作品分类更新数据
 * @param data 作品分类更新数据
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateUpdateArtworkCategory(data: any): ValidationResult {
  const validations = [];

  // 只验证提供的字段
  if (data.name !== undefined) validations.push(string('name', '分类名称', { maxLength: 50 }));
  if (data.code !== undefined) validations.push(string('code', '分类代码', { maxLength: 20 }));
  if (data.description !== undefined) validations.push(string('description', '分类描述', { maxLength: 500 }));
  if (data.parentId !== undefined) validations.push(integer('parentId', '父分类ID', { min: 1 }));
  if (data.sortOrder !== undefined) validations.push(integer('sortOrder', '排序', { min: 0 }));
  if (data.isActive !== undefined) validations.push(boolean('isActive', '是否启用'));

  return validate(data, validations);
}