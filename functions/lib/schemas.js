"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifyRequestSchema = void 0;
const zod_1 = require("zod");
exports.IdentifyRequestSchema = zod_1.z.object({
    image_data_urls: zod_1.z.array(zod_1.z.string()).optional(),
    image_urls: zod_1.z.array(zod_1.z.string()).optional(),
    location_hint: zod_1.z.string().optional(),
    context_notes: zod_1.z.string().optional(),
    user_goal: zod_1.z.string().optional(),
    session_context: zod_1.z.any().optional(),
    system_prompt: zod_1.z.string().optional(),
    output_schema: zod_1.z.any().optional(),
    provider: zod_1.z.string().optional(),
    temperature: zod_1.z.number().optional(),
});
//# sourceMappingURL=schemas.js.map