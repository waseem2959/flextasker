/**
 * ARIA Service
 * 
 * Comprehensive ARIA labeling service with internationalization support for UAE launch.
 * Provides standardized ARIA attributes, descriptions, and announcements across the application.
 * 
 * Features:
 * - Multi-language ARIA labels (Arabic/English)
 * - Context-aware announcements
 * - Live region management
 * - Role and state management
 * - Screen reader optimization
 */

import { i18nService } from './i18n-service';

export interface AriaConfig {
  role?: string;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  pressed?: boolean;
  checked?: boolean | 'mixed';
  selected?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  readonly?: boolean;
  multiline?: boolean;
  autocomplete?: string;
  hasPopup?: boolean | 'false' | 'true' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  controls?: string;
  owns?: string;
  flowTo?: string;
  live?: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  busy?: boolean;
  hidden?: boolean;
  level?: number;
  valueNow?: number;
  valueMin?: number;
  valueMax?: number;
  valueText?: string;
  orientation?: 'horizontal' | 'vertical';
  sort?: 'none' | 'ascending' | 'descending' | 'other';
  colCount?: number;
  rowCount?: number;
  colIndex?: number;
  rowIndex?: number;
  colSpan?: number;
  rowSpan?: number;
  current?: boolean | 'false' | 'true' | 'page' | 'step' | 'location' | 'date' | 'time';
  setSize?: number;
  posInSet?: number;
}

export interface LiveRegionConfig {
  id: string;
  politeness: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: string;
}

class AriaService {
  private liveRegions: Map<string, HTMLElement> = new Map();
  private announceQueue: Array<{ message: string; priority: 'low' | 'medium' | 'high' }> = [];
  private isProcessingQueue = false;

  /**
   * Initialize ARIA service and create live regions
   */
  initialize(): void {
    this.createLiveRegions();
  }

  /**
   * Create standard live regions for announcements
   */
  private createLiveRegions(): void {
    const regions: LiveRegionConfig[] = [
      {
        id: 'aria-live-polite',
        politeness: 'polite',
        atomic: true,
        relevant: 'additions text'
      },
      {
        id: 'aria-live-assertive',
        politeness: 'assertive',
        atomic: true,
        relevant: 'additions text'
      }
    ];

    regions.forEach(config => {
      let region = document.getElementById(config.id);
      
      if (!region) {
        region = document.createElement('div');
        region.id = config.id;
        region.className = 'sr-only';
        region.setAttribute('aria-live', config.politeness);
        region.setAttribute('aria-atomic', config.atomic ? 'true' : 'false');
        region.setAttribute('aria-relevant', config.relevant || 'additions text');
        document.body.appendChild(region);
      }
      
      this.liveRegions.set(config.id, region);
    });
  }

  /**
   * Generate comprehensive ARIA attributes from config
   */
  generateAriaAttributes(config: AriaConfig): Record<string, string> {
    const attrs: Record<string, string> = {};

    // Role
    if (config.role) {
      attrs.role = config.role;
    }

    // Labels and descriptions
    if (config.label) {
      attrs['aria-label'] = i18nService.translate(config.label);
    }
    if (config.labelledBy) {
      attrs['aria-labelledby'] = config.labelledBy;
    }
    if (config.describedBy) {
      attrs['aria-describedby'] = config.describedBy;
    }

    // States
    if (config.expanded !== undefined) {
      attrs['aria-expanded'] = config.expanded.toString();
    }
    if (config.pressed !== undefined) {
      attrs['aria-pressed'] = config.pressed.toString();
    }
    if (config.checked !== undefined) {
      attrs['aria-checked'] = config.checked.toString();
    }
    if (config.selected !== undefined) {
      attrs['aria-selected'] = config.selected.toString();
    }
    if (config.disabled !== undefined) {
      attrs['aria-disabled'] = config.disabled.toString();
    }
    if (config.invalid !== undefined) {
      attrs['aria-invalid'] = config.invalid.toString();
    }
    if (config.required !== undefined) {
      attrs['aria-required'] = config.required.toString();
    }
    if (config.readonly !== undefined) {
      attrs['aria-readonly'] = config.readonly.toString();
    }
    if (config.multiline !== undefined) {
      attrs['aria-multiline'] = config.multiline.toString();
    }
    if (config.hidden !== undefined) {
      attrs['aria-hidden'] = config.hidden.toString();
    }
    if (config.busy !== undefined) {
      attrs['aria-busy'] = config.busy.toString();
    }

    // Properties
    if (config.autocomplete) {
      attrs['aria-autocomplete'] = config.autocomplete;
    }
    if (config.hasPopup !== undefined) {
      attrs['aria-haspopup'] = config.hasPopup.toString();
    }
    if (config.controls) {
      attrs['aria-controls'] = config.controls;
    }
    if (config.owns) {
      attrs['aria-owns'] = config.owns;
    }
    if (config.flowTo) {
      attrs['aria-flowto'] = config.flowTo;
    }

    // Live region properties
    if (config.live) {
      attrs['aria-live'] = config.live;
    }
    if (config.atomic !== undefined) {
      attrs['aria-atomic'] = config.atomic.toString();
    }
    if (config.relevant) {
      attrs['aria-relevant'] = config.relevant;
    }

    // Numeric values
    if (config.level !== undefined) {
      attrs['aria-level'] = config.level.toString();
    }
    if (config.valueNow !== undefined) {
      attrs['aria-valuenow'] = config.valueNow.toString();
    }
    if (config.valueMin !== undefined) {
      attrs['aria-valuemin'] = config.valueMin.toString();
    }
    if (config.valueMax !== undefined) {
      attrs['aria-valuemax'] = config.valueMax.toString();
    }
    if (config.valueText) {
      attrs['aria-valuetext'] = config.valueText;
    }

    // Layout properties
    if (config.orientation) {
      attrs['aria-orientation'] = config.orientation;
    }
    if (config.sort) {
      attrs['aria-sort'] = config.sort;
    }

    // Grid/table properties
    if (config.colCount !== undefined) {
      attrs['aria-colcount'] = config.colCount.toString();
    }
    if (config.rowCount !== undefined) {
      attrs['aria-rowcount'] = config.rowCount.toString();
    }
    if (config.colIndex !== undefined) {
      attrs['aria-colindex'] = config.colIndex.toString();
    }
    if (config.rowIndex !== undefined) {
      attrs['aria-rowindex'] = config.rowIndex.toString();
    }
    if (config.colSpan !== undefined) {
      attrs['aria-colspan'] = config.colSpan.toString();
    }
    if (config.rowSpan !== undefined) {
      attrs['aria-rowspan'] = config.rowSpan.toString();
    }

    // Navigation properties
    if (config.current !== undefined) {
      attrs['aria-current'] = config.current.toString();
    }
    if (config.setSize !== undefined) {
      attrs['aria-setsize'] = config.setSize.toString();
    }
    if (config.posInSet !== undefined) {
      attrs['aria-posinset'] = config.posInSet.toString();
    }

    return attrs;
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string, priority: 'low' | 'medium' | 'high' = 'medium'): void {
    this.announceQueue.push({ message, priority });
    
    if (!this.isProcessingQueue) {
      this.processAnnounceQueue();
    }
  }

