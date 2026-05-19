import { defineCollection, z } from '@nuxt/content'

export const collections = {
  blog: defineCollection({
    type: 'page',
    source: 'blog/*.md',
    schema: z.object({
      title: z.string(),
      description: z.string(),
      date: z.string(),
      tags: z.array(z.string()),
      image: z.string().optional(),
      playlist: z.string().optional(),
      playlist_order: z.number().optional(),
    }),
  }),
}
