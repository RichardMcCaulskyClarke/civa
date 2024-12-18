import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

export const ImageSchema = z.object({
  src: z.string(),
  width: z.number(),
  height: z.number(),
});

export const OverlaySchema = z.object({
  uid: z.string().optional(),
  id: z.string().optional(),
  class: z.string().optional(),
  type: z.enum(['hotspot','toggle']).default('hotspot'),
  top: z.number().default(45),
  left: z.number().default(45),
  width: z.number().default(45),
  height: z.number().default(45),
  target: z.string().default(''),
});

export const LayerSchema = z.object({
  uid: z.string().optional(),
  id: z.string().optional(),
  level: z.number().default(1),
  image: ImageSchema.optional(),
  overlays: z.array(OverlaySchema).optional(),
  display: z.boolean().default(true)
})

export const SlideSchema = z.object({
  uid: z.string(),
  id: z.string().optional(),
  order: z.number().optional(),
  image: ImageSchema.optional(),
  layers: z.array(LayerSchema).optional(),
  template: z.string().optional()
});


export type ImageType = z.infer<typeof ImageSchema>;
export type OverlayType = z.infer<typeof OverlaySchema>;
export type LayerType = z.infer<typeof LayerSchema>;
export type SlideType = z.infer<typeof SlideSchema>;

export const collections = {
  slide: defineCollection({
    loader: glob({ pattern: '**/*.json', base: './src/content/slide' }),
    schema: SlideSchema,
  })
};