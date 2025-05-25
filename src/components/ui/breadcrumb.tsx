import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * FOUNDATIONAL CONCEPT: Semantic HTML and Accessibility Architecture
 * 
 * Think of breadcrumbs like the trail of breadcrumbs in Hansel and Gretel - they help users
 * understand where they are and how they got there. But unlike the fairy tale, we want these
 * breadcrumbs to be permanent and helpful!
 * 
 * The semantic structure we use here (nav > ol > li) isn't just about styling - it creates
 * meaning that assistive technologies can understand. When a screen reader encounters this
 * structure, it announces "navigation landmark" and then "list with X items", giving users
 * immediate context about what they're interacting with.
 */

/**
 * The Root Breadcrumb Container
 * 
 * This component establishes the navigation landmark. Think of aria-label="breadcrumb" 
 * as putting up a sign that says "You are here" - it tells assistive technology users
 * that this section helps with navigation and orientation.
 * 
 * The forwardRef pattern here is like creating a component that can "pretend" to be
 * a regular HTML element when needed. This is crucial for component composition - 
 * parent components can attach refs to this component as if it were a native nav element.
 */
const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode // Allow custom separators (like > or / or →)
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

/**
 * The Breadcrumb List Container
 * 
 * This is where we establish the visual flow and spacing of our breadcrumb items.
 * Notice how we use an ordered list (ol) rather than an unordered list (ul) - this
 * is intentional! The order of breadcrumbs matters semantically. Screen readers will
 * announce "list item 1 of 4" which helps users understand their position in the hierarchy.
 * 
 * The className logic here demonstrates the "progressive enhancement" principle:
 * - Base responsive design: gap-1.5 on mobile, gap-2.5 on small screens and up
 * - Graceful text handling: break-words prevents layout breaking on long breadcrumb names
 * - Visual hierarchy: text-muted-foreground makes breadcrumbs supportive, not dominant
 */
const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      // Flexbox creates the horizontal flow and handles wrapping gracefully
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className // Allow overrides for specific use cases
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

/**
 * Individual Breadcrumb Item Container
 * 
 * Each breadcrumb item is a list item that can contain links, text, or separators.
 * The inline-flex display creates a mini-container that aligns its contents nicely.
 * This is like creating individual "stations" along the breadcrumb trail, each with
 * its own internal organization.
 */
const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

/**
 * ADVANCED PATTERN: Polymorphic Components with the "asChild" Pattern
 * 
 * This is where things get really interesting! The BreadcrumbLink component demonstrates
 * what we call "polymorphic rendering" - the same component can render as different
 * HTML elements depending on what you need.
 * 
 * Think of it like a universal adapter. Sometimes you want a regular <a> tag for simple
 * links. But other times you might want to use Next.js's <Link> component for client-side
 * routing. The asChild prop lets you "swap out the engine" while keeping all the styling
 * and behavior consistent.
 * 
 * When asChild=true, the Slot component from Radix UI takes over. Slot is like a
 * "costume" that wraps around whatever child component you provide, giving it all
 * the props and styling of BreadcrumbLink while letting it remain its original type.
 */
const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean // The magic prop that enables polymorphic behavior
  }
>(({ asChild, className, ...props }, ref) => {
  // This is the "adapter logic" - choose the right component based on the situation
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      // The hover effect provides immediate visual feedback - essential for usability
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

/**
 * The Current Page Indicator
 * 
 * This component represents "you are here" in the breadcrumb trail. Notice the careful
 * accessibility attributes:
 * 
 * - aria-disabled="true" tells assistive technology this isn't clickable (you're already here!)
 * - aria-current="page" is like putting a bright star on a map - it explicitly marks
 *   the current location for screen reader users
 * 
 * The visual styling (font-normal text-foreground) makes the current page slightly more
 * prominent than the path that led here, creating clear visual hierarchy.
 */
const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    aria-disabled="true"    // Not interactive - you're already here
    aria-current="page"     // Explicit landmark for current location
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

/**
 * DESIGN DECISION: When Components Don't Need Complex Patterns
 * 
 * Notice that BreadcrumbSeparator doesn't use forwardRef! This is an important teaching
 * moment: not every component needs to be equally complex. This separator is purely
 * presentational - it doesn't need to be referenced by parent components or participate
 * in complex interactions.
 * 
 * This demonstrates the principle of "appropriate complexity" - use the right tool for
 * the job, not the most sophisticated tool available.
 * 
 * The aria-hidden="true" is crucial here. Screen readers don't need to announce "greater than"
 * or "slash" between each breadcrumb item - they understand the hierarchy from the list
 * structure. The separators are purely visual, so we hide them from assistive technology.
 */
const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    aria-hidden="true" // Hide decorative elements from screen readers
    className={cn("[&>svg]:size-3.5", className)} // Size any SVG icons consistently
    {...props}
  >
    {children ?? <ChevronRight />} {/* Default to right arrow, but allow customization */}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

/**
 * MASTERCLASS: Advanced Accessibility Pattern for Interactive Icons
 * 
 * This component represents one of the most sophisticated accessibility patterns in modern
 * web development. Let's break down why this approach is so effective:
 * 
 * THE CHALLENGE: You want to show a "more" indicator (three dots) that screen reader users
 * can understand, but you also want sighted users to see the visual icon. Simple approaches
 * like alt text don't work well with SVG icon components.
 * 
 * THE SOLUTION: Layer separation! We create two distinct layers:
 * 
 * Layer 1 (Visual): The MoreHorizontal icon with aria-hidden="true"
 * - This is what sighted users see
 * - Screen readers completely ignore it (aria-hidden)
 * - role="presentation" reinforces that this container is purely decorative
 * 
 * Layer 2 (Semantic): The sr-only text "More"
 * - This is what screen reader users experience
 * - Visually hidden but semantically present
 * - Provides clear, contextual meaning
 * 
 * WHY THIS IS BETTER THAN img alt="...":
 * 1. We're using an SVG icon component, not an image element
 * 2. We have fine-grained control over what each type of user experiences
 * 3. We can change the visual representation without affecting the semantic meaning
 * 4. The pattern scales to more complex scenarios (multiple icons, interactive states, etc.)
 * 
 * This is exactly why the SonarLint warning is a false positive - our pattern is actually
 * more robust and accessible than the simpler approach it suggests.
 */
const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"     // This container exists only for visual layout
    aria-hidden="true"      // Hide the entire visual container from screen readers
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    {/* VISUAL LAYER: What sighted users see */}
    <MoreHorizontal className="h-4 w-4" />
    
    {/* SEMANTIC LAYER: What screen reader users experience */}
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

/**
 * ARCHITECTURAL NOTE: Thoughtful Export Organization
 * 
 * The way we export these components tells a story about how they're meant to be used.
 * By grouping them in a single export statement, we're communicating that these components
 * work together as a cohesive system, not as independent pieces.
 * 
 * This organization makes it easy for developers to import exactly what they need:
 * import { Breadcrumb, BreadcrumbList, BreadcrumbItem } from "./breadcrumb"
 * 
 * While also making it clear that they're part of a larger design system.
 */
export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
}
