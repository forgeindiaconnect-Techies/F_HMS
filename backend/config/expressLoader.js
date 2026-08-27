import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const express = require('express');

// Export express router factory for route files
export const Router = express.Router;
export default express;
