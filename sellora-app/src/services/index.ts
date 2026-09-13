/**
 * Sellora services barrel — exports all backend service modules.
 * All mock implementations have been removed. Every service calls the real API.
 */

// Auth infrastructure
export { api, tokenStorage, ApiError }   from './api'

// Domain services
export { businessService }               from './businessService'
export { productService, categoryService } from './productService'
export { inventoryService, customerService, orderService, analyticsService, financesService, messagesService } from './remainingServices'
export { storefrontService }             from './storefrontService'
export { uploadService }                 from './uploadService'
export { plansService }                  from './plansService'