  /**
   * Process announcement queue with proper timing
   */
  private async processAnnounceQueue(): Promise<void> {
    if (this.isProcessingQueue || this.announceQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.announceQueue.length > 0) {
      // Sort by priority (high first)
      this.announceQueue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      const announcement = this.announceQueue.shift();
      if (!announcement) continue;

      const regionId = announcement.priority === 'high' 
        ? 'aria-live-assertive' 
        : 'aria-live-polite';
      
      const region = this.liveRegions.get(regionId);
      if (region) {
        // Clear previous content
        region.textContent = '';
        
        // Small delay to ensure screen readers notice the change
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Set new content
        region.textContent = i18nService.translate(announcement.message);
        
        // Wait before processing next announcement
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Create accessible form field configuration
   */
  createFormFieldAria(config: {
    id: string;
    label: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    invalid?: boolean;
  }): {
    input: Record<string, string>;
    label: Record<string, string>;
    error?: Record<string, string>;
    helper?: Record<string, string>;
  } {
    const labelId = `${config.id}-label`;
    const errorId = `${config.id}-error`;
    const helperId = `${config.id}-helper`;

    const describedBy = [
      config.error ? errorId : null,
      config.helperText ? helperId : null
    ].filter(Boolean).join(' ');

    return {
      input: {
        id: config.id,
        'aria-labelledby': labelId,
        ...(describedBy && { 'aria-describedby': describedBy }),
        'aria-invalid': config.invalid ? 'true' : 'false',
        'aria-required': config.required ? 'true' : 'false'
      },
      label: {
        id: labelId,
        htmlFor: config.id
      },
      error: config.error ? {
        id: errorId,
        role: 'alert',
        'aria-live': 'polite'
      } : undefined,
      helper: config.helperText ? {
        id: helperId
      } : undefined
    };
  }

  /**
   * Create accessible button configuration
   */
  createButtonAria(config: {
    label?: string;
    describedBy?: string;
    pressed?: boolean;
    expanded?: boolean;
    hasPopup?: boolean;
    controls?: string;
    disabled?: boolean;
    loading?: boolean;
  }): Record<string, string> {
    const ariaConfig: AriaConfig = {
      label: config.label,
      describedBy: config.describedBy,
      pressed: config.pressed,
      expanded: config.expanded,
      hasPopup: config.hasPopup,
      controls: config.controls,
      disabled: config.disabled,
      busy: config.loading
    };

    if (config.loading) {
      ariaConfig.live = 'polite';
    }

    return this.generateAriaAttributes(ariaConfig);
  }

  /**
   * Create accessible navigation configuration
   */
  createNavigationAria(config: {
    label: string;
    current?: boolean;
    expanded?: boolean;
    hasSubmenu?: boolean;
    level?: number;
    setSize?: number;
    posInSet?: number;
  }): Record<string, string> {
    const ariaConfig: AriaConfig = {
      label: config.label,
      current: config.current,
      expanded: config.expanded,
      hasPopup: config.hasSubmenu ? 'menu' : undefined,
      level: config.level,
      setSize: config.setSize,
      posInSet: config.posInSet
    };

    return this.generateAriaAttributes(ariaConfig);
  }

  /**
   * Create accessible table configuration
   */
  createTableAria(config: {
    caption?: string;
    rowCount?: number;
    colCount?: number;
    sortable?: boolean;
    sortColumn?: number;
    sortDirection?: 'ascending' | 'descending';
  }): {
    table: Record<string, string>;
    caption?: Record<string, string>;
    headers: (colIndex: number, sortable?: boolean) => Record<string, string>;
    cells: (rowIndex: number, colIndex: number) => Record<string, string>;
  } {
    return {
      table: {
        role: 'table',
        ...(config.caption && { 'aria-label': i18nService.translate(config.caption) }),
        ...(config.rowCount && { 'aria-rowcount': config.rowCount.toString() }),
        ...(config.colCount && { 'aria-colcount': config.colCount.toString() })
      },
      caption: config.caption ? {
        role: 'caption'
      } : undefined,
      headers: (colIndex: number, sortable: boolean = false) => {
        const attrs: Record<string, string> = {
          role: 'columnheader',
          'aria-colindex': (colIndex + 1).toString()
        };
        
        if (sortable) {
          attrs['aria-sort'] = (config.sortColumn === colIndex) 
            ? config.sortDirection || 'none'
            : 'none';
        }
        
        return attrs;
      },
      cells: (rowIndex: number, colIndex: number) => ({
        role: 'cell',
        'aria-rowindex': (rowIndex + 1).toString(),
        'aria-colindex': (colIndex + 1).toString()
      })
    };
  }

  /**
   * Create accessible modal configuration
   */
  createModalAria(config: {
    title: string;
    describedBy?: string;
    modal?: boolean;
  }): Record<string, string> {
    return {
      role: 'dialog',
      'aria-label': i18nService.translate(config.title),
      ...(config.describedBy && { 'aria-describedby': config.describedBy }),
      'aria-modal': config.modal !== false ? 'true' : 'false'
    };
  }

  /**
   * Create accessible list configuration
   */
  createListAria(config: {
    label?: string;
    multiselectable?: boolean;
    orientation?: 'horizontal' | 'vertical';
    setSize?: number;
  }): {
    list: Record<string, string>;
    item: (index: number, selected?: boolean) => Record<string, string>;
  } {
    return {
      list: {
        role: 'list',
        ...(config.label && { 'aria-label': i18nService.translate(config.label) }),
        ...(config.multiselectable && { 'aria-multiselectable': 'true' }),
        ...(config.orientation && { 'aria-orientation': config.orientation })
      },
      item: (index: number, selected?: boolean) => {
        const attrs: Record<string, string> = {
          role: 'listitem',
          'aria-posinset': (index + 1).toString()
        };
        
        if (config.setSize) {
          attrs['aria-setsize'] = config.setSize.toString();
        }
        
        if (selected !== undefined) {
          attrs['aria-selected'] = selected.toString();
        }
        
        return attrs;
      }
    };
  }

  /**
   * Handle focus management for complex widgets
   */
  manageFocus(config: {
    container: HTMLElement;
    activeIndex: number;
    items: HTMLElement[];
    circular?: boolean;
    orientation?: 'horizontal' | 'vertical';
  }): {
    handleKeyDown: (event: KeyboardEvent) => void;
    setActiveIndex: (index: number) => void;
  } {
    const { container, items, circular = true, orientation = 'vertical' } = config;
    let { activeIndex } = config;

    const setActiveIndex = (index: number) => {
      // Remove focus from current item
      items[activeIndex]?.setAttribute('tabindex', '-1');
      
      // Set new active index
      activeIndex = Math.max(0, Math.min(index, items.length - 1));
      
      // Set focus to new item
      items[activeIndex]?.setAttribute('tabindex', '0');
      items[activeIndex]?.focus();
      
      container.setAttribute('aria-activedescendant', items[activeIndex]?.id || '');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const isVertical = orientation === 'vertical';
      const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
      const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
      
      switch (event.key) {
        case nextKey:
          event.preventDefault();
          const nextIndex = activeIndex + 1;
          setActiveIndex(circular && nextIndex >= items.length ? 0 : nextIndex);
          break;
          
        case prevKey:
          event.preventDefault();
          const prevIndex = activeIndex - 1;
          setActiveIndex(circular && prevIndex < 0 ? items.length - 1 : prevIndex);
          break;
          
        case 'Home':
          event.preventDefault();
          setActiveIndex(0);
          break;
          
        case 'End':
          event.preventDefault();
          setActiveIndex(items.length - 1);
          break;
      }
    };

    return { handleKeyDown, setActiveIndex };
  }

  /**
   * Destroy live regions and clean up
   */
  destroy(): void {
    this.liveRegions.forEach(region => {
      region.remove();
    });
    this.liveRegions.clear();
    this.announceQueue = [];
    this.isProcessingQueue = false;
  }
}

export const ariaService = new AriaService();
export default ariaService;