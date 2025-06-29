import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
    myAction: defineAction({ /* ... */ })
}