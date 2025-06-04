import { cn } from '@/lib/utils';
import { AlignCenter, AlignLeft, AlignRight, Bold, Heading1, Heading2, Image, Italic, Link as LinkIcon, List, ListOrdered } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './button';
import './rich-text-editor.css'; // Import the external CSS file
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  onBlur?: () => void;
  onFocus?: () => void;
  className?: string;
  toolbarClassName?: string;
  contentClassName?: string;
  readOnly?: boolean;
}

export const RichTextEditor = ({
  id,
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = '200px',
  maxHeight = '500px',
  onBlur,
  onFocus,
  className,
  toolbarClassName,
  contentClassName,
  readOnly = false,
  ...props
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize editor content and set CSS variables
  useEffect(() => {
    if (editorRef.current) {
      // Set CSS variables for height
      editorRef.current.style.setProperty('--min-height', minHeight);
      editorRef.current.style.setProperty('--max-height', maxHeight);
    }
  }, [minHeight, maxHeight]);

  // Handle input changes - now directly from textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    
    // Update the hidden div to render the HTML content
    if (editorRef.current) {
      editorRef.current.innerHTML = e.target.value;
    }
  };

  // Handle focus and blur events
  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  // Format the current selection with the given format
  const formatSelection = (format: string, value?: string) => {
    if (!hiddenTextareaRef.current || readOnly) return;
    
    const textarea = hiddenTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (start === end) return; // No text selected
    
    let formattedText = '';
    
    switch (format) {
      case 'bold': {
        formattedText = `<strong>${selectedText}</strong>`;
        break;
      }
      case 'italic': {
        formattedText = `<em>${selectedText}</em>`;
        break;
      }
      case 'heading': {
        formattedText = `<h${value ?? '2'}>${selectedText}</h${value ?? '2'}>`;
        break;
      }
      case 'list': {
        if (value === 'ordered') {
          formattedText = `<ol><li>${selectedText}</li></ol>`;
        } else {
          formattedText = `<ul><li>${selectedText}</li></ul>`;
        }
        break;
      }
      case 'link': {
        const url = value ?? '#';
        formattedText = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;
        break;
      }
      default:
        return;
    }
    
    // Update the textarea value with the formatted text
    const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    onChange(newValue);
    
    // Restore focus to the textarea
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };
  
  // For backwards compatibility
  const execCommand = (command: string, value: string = '') => {
    formatSelection(command, value);
  };

  // Handle format actions
  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnorderedList = () => execCommand('list');
  const handleOrderedList = () => execCommand('list', 'ordered');
  const handleHeading1 = () => execCommand('heading', '1');
  const handleHeading2 = () => execCommand('heading', '2');
  const handleAlignLeft = () => execCommand('align', 'left');
  const handleAlignCenter = () => execCommand('align', 'center');
  const handleAlignRight = () => execCommand('align', 'right');

  // Handle link insertion
  const handleLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('link', url);
    }
  };

  // Handle image insertion
  const handleImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      execCommand('insertImage', url);
    }
  };
  
  // Handle keyboard events for the editor
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          handleBold();
          break;
        case 'i':
          e.preventDefault();
          handleItalic();
          break;
        default:
          break;
      }
    }
  };

  const uniqueId = id ?? `rich-editor-${Math.random().toString(36).substring(2, 9)}`;
  const descriptionId = `${uniqueId}-description`;

  return (
    <div 
      className={cn(
        'rte-container',
        isFocused ? 'rte-container-focused' : '',
        className
      )}
      {...props}
    >
      {!readOnly && (
        <div 
          className={cn('rte-toolbar', toolbarClassName)}
          aria-label="Formatting options"
          role="toolbar"
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleBold}
                  type="button"
                  aria-label="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bold (Ctrl+B)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleItalic}
                  type="button"
                  aria-label="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Italic (Ctrl+I)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleHeading1}
                  type="button"
                  aria-label="Heading 1"
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 1</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleHeading2}
                  type="button"
                  aria-label="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Heading 2</TooltipContent>
            </Tooltip>

            <span className="h-6 mx-1 border-r border-[hsl(215,16%,80%)]"></span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleUnorderedList}
                  type="button"
                  aria-label="Bullet list"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Bullet List</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleOrderedList}
                  type="button"
                  aria-label="Numbered list"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Numbered List</TooltipContent>
            </Tooltip>

            <span className="h-6 mx-1 border-r border-[hsl(215,16%,80%)]"></span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleAlignLeft}
                  type="button"
                  aria-label="Align left"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Left</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleAlignCenter}
                  type="button"
                  aria-label="Align center"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Center</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleAlignRight}
                  type="button"
                  aria-label="Align right"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Align Right</TooltipContent>
            </Tooltip>

            <span className="h-6 mx-1 border-r border-[hsl(215,16%,80%)]"></span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleLink}
                  type="button"
                  aria-label="Insert link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Link</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0" 
                  onClick={handleImage}
                  type="button"
                  aria-label="Insert image"
                >
                  <Image className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Image</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Editor */}
      <div className="rte-wrapper">
        {/* Native textarea for accessibility and editing */}
        <label htmlFor={`${uniqueId}-textarea`} className="sr-only">Rich text content</label>
        <textarea
          ref={hiddenTextareaRef}
          id={`${uniqueId}-textarea`}
          className={cn(
            'rte-editor',
            contentClassName,
            readOnly ? 'read-only' : '',
            'rte-editor--min-height',
            'rte-editor--max-height'
          )}
          value={value}
          onChange={handleInput}
          placeholder={placeholder}
          disabled={readOnly}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          aria-label={placeholder ?? 'Rich text editor'}
          aria-describedby={descriptionId}
        />
        
        {/* Hidden div for rendering formatted content - only for internal use */}
        <div 
          ref={editorRef}
          className="sr-only"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: value || '' }}
        />
        
        {/* Accessible description */}
        <div id={descriptionId} className="sr-only">
          Use the toolbar above to format your text. Press Enter to create a new paragraph. 
          Use Ctrl+B for bold and Ctrl+I for italic.
        </div>
      </div>
    </div>
  );
};

export default RichTextEditor;
