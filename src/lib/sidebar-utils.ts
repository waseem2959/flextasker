/**
 * Sidebar Utilities
 */

import { createContext, useContext } from "react";
import { create } from "zustand";

// Constants for sidebar configuration
export const SIDEBAR_COOKIE_NAME = "sidebar-state"
export const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year
export const SIDEBAR_WIDTH = 256
export const SIDEBAR_WIDTH_ICON = 64
export const SIDEBAR_WIDTH_MOBILE = 280
export const SIDEBAR_KEYBOARD_SHORTCUT = "meta+b"

// Enhanced sidebar store type with mobile state handling
export type SidebarStore = {
  isOpen: boolean
  isMobile: boolean
  state: string
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  toggle: () => void
  toggleSidebar: () => void
  close: () => void
  open: () => void
}

// Create the store with Zustand
export const SidebarContext = create<SidebarStore>((set) => ({
  isOpen: false,
  isMobile: false,
  state: "closed",
  openMobile: false,
  setOpenMobile: (open) => set({ openMobile: open }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
  open: () => set({ isOpen: true }),
}))

// React context for Sidebar
export const SidebarReactContext = createContext<SidebarStore | null>(null);
export const SidebarProvider = SidebarReactContext.Provider;
export const useSidebarContext = () => {
  const context = useContext(SidebarReactContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
};

// Use the Zustand store directly, not as React Context
export const useSidebar = () => SidebarContext();

export default {
  SidebarContext,
  useSidebar,
  SidebarReactContext,
  SidebarProvider,
  useSidebarContext
}
