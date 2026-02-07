import { Router } from 'express';
import { createTemplate, getTemplates, updateTemplate, deleteTemplate } from '../controllers/template.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createTemplate);
router.get('/', getTemplates);
router.put('/:id', updateTemplate);
router.delete('/:id', deleteTemplate);

export const templateRoutes = router;
