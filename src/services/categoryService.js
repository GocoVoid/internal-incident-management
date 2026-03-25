/**
 * categoryService.js
 *
 * Categories are a DB table (not a hardcoded enum).
 * Schema: id, category_name, department_name
 *
 * Frontend must fetch these on app init / create-ticket open.
 */

import { get, post, put, del } from './apiClient';

/**
 * GET /categories
 * Returns: [{ id, categoryName, departmentName }]
 * Used to populate: Create Ticket dropdown, Recategorize dropdown, filter selects
 */
export const getCategories = () =>
  get('/admin/categories');

/**
 * POST /categories   (ADMIN only)
 * Body: { categoryName, departmentName }
 */
export const createCategory = (data) =>
  post('/admin/categories', data);

/**
 * PUT /categories/:id   (ADMIN only)
 * Body: { categoryName, departmentName }
 */
export const updateCategory = (id, data) =>
  put(`/admin/categories/${id}`, data);

/**
 * DELETE /categories/:id   (ADMIN only)
 */
export const deleteCategory = (id) =>
  del(`/admin/categories/${id}`);
