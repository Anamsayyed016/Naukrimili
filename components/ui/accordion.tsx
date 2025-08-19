"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

// Minimal unstyled primitives to restore type safety.
export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = AccordionPrimitive.Item;
export const AccordionTrigger = AccordionPrimitive.Trigger;
export const AccordionContent = AccordionPrimitive.Content;

export default Accordion;
